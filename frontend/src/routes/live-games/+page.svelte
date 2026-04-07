<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  import { goto } from "$app/navigation";
  import { can_role_access_route } from "$lib/adapters/iam/LocalAuthorizationAdapter";
  import type { Fixture } from "$lib/core/entities/Fixture";
  import type { Organization } from "$lib/core/entities/Organization";
  import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
  import LiveGamesPageContent from "$lib/presentation/components/game/LiveGamesPageContent.svelte";
  import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
  import { validate_live_games_start_permission } from "$lib/presentation/logic/liveGamesAccessLogic";
  import { can_user_change_live_games_organization } from "$lib/presentation/logic/liveGamesDataLoader";
  import { live_games_page_dependencies } from "$lib/presentation/logic/liveGamesPageDependencies";
  import { start_live_game_fixture } from "$lib/presentation/logic/liveGamesStartFlow";
  import { access_denial_store } from "$lib/presentation/stores/accessDenial";
  import { auth_store } from "$lib/presentation/stores/auth";

  import {
    build_live_games_start_flow_dependencies,
    get_live_games_current_profile,
    get_live_games_current_role,
    initialize_live_games_page,
    refresh_live_games_page_fixture_state,
    update_live_games_checks,
    update_live_games_starting_state,
  } from "../../lib/presentation/logic/liveGamesPageState";

  const fixture_state_dependencies = live_games_page_dependencies;

  let organizations: Organization[] = [],
    incomplete_fixtures: Fixture[] = [];
  let selected_organization_id = "",
    is_loading = true,
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

  async function refresh_fixture_state(): Promise<void> {
    if (!selected_organization_id) return;

    is_loading_fixtures = true;
    error_message = "";
    current_checks = {};
    is_starting = {};

    ({
      fixtures: incomplete_fixtures,
      team_names,
      team_logo_urls,
      competition_names,
      sport_names,
    } = await refresh_live_games_page_fixture_state({
      auth_state: get(auth_store),
      fixture_state_dependencies,
      organization_id: selected_organization_id,
    }));
    is_loading_fixtures = false;
  }

  async function initialize_page(): Promise<void> {
    const result = await initialize_live_games_page({
      ensure_auth_profile,
      auth_state: get(auth_store),
      authorization_adapter: live_games_page_dependencies.authorization_adapter,
      organization_use_cases:
        live_games_page_dependencies.organization_use_cases,
      fixture_state_dependencies,
    });
    if (result.status === "error") {
      error_message = result.error_message;
      is_loading = false;
      return;
    }

    if (result.status === "denied") {
      access_denial_store.set_denial("/live-games", result.denial_reason);
      await goto("/");
      return;
    }

    organizations = result.organizations;
    selected_organization_id = result.selected_organization_id;
    can_start_games = result.can_start_games;
    permission_info_message = result.permission_info_message;
    ({
      fixtures: incomplete_fixtures,
      team_names,
      team_logo_urls,
      competition_names,
      sport_names,
    } = result.fixture_state);
    is_loading = false;
  }

  onMount(() => {
    void initialize_page();
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
      live_games_page_dependencies.authorization_adapter,
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
    void start_live_game_fixture(
      fixture,
      build_live_games_start_flow_dependencies({
        ...live_games_page_dependencies,
        goto,
        get_current_role: () => get_live_games_current_role(get(auth_store)),
        can_access_route: (role: string, route: string) =>
          can_role_access_route(role as never, route).allowed,
        update_checks: (fixture_id: string, checks: PreFlightCheck[]) => {
          current_checks = update_live_games_checks(
            current_checks,
            fixture_id,
            checks,
          );
        },
        set_is_starting: (fixture_id: string, value: boolean) => {
          is_starting = update_live_games_starting_state(
            is_starting,
            fixture_id,
            value,
          );
        },
      }),
    );
  }
</script>

<LiveGamesPageContent
  {organizations}
  bind:selected_organization_id
  can_change_organizations={can_user_change_live_games_organization(
    get_live_games_current_profile(get(auth_store)),
  )}
  {is_loading_fixtures}
  on_organization_change={handle_organization_change}
  {permission_info_message}
  {is_loading}
  {error_message}
  {incomplete_fixtures}
  {can_start_games}
  {team_names}
  {team_logo_urls}
  {competition_names}
  {sport_names}
  {current_checks}
  {is_starting}
  on_start_click={handle_start_click}
  {pending_start_fixture}
  on_cancel_start={cancel_start_fixture}
  on_confirm_start={confirm_start_fixture}
/>
