<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";
  import { can_role_access_route } from "$lib/adapters/iam/LocalAuthorizationAdapter";
  import type { Fixture } from "$lib/core/entities/Fixture";
  import type { Organization } from "$lib/core/entities/Organization";
  import { type UserScopeProfile } from "$lib/core/interfaces/ports";
  import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
  import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
  import {
    get_competition_use_cases,
    get_fixture_details_setup_use_cases,
    get_fixture_lineup_use_cases,
    get_fixture_use_cases,
    get_game_official_role_use_cases,
    get_jersey_color_use_cases,
    get_official_use_cases,
    get_organization_use_cases,
    get_player_position_use_cases,
    get_player_team_membership_use_cases,
    get_player_use_cases,
    get_sport_use_cases,
    get_team_use_cases,
  } from "$lib/infrastructure/registry/useCaseFactories";
  import LiveGamesBody from "$lib/presentation/components/game/LiveGamesBody.svelte";
  import LiveGamesHeader from "$lib/presentation/components/game/LiveGamesHeader.svelte";
  import LiveGameStartConfirmationDialog from "$lib/presentation/components/game/LiveGameStartConfirmationDialog.svelte";
  import {
    load_live_games_permissions,
    validate_live_games_start_permission,
  } from "$lib/presentation/logic/liveGamesAccessLogic";
  import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
  import {
    can_user_change_live_games_organization,
    load_live_games_fixture_state,
    load_live_games_organizations,
  } from "$lib/presentation/logic/liveGamesDataLoader";
  import { start_live_game_fixture } from "$lib/presentation/logic/liveGamesStartFlow";
  import { auth_store } from "$lib/presentation/stores/auth";
  import { access_denial_store } from "$lib/presentation/stores/accessDenial";

  const authorization_adapter = get_authorization_adapter();
  const fixture_use_cases = get_fixture_use_cases();
  const fixture_details_setup_use_cases = get_fixture_details_setup_use_cases();
  const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
  const membership_use_cases = get_player_team_membership_use_cases();
  const player_use_cases = get_player_use_cases();
  const player_position_use_cases = get_player_position_use_cases();
  const team_use_cases = get_team_use_cases();
  const sport_use_cases = get_sport_use_cases();
  const competition_use_cases = get_competition_use_cases();
  const organization_use_cases = get_organization_use_cases();
  const jersey_color_use_cases = get_jersey_color_use_cases();
  const official_use_cases = get_official_use_cases();
  const game_official_role_use_cases = get_game_official_role_use_cases();
  const check_delay_ms = 800;

  let organizations: Organization[] = [],
    selected_organization_id = "",
    incomplete_fixtures: Fixture[] = [];
  let is_loading = true,
    is_loading_fixtures = false,
    error_message = "",
    can_start_games = false,
    permission_info_message = "";
  let current_checks: Record<string, PreFlightCheck[]> = {},
    is_starting: Record<string, boolean> = {};
  let team_names: Record<string, string> = {},
    team_logo_urls: Record<string, string> = {},
    competition_names: Record<string, string> = {},
    sport_names: Record<string, string> = {};
  let pending_start_fixture: Fixture | null = null;

  function get_current_profile(): UserScopeProfile | null {
    return get(auth_store).current_profile as UserScopeProfile | null;
  }
  function get_current_role(): string {
    return (
      (get(auth_store).current_profile as { role?: string } | null)?.role ||
      "player"
    );
  }
  function update_checks(fixture_id: string, checks: PreFlightCheck[]): void {
    current_checks = { ...current_checks, [fixture_id]: [...checks] };
  }
  function set_is_starting(fixture_id: string, value: boolean): void {
    is_starting = { ...is_starting, [fixture_id]: value };
  }
  function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async function refresh_fixture_state(): Promise<void> {
    if (!selected_organization_id) return;
    is_loading_fixtures = true;
    error_message = "";
    current_checks = {};
    is_starting = {};
    const result = await load_live_games_fixture_state(
      {
        fixture_use_cases,
        team_use_cases,
        competition_use_cases,
        organization_use_cases,
        sport_use_cases,
      },
      get_current_profile(),
      selected_organization_id,
    );
    incomplete_fixtures = result.fixtures;
    team_names = result.team_names;
    team_logo_urls = result.team_logo_urls;
    competition_names = result.competition_names;
    sport_names = result.sport_names;
    is_loading_fixtures = false;
  }

  async function initialize_page(): Promise<void> {
    const auth_result = await ensure_auth_profile();
    if (!auth_result.success) {
      error_message = auth_result.error_message;
      is_loading = false;
      return;
    }
    const auth_state = get(auth_store);
    if (!auth_state.current_token) {
      error_message = "No user profile found";
      is_loading = false;
      return;
    }
    const permissions = await load_live_games_permissions(
      auth_state.current_token.raw_token,
      authorization_adapter,
    );
    if (!permissions.authorization_succeeded) {
      is_loading = false;
      return;
    }
    if (!permissions.is_read_authorized) {
      access_denial_store.set_denial("/live-games", permissions.denial_reason);
      await goto("/");
      return;
    }
    can_start_games = permissions.can_start_games;
    permission_info_message = permissions.permission_info_message;
    organizations = await load_live_games_organizations(
      { organization_use_cases },
      get_current_profile(),
    );
    selected_organization_id = organizations[0]?.id || "";
    if (selected_organization_id) await refresh_fixture_state();
    is_loading = false;
  }

  onMount(async () => {
    if (browser) await initialize_page();
  });
  async function handle_organization_change(): Promise<void> {
    pending_start_fixture = null;
    await refresh_fixture_state();
  }
  async function handle_start_click(fixture: Fixture): Promise<void> {
    const auth_state = get(auth_store);
    if (!auth_state.current_token) {
      error_message = "No user profile found";
      return;
    }
    const start_permission_error = await validate_live_games_start_permission(
      auth_state.current_token.raw_token,
      authorization_adapter,
    );
    if (start_permission_error) {
      error_message = start_permission_error;
      return;
    }
    pending_start_fixture = fixture;
  }

  function cancel_start_fixture(): void {
    pending_start_fixture = null;
  }
  function confirm_start_fixture(): void {
    if (!pending_start_fixture) return;
    const fixture = pending_start_fixture;
    pending_start_fixture = null;
    void start_live_game_fixture(fixture, {
      fixture_details_setup_use_cases,
      fixture_lineup_use_cases,
      membership_use_cases,
      player_use_cases,
      player_position_use_cases,
      fixture_use_cases,
      team_use_cases,
      sport_use_cases,
      competition_use_cases,
      organization_use_cases,
      jersey_color_use_cases,
      official_use_cases,
      game_official_role_use_cases,
      goto,
      get_current_role,
      can_access_route: (role, route) =>
        can_role_access_route(role as never, route).allowed,
      update_checks,
      set_is_starting,
      delay,
      check_delay_ms,
    });
  }
</script>

<div class="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
  <LiveGamesHeader
    {organizations}
    bind:selected_organization_id
    can_change_organizations={can_user_change_live_games_organization(
      get_current_profile(),
    )}
    {is_loading_fixtures}
    on_organization_change={handle_organization_change}
  />
  {#if permission_info_message}
    <div
      class="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg mb-4"
    >
      <p class="text-sm text-blue-800 dark:text-blue-200">
        {permission_info_message}
      </p>
    </div>
  {/if}
  <LiveGamesBody
    {is_loading}
    {error_message}
    has_organizations={organizations.length > 0}
    {is_loading_fixtures}
    {incomplete_fixtures}
    {can_start_games}
    {team_names}
    {team_logo_urls}
    {competition_names}
    {sport_names}
    {current_checks}
    {is_starting}
    on_start_click={handle_start_click}
  />
</div>

<LiveGameStartConfirmationDialog
  fixture={pending_start_fixture}
  {team_names}
  on_cancel={cancel_start_fixture}
  on_confirm={confirm_start_fixture}
/>
