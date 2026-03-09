<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
  import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
  import type { Team } from "$lib/core/entities/Team";
  import type { Competition } from "$lib/core/entities/Competition";
  import type { Sport } from "$lib/core/entities/Sport";
  import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
  import {
    get_event_icon,
    get_event_label,
    format_event_time,
    get_period_display_name,
  } from "$lib/core/entities/Fixture";
  import { get_official_full_name } from "$lib/core/entities/Official";
  import { get_team_staff_full_name } from "$lib/core/entities/TeamStaff";
  import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_fixture_lineup_use_cases } from "$lib/core/usecases/FixtureLineupUseCases";
  import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
  import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
  import { get_sport_use_cases } from "$lib/core/usecases/SportUseCases";
  import { get_venue_use_cases } from "$lib/core/usecases/VenueUseCases";
  import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
  import { get_team_staff_use_cases } from "$lib/core/usecases/TeamStaffUseCases";
  import type { MatchStaffEntry } from "$lib/core/types/MatchReportTypes";
  import type { CardTypeConfig } from "$lib/core/types/MatchReportTypes";
  import type { Venue } from "$lib/core/entities/Venue";
  import type { Official } from "$lib/core/entities/Official";
  import Toast from "$lib/presentation/components/ui/Toast.svelte";
  import {
    build_match_report_data,
    generate_match_report_filename,
    type MatchReportBuildContext,
  } from "$lib/infrastructure/utils/MatchReportBuilder";
  import { download_match_report } from "$lib/infrastructure/utils/MatchReportPdfGenerator";
  import { branding_store } from "$lib/presentation/stores/branding";
  import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";
  import { is_public_viewer } from "$lib/presentation/stores/auth";
  import { get } from "svelte/store";

  const LIVE_POLL_INTERVAL_MS = 10000;

  const fixture_use_cases = get_fixture_use_cases();
  const team_use_cases = get_team_use_cases();
  const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
  const competition_use_cases = get_competition_use_cases();
  const organization_use_cases = get_organization_use_cases();
  const sport_use_cases = get_sport_use_cases();
  const venue_use_cases = get_venue_use_cases();
  const official_use_cases = get_official_use_cases();
  const team_staff_use_cases = get_team_staff_use_cases();

  let fixture: Fixture | null = null;
  let home_team: Team | null = null;
  let away_team: Team | null = null;
  let competition: Competition | null = null;
  let sport: Sport | null = null;
  let venue: Venue | null = null;
  let organization_name: string = "";
  let assigned_officials_data: Array<{
    official: Official;
    role_name: string;
  }> = [];
  let home_players: LineupPlayer[] = [];
  let away_players: LineupPlayer[] = [];
  let is_loading: boolean = true;
  let error_message: string = "";
  let downloading_report: boolean = false;
  let live_poll_interval: ReturnType<typeof setInterval> | null = null;

  let home_lineup_expanded: boolean = true;
  let away_lineup_expanded: boolean = true;

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  function toggle_home_lineup(): boolean {
    home_lineup_expanded = !home_lineup_expanded;
    return home_lineup_expanded;
  }

  function toggle_away_lineup(): boolean {
    away_lineup_expanded = !away_lineup_expanded;
    return away_lineup_expanded;
  }

  function get_starters_from_lineup(players: LineupPlayer[]): LineupPlayer[] {
    return players.filter((p) => !p.is_substitute);
  }

  function get_substitutes_from_lineup(
    players: LineupPlayer[],
  ): LineupPlayer[] {
    return players.filter((p) => p.is_substitute);
  }

  $: fixture_id = $page.params.id ?? "";
  $: home_score = fixture?.home_team_score ?? 0;
  $: away_score = fixture?.away_team_score ?? 0;
  $: game_events = fixture?.game_events ?? [];
  $: sorted_events = [...game_events].sort(
    (a, b) =>
      a.minute - b.minute ||
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
  $: home_starters = get_starters_from_lineup(home_players);
  $: home_substitutes = get_substitutes_from_lineup(home_players);
  $: away_starters = get_starters_from_lineup(away_players);
  $: away_substitutes = get_substitutes_from_lineup(away_players);
  $: is_game_scheduled = fixture?.status === "scheduled";
  $: is_game_in_progress = fixture?.status === "in_progress";
  $: is_game_completed = fixture?.status === "completed";
  $: has_lineups = home_players.length > 0 || away_players.length > 0;

  onMount(async () => {
    if (!browser) return;

    const auth_result = await ensure_auth_profile();
    const is_public = get(is_public_viewer);
    if (!auth_result.success && !is_public) {
      error_message = auth_result.error_message;
      is_loading = false;
      return;
    }

    if (!fixture_id) {
      error_message = "No fixture ID provided";
      is_loading = false;
      return;
    }

    await fetch_public_data_from_convex("match_report");
    await load_match_data();
    start_live_polling_if_needed();
  });

  onDestroy(() => {
    stop_live_polling();
  });

  function start_live_polling_if_needed(): void {
    if (!fixture) return;
    if (fixture.status !== "in_progress" && fixture.status !== "scheduled")
      return;
    if (live_poll_interval) return;

    console.log(
      "[MatchViewer] Starting live polling every",
      LIVE_POLL_INTERVAL_MS,
      "ms",
    );
    live_poll_interval = setInterval(
      refresh_fixture_data,
      LIVE_POLL_INTERVAL_MS,
    );
  }

  function stop_live_polling(): void {
    if (!live_poll_interval) return;
    clearInterval(live_poll_interval);
    live_poll_interval = null;
    console.log("[MatchViewer] Stopped live polling");
  }

  async function refresh_fixture_data(): Promise<boolean> {
    if (!fixture_id) return false;

    const result = await fixture_use_cases.get_by_id(fixture_id);
    if (!result.success || !result.data) return false;

    const refreshed_fixture = result.data;
    fixture = refreshed_fixture;

    if (refreshed_fixture.status === "completed") {
      stop_live_polling();
    }

    const [home_lineup_result, away_lineup_result] = await Promise.all([
      fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture_id,
        refreshed_fixture.home_team_id,
      ),
      fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture_id,
        refreshed_fixture.away_team_id,
      ),
    ]);

    if (home_lineup_result.success && home_lineup_result.data) {
      home_players = home_lineup_result.data.selected_players;
    }
    if (away_lineup_result.success && away_lineup_result.data) {
      away_players = away_lineup_result.data.selected_players;
    }

    return true;
  }

  async function load_match_data(): Promise<boolean> {
    console.log(
      "[MatchViewer] load_match_data() starting, fixture_id:",
      fixture_id,
    );
    is_loading = true;
    error_message = "";

    const result = await fixture_use_cases.get_by_id(fixture_id);

    if (!result.success || !result.data) {
      error_message = !result.success
        ? result.error || "Failed to load match"
        : "Failed to load match";
      is_loading = false;
      return false;
    }

    fixture = result.data;
    const loaded_fixture: Fixture = result.data;

    const [home_result, away_result] = await Promise.all([
      team_use_cases.get_by_id(loaded_fixture.home_team_id),
      team_use_cases.get_by_id(loaded_fixture.away_team_id),
    ]);

    if (home_result.success && home_result.data) home_team = home_result.data;
    if (away_result.success && away_result.data) away_team = away_result.data;

    if (loaded_fixture.competition_id) {
      const competition_result = await competition_use_cases.get_by_id(
        loaded_fixture.competition_id,
      );
      if (competition_result.success && competition_result.data) {
        competition = competition_result.data;
        const loaded_competition: Competition = competition_result.data;

        if (loaded_competition.organization_id) {
          const org_result = await organization_use_cases.get_by_id(
            loaded_competition.organization_id,
          );
          if (org_result.success && org_result.data) {
            organization_name = org_result.data.name;
            if (org_result.data.sport_id) {
              const sport_result = await sport_use_cases.get_by_id(
                org_result.data.sport_id,
              );
              if (sport_result.success && sport_result.data) {
                sport = sport_result.data;
              }
            }
          }
        }
      }
    }

    const [home_lineup_result, away_lineup_result] = await Promise.all([
      fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture_id,
        loaded_fixture.home_team_id,
      ),
      fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture_id,
        loaded_fixture.away_team_id,
      ),
    ]);

    if (home_lineup_result.success && home_lineup_result.data) {
      home_players = home_lineup_result.data.selected_players;
    } else {
      home_players = [];
    }

    if (away_lineup_result.success && away_lineup_result.data) {
      away_players = away_lineup_result.data.selected_players;
    } else {
      away_players = [];
    }

    if (loaded_fixture.venue) {
      const venue_result = await venue_use_cases.get_by_id(
        loaded_fixture.venue,
      );
      if (venue_result.success && venue_result.data) {
        venue = venue_result.data;
      }
    }

    if (
      loaded_fixture.assigned_officials &&
      loaded_fixture.assigned_officials.length > 0
    ) {
      const officials_promises = loaded_fixture.assigned_officials.map(
        async (assignment) => {
          const official_result = await official_use_cases.get_by_id(
            assignment.official_id,
          );
          if (official_result.success && official_result.data) {
            return {
              official: official_result.data,
              role_name: assignment.role_name,
            };
          }
          return null;
        },
      );
      const results = await Promise.all(officials_promises);
      assigned_officials_data = results.filter(
        (r): r is { official: Official; role_name: string } => r !== null,
      );
    }

    is_loading = false;
    return true;
  }

  function get_event_bg_class(event: GameEvent): string {
    switch (event.event_type) {
      case "goal":
      case "penalty_scored":
        return "border-l-green-500 bg-green-50 dark:bg-green-900/20";
      case "own_goal":
        return "border-l-orange-500 bg-orange-50 dark:bg-orange-900/20";
      case "yellow_card":
        return "border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "red_card":
      case "second_yellow":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
      case "substitution":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "period_start":
      case "period_end":
        return "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20";
      default:
        return "border-l-gray-300 bg-gray-50 dark:bg-accent-800";
    }
  }

  function get_status_color(status: string): string {
    switch (status) {
      case "in_progress":
        return "text-green-400";
      case "completed":
        return "text-gray-400";
      default:
        return "text-primary-400";
    }
  }

  function get_status_label(status: string): string {
    switch (status) {
      case "completed":
        return "Full Time";
      case "in_progress":
        return "LIVE";
      case "scheduled":
        return "Upcoming";
      default:
        return status;
    }
  }

  function format_kickoff_display(date: string, time: string): string {
    if (!date) return time || "TBD";

    const parts: string[] = [];
    try {
      const date_obj = new Date(date + "T00:00:00");
      parts.push(
        date_obj.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      );
    } catch {
      parts.push(date);
    }

    if (time) parts.push(time);
    return parts.join(" · ");
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info",
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function navigate_back(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      goto("/competition-results");
    }
  }

  async function handle_download_match_report(): Promise<boolean> {
    if (!fixture || !home_team || !away_team) return false;

    downloading_report = true;

    let organization_name = "SPORTS ORGANIZATION";
    if (competition?.organization_id) {
      const org_result = await organization_use_cases.get_by_id(
        competition.organization_id,
      );
      if (org_result.success && org_result.data) {
        organization_name = org_result.data.name.toUpperCase();
      }
    }

    const staff_roles_result = await team_staff_use_cases.list_staff_roles();
    const staff_roles_map = new Map<string, string>();
    if (staff_roles_result.success && staff_roles_result.data) {
      for (const role of staff_roles_result.data) {
        staff_roles_map.set(role.id, role.name);
      }
    }

    const [home_staff_result, away_staff_result] = await Promise.all([
      team_staff_use_cases.list_staff_by_team(fixture.home_team_id),
      team_staff_use_cases.list_staff_by_team(fixture.away_team_id),
    ]);

    const home_staff: MatchStaffEntry[] = [];
    if (home_staff_result.success && home_staff_result.data) {
      for (const staff of home_staff_result.data.items) {
        home_staff.push({
          role: staff_roles_map.get(staff.role_id) || "Staff",
          name: get_team_staff_full_name(staff),
        });
      }
    }

    const away_staff: MatchStaffEntry[] = [];
    if (away_staff_result.success && away_staff_result.data) {
      for (const staff of away_staff_result.data.items) {
        away_staff.push({
          role: staff_roles_map.get(staff.role_id) || "Staff",
          name: get_team_staff_full_name(staff),
        });
      }
    }

    const card_types: CardTypeConfig[] =
      sport?.card_types?.map((ct) => ({
        id: ct.id,
        name: ct.name,
        color: ct.color,
        event_type: ct.id + "_card",
      })) || [];

    const ctx: MatchReportBuildContext = {
      fixture,
      home_team,
      away_team,
      competition,
      home_lineup: home_players,
      away_lineup: away_players,
      assigned_officials: assigned_officials_data,
      home_staff,
      away_staff,
      card_types,
      organization_name,
      venue_name: venue?.name,
      organization_logo_url: $branding_store.organization_logo_url,
    };

    const report_data = build_match_report_data(ctx);
    const filename = generate_match_report_filename(
      home_team.name,
      away_team.name,
      fixture.scheduled_date,
    );
    download_match_report(report_data, filename);

    downloading_report = false;
    show_toast("Match report downloaded!", "success");
    return true;
  }
</script>

<svelte:head>
  <title>
    {fixture
      ? `${home_team?.name ?? "Home"} vs ${away_team?.name ?? "Away"} - Match Viewer`
      : "Match Viewer"} - Sports Management
  </title>
</svelte:head>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900">
  {#if is_loading}
    <div class="flex justify-center items-center min-h-screen">
      <div
        class="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"
      ></div>
    </div>
  {:else if error_message}
    <div class="max-w-2xl mx-auto p-6">
      <div
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
      >
        <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
          Error Loading Match
        </h3>
        <p class="text-red-600 dark:text-red-400">{error_message}</p>
        <button
          type="button"
          class="btn btn-outline mt-4"
          on:click={navigate_back}>Go Back</button
        >
      </div>
    </div>
  {:else if fixture}
    <div class="flex flex-col min-h-screen">
      <div class="bg-gray-900 text-white px-4 py-4 sticky top-0 z-40">
        <div class="max-w-4xl mx-auto">
          {#if organization_name || competition?.name}
            <div class="text-center pb-2">
              {#if organization_name}
                <p
                  class="text-xs uppercase tracking-widest text-gray-400 font-medium"
                >
                  {organization_name}
                </p>
              {/if}
              {#if competition?.name}
                <p class="text-sm font-semibold text-gray-200">
                  {competition.name}
                </p>
              {/if}
            </div>
          {/if}
          <div class="flex items-center justify-between mb-3">
            <button
              type="button"
              class="p-2 hover:bg-gray-800 rounded-lg"
              on:click={navigate_back}
              aria-label="Go back"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>

            <div class="flex items-center gap-2">
              {#if is_game_in_progress}
                <span class="relative flex h-2.5 w-2.5">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                  ></span>
                  <span
                    class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"
                  ></span>
                </span>
              {/if}
              <span
                class="text-xs font-semibold uppercase tracking-wider {get_status_color(
                  fixture.status,
                )}"
              >
                {get_status_label(fixture.status)}
              </span>
              {#if is_game_in_progress && fixture.current_period}
                <span class="text-xs text-gray-500 mx-1">·</span>
                <span class="text-xs text-gray-400">
                  {get_period_display_name(fixture.current_period)}
                </span>
              {/if}
            </div>

            <div class="w-10"></div>
          </div>

          <div class="flex items-center gap-4 sm:gap-8 justify-center">
            <div class="text-center flex-1">
              <div
                class="text-sm sm:text-base font-medium text-gray-300 mb-2 truncate"
              >
                {home_team?.name ?? "HOME"}
              </div>
              {#if fixture?.home_team_jersey?.main_color}
                <div
                  class="w-8 h-8 rounded-full border-2 border-gray-600 mx-auto mb-2"
                  style="background-color: {fixture.home_team_jersey
                    .main_color}"
                ></div>
              {/if}
              <div class="text-4xl sm:text-5xl font-bold tabular-nums">
                {#if is_game_scheduled}
                  <span class="text-gray-500 text-3xl">-</span>
                {:else}
                  {home_score}
                {/if}
              </div>
            </div>

            <div class="text-center px-2">
              {#if is_game_in_progress}
                <div class="text-xs text-gray-500 mb-1">
                  {fixture.current_minute ?? 0}'
                </div>
              {/if}
              <div class="text-lg font-semibold text-gray-500">VS</div>
            </div>

            <div class="text-center flex-1">
              <div
                class="text-sm sm:text-base font-medium text-gray-300 mb-2 truncate"
              >
                {away_team?.name ?? "AWAY"}
              </div>
              {#if fixture?.away_team_jersey?.main_color}
                <div
                  class="w-8 h-8 rounded-full border-2 border-gray-600 mx-auto mb-2"
                  style="background-color: {fixture.away_team_jersey
                    .main_color}"
                ></div>
              {/if}
              <div class="text-4xl sm:text-5xl font-bold tabular-nums">
                {#if is_game_scheduled}
                  <span class="text-gray-500 text-3xl">-</span>
                {:else}
                  {away_score}
                {/if}
              </div>
            </div>
          </div>

          {#if is_game_completed}
            <div class="flex justify-center mt-4">
              <button
                class="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                disabled={downloading_report}
                on:click={handle_download_match_report}
              >
                {#if downloading_report}
                  <svg
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                {:else}
                  📄 Download Match Report
                {/if}
              </button>
            </div>
          {/if}
        </div>
      </div>

      <div
        class="bg-gray-800 text-gray-300 px-4 py-2 text-center text-sm border-t border-gray-700"
      >
        <div
          class="max-w-4xl mx-auto flex items-center justify-center gap-3 flex-wrap"
        >
          {#if competition}
            <span class="font-medium">{competition.name}</span>
            <span class="text-gray-600">·</span>
          {/if}
          <span class="text-gray-400">
            {format_kickoff_display(
              fixture.scheduled_date,
              fixture.scheduled_time,
            )}
          </span>
          {#if venue}
            <span class="text-gray-600">·</span>
            <span class="text-gray-400">📍 {venue.name}</span>
          {/if}
        </div>
      </div>

      {#if is_game_in_progress}
        <div class="bg-green-900/30 border-b border-green-800/50 px-4 py-2">
          <div class="max-w-4xl mx-auto flex items-center justify-center gap-2">
            <span class="relative flex h-2 w-2">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 bg-green-500"
              ></span>
            </span>
            <span class="text-sm text-green-300 font-medium">
              Match in progress — updates every {LIVE_POLL_INTERVAL_MS / 1000}s
            </span>
          </div>
        </div>
      {/if}

      <div class="flex-1 p-4">
        <div class="max-w-3xl mx-auto">
          {#if is_game_scheduled}
            <div
              class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 text-center"
            >
              <div
                class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto mb-4 flex items-center justify-center"
              >
                <span class="text-3xl">📅</span>
              </div>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                Match Not Yet Started
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Kick-off: {format_kickoff_display(
                  fixture.scheduled_date,
                  fixture.scheduled_time,
                )}
              </p>
              {#if venue}
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  📍 {venue.name}{venue.city
                    ? `, ${venue.city}`
                    : ""}{venue.country ? `, ${venue.country}` : ""}
                </p>
              {/if}
            </div>
          {/if}

          {#if has_lineups || is_game_scheduled || is_game_in_progress}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div
                class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  type="button"
                  class="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  on:click={() => toggle_home_lineup()}
                >
                  <span class="flex items-center gap-2">
                    <span class="text-blue-600 dark:text-blue-400">🏠</span>
                    <span
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {home_team?.name ?? "Home"} Lineup
                    </span>
                    <span
                      class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
                    >
                      {home_players.length}
                    </span>
                  </span>
                  <svg
                    class="w-5 h-5 text-gray-400 transition-transform duration-200 {home_lineup_expanded
                      ? 'rotate-180'
                      : ''}"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {#if home_lineup_expanded}
                  <div
                    class="border-t border-gray-200 dark:border-gray-700 p-3 bg-blue-50/50 dark:bg-blue-900/10 max-h-80 overflow-y-auto"
                  >
                    {#if home_players.length === 0}
                      <div
                        class="flex flex-col items-center justify-center py-6 gap-2"
                      >
                        <svg
                          class="w-8 h-8 text-gray-300 dark:text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <p
                          class="text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          Lineup Not Submitted
                        </p>
                        <p
                          class="text-xs text-gray-400 dark:text-gray-500 text-center"
                        >
                          This team hasn't submitted their lineup yet.
                        </p>
                      </div>
                    {:else}
                      <div class="space-y-3">
                        {#if home_starters.length > 0}
                          <div>
                            <div
                              class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-medium"
                            >
                              Starting XI
                            </div>
                            <div class="space-y-1">
                              {#each home_starters as player}
                                <div
                                  class="flex items-center gap-2 text-sm py-1"
                                >
                                  {#if player.jersey_number}
                                    <span
                                      class="w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded flex-shrink-0"
                                    >
                                      {player.jersey_number}
                                    </span>
                                  {:else}
                                    <span
                                      class="w-6 h-6 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded flex-shrink-0"
                                      >-</span
                                    >
                                  {/if}
                                  <span
                                    class="text-gray-800 dark:text-gray-200 truncate flex-1"
                                  >
                                    {player.first_name}
                                    {player.last_name}
                                    {#if player.is_captain}<span
                                        class="text-yellow-600 dark:text-yellow-400"
                                        >©</span
                                      >{/if}
                                  </span>
                                  {#if player.position}
                                    <span
                                      class="text-xs text-gray-500 dark:text-gray-400"
                                      >{player.position}</span
                                    >
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/if}
                        {#if home_substitutes.length > 0}
                          <div
                            class="border-t border-blue-200 dark:border-blue-700 pt-3"
                          >
                            <div
                              class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-medium"
                            >
                              Substitutes
                            </div>
                            <div class="space-y-1">
                              {#each home_substitutes as player}
                                <div
                                  class="flex items-center gap-2 text-sm py-1 opacity-80"
                                >
                                  {#if player.jersey_number}
                                    <span
                                      class="w-6 h-6 flex items-center justify-center bg-blue-400 text-white text-xs font-bold rounded flex-shrink-0"
                                    >
                                      {player.jersey_number}
                                    </span>
                                  {:else}
                                    <span
                                      class="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-xs rounded flex-shrink-0"
                                      >-</span
                                    >
                                  {/if}
                                  <span
                                    class="text-gray-700 dark:text-gray-300 truncate flex-1"
                                  >
                                    {player.first_name}
                                    {player.last_name}
                                  </span>
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/if}
                        {#if home_starters.length === 0}
                          <div class="space-y-1">
                            {#each home_players as player}
                              <div class="flex items-center gap-2 text-sm py-1">
                                {#if player.jersey_number}
                                  <span
                                    class="w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded flex-shrink-0"
                                  >
                                    {player.jersey_number}
                                  </span>
                                {:else}
                                  <span
                                    class="w-6 h-6 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded flex-shrink-0"
                                    >-</span
                                  >
                                {/if}
                                <span
                                  class="text-gray-800 dark:text-gray-200 truncate"
                                >
                                  {player.first_name}
                                  {player.last_name}
                                </span>
                              </div>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>

              <div
                class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  type="button"
                  class="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  on:click={() => toggle_away_lineup()}
                >
                  <span class="flex items-center gap-2">
                    <span class="text-red-600 dark:text-red-400">✈️</span>
                    <span
                      class="text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {away_team?.name ?? "Away"} Lineup
                    </span>
                    <span
                      class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
                    >
                      {away_players.length}
                    </span>
                  </span>
                  <svg
                    class="w-5 h-5 text-gray-400 transition-transform duration-200 {away_lineup_expanded
                      ? 'rotate-180'
                      : ''}"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {#if away_lineup_expanded}
                  <div
                    class="border-t border-gray-200 dark:border-gray-700 p-3 bg-red-50/50 dark:bg-red-900/10 max-h-80 overflow-y-auto"
                  >
                    {#if away_players.length === 0}
                      <div
                        class="flex flex-col items-center justify-center py-6 gap-2"
                      >
                        <svg
                          class="w-8 h-8 text-gray-300 dark:text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <p
                          class="text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          Lineup Not Submitted
                        </p>
                        <p
                          class="text-xs text-gray-400 dark:text-gray-500 text-center"
                        >
                          This team hasn't submitted their lineup yet.
                        </p>
                      </div>
                    {:else}
                      <div class="space-y-3">
                        {#if away_starters.length > 0}
                          <div>
                            <div
                              class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-medium"
                            >
                              Starting XI
                            </div>
                            <div class="space-y-1">
                              {#each away_starters as player}
                                <div
                                  class="flex items-center gap-2 text-sm py-1"
                                >
                                  {#if player.jersey_number}
                                    <span
                                      class="w-6 h-6 flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded flex-shrink-0"
                                    >
                                      {player.jersey_number}
                                    </span>
                                  {:else}
                                    <span
                                      class="w-6 h-6 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded flex-shrink-0"
                                      >-</span
                                    >
                                  {/if}
                                  <span
                                    class="text-gray-800 dark:text-gray-200 truncate flex-1"
                                  >
                                    {player.first_name}
                                    {player.last_name}
                                    {#if player.is_captain}<span
                                        class="text-yellow-600 dark:text-yellow-400"
                                        >©</span
                                      >{/if}
                                  </span>
                                  {#if player.position}
                                    <span
                                      class="text-xs text-gray-500 dark:text-gray-400"
                                      >{player.position}</span
                                    >
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/if}
                        {#if away_substitutes.length > 0}
                          <div
                            class="border-t border-red-200 dark:border-red-700 pt-3"
                          >
                            <div
                              class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-medium"
                            >
                              Substitutes
                            </div>
                            <div class="space-y-1">
                              {#each away_substitutes as player}
                                <div
                                  class="flex items-center gap-2 text-sm py-1 opacity-80"
                                >
                                  {#if player.jersey_number}
                                    <span
                                      class="w-6 h-6 flex items-center justify-center bg-red-400 text-white text-xs font-bold rounded flex-shrink-0"
                                    >
                                      {player.jersey_number}
                                    </span>
                                  {:else}
                                    <span
                                      class="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-xs rounded flex-shrink-0"
                                      >-</span
                                    >
                                  {/if}
                                  <span
                                    class="text-gray-700 dark:text-gray-300 truncate flex-1"
                                  >
                                    {player.first_name}
                                    {player.last_name}
                                  </span>
                                </div>
                              {/each}
                            </div>
                          </div>
                        {/if}
                        {#if away_starters.length === 0}
                          <div class="space-y-1">
                            {#each away_players as player}
                              <div class="flex items-center gap-2 text-sm py-1">
                                {#if player.jersey_number}
                                  <span
                                    class="w-6 h-6 flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded flex-shrink-0"
                                  >
                                    {player.jersey_number}
                                  </span>
                                {:else}
                                  <span
                                    class="w-6 h-6 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded flex-shrink-0"
                                    >-</span
                                  >
                                {/if}
                                <span
                                  class="text-gray-800 dark:text-gray-200 truncate"
                                >
                                  {player.first_name}
                                  {player.last_name}
                                </span>
                              </div>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <div
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6"
          >
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center md:text-left">
                <div
                  class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
                >
                  📍 Venue
                </div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {venue?.name ?? fixture?.venue ?? "TBD"}
                </div>
                {#if venue?.city}
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {venue.city}{venue.country ? `, ${venue.country}` : ""}
                  </div>
                {/if}
              </div>

              <div class="text-center">
                <div
                  class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
                >
                  👕 Team Colors
                </div>
                <div class="flex items-center justify-center gap-4">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-600 dark:text-gray-300">
                      {home_team?.name?.slice(0, 3).toUpperCase() ?? "HOM"}
                    </span>
                    {#if fixture?.home_team_jersey?.main_color}
                      <div
                        class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                        style="background-color: {fixture.home_team_jersey
                          .main_color}"
                        title={fixture.home_team_jersey.nickname || "Home Kit"}
                      ></div>
                    {:else}
                      <div
                        class="w-6 h-6 rounded-full bg-blue-500 border-2 border-gray-300 dark:border-gray-600"
                        title="Home Kit"
                      ></div>
                    {/if}
                  </div>
                  <span class="text-gray-400">vs</span>
                  <div class="flex items-center gap-2">
                    {#if fixture?.away_team_jersey?.main_color}
                      <div
                        class="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                        style="background-color: {fixture.away_team_jersey
                          .main_color}"
                        title={fixture.away_team_jersey.nickname || "Away Kit"}
                      ></div>
                    {:else}
                      <div
                        class="w-6 h-6 rounded-full bg-red-500 border-2 border-gray-300 dark:border-gray-600"
                        title="Away Kit"
                      ></div>
                    {/if}
                    <span class="text-xs text-gray-600 dark:text-gray-300">
                      {away_team?.name?.slice(0, 3).toUpperCase() ?? "AWY"}
                    </span>
                  </div>
                </div>
                {#if fixture?.officials_jersey?.main_color}
                  <div class="mt-2 flex items-center justify-center gap-2">
                    <span class="text-xs text-gray-500 dark:text-gray-400"
                      >Officials:</span
                    >
                    <div
                      class="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                      style="background-color: {fixture.officials_jersey
                        .main_color}"
                      title={fixture.officials_jersey.nickname ||
                        "Officials Kit"}
                    ></div>
                  </div>
                {/if}
              </div>

              <div class="text-center md:text-right">
                <div
                  class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
                >
                  🏅 Match Officials
                </div>
                {#if assigned_officials_data.length > 0}
                  <div class="space-y-1">
                    {#each assigned_officials_data as { official, role_name }}
                      <div class="text-sm">
                        <span class="text-gray-600 dark:text-gray-400"
                          >{role_name}:</span
                        >
                        <span class="font-medium text-gray-900 dark:text-white">
                          {get_official_full_name(official)}
                        </span>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Not assigned
                  </div>
                {/if}
              </div>
            </div>
          </div>

          {#if !is_game_scheduled}
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-400"
                >
                  {home_team?.name ?? "Home"}
                </span>
              </div>
              <h3
                class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Match Timeline
              </h3>
              <div class="flex items-center gap-2">
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-400"
                >
                  {away_team?.name ?? "Away"}
                </span>
                <span class="w-3 h-3 rounded-full bg-red-500"></span>
              </div>
            </div>

            {#if sorted_events.length === 0}
              <div class="text-center py-16">
                <div
                  class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center"
                >
                  <span class="text-4xl">📋</span>
                </div>
                <h3
                  class="text-lg font-medium text-gray-900 dark:text-white mb-2"
                >
                  No Events Yet
                </h3>
                <p class="text-gray-500 dark:text-gray-400 text-sm">
                  {#if is_game_in_progress}
                    Waiting for match events to be recorded
                  {:else}
                    This match had no recorded events
                  {/if}
                </p>
              </div>
            {:else}
              <div class="relative">
                <div
                  class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600 transform -translate-x-1/2"
                ></div>

                <div class="space-y-4">
                  {#each sorted_events as event}
                    {@const is_home_event = event.team_side === "home"}
                    {@const is_away_event = event.team_side === "away"}
                    {@const is_match_event = event.team_side === "match"}

                    {#if is_match_event}
                      <div class="relative flex items-center justify-center">
                        <div class="flex flex-col items-center">
                          <div
                            class="z-10 w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 border-4 border-purple-400 dark:border-purple-600 flex items-center justify-center text-xl"
                          >
                            {get_event_icon(event.event_type)}
                          </div>
                          <div
                            class="mt-2 text-center py-3 px-4 bg-purple-50 dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800"
                          >
                            <div
                              class="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1"
                            >
                              {format_event_time(
                                event.minute,
                                event.stoppage_time_minute,
                              )}
                            </div>
                            <div
                              class="text-sm font-medium text-purple-800 dark:text-purple-200"
                            >
                              {event.description ||
                                get_event_label(event.event_type)}
                            </div>
                          </div>
                        </div>
                      </div>
                    {:else}
                      <div class="relative flex items-center">
                        <div
                          class="absolute left-1/2 transform -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-4 {is_home_event
                            ? 'border-blue-400'
                            : 'border-red-400'} flex items-center justify-center text-lg shadow-sm"
                        >
                          {get_event_icon(event.event_type)}
                        </div>

                        {#if is_home_event}
                          <div class="flex-1 pr-8 flex justify-end">
                            <div
                              class="max-w-xs w-full rounded-lg border-r-4 p-3 shadow-sm text-right {get_event_bg_class(
                                event,
                              ).replace('border-l-', 'border-r-')}"
                            >
                              <div
                                class="flex items-center justify-end gap-2 mb-1"
                              >
                                <span
                                  class="font-semibold text-gray-900 dark:text-white text-sm"
                                >
                                  {event.description ||
                                    get_event_label(event.event_type)}
                                </span>
                                <span
                                  class="text-sm font-bold text-blue-600 dark:text-blue-400"
                                >
                                  {format_event_time(
                                    event.minute,
                                    event.stoppage_time_minute,
                                  )}
                                </span>
                              </div>
                              {#if event.player_name}
                                <p
                                  class="text-xs text-gray-500 dark:text-gray-400"
                                >
                                  {event.player_name}
                                  {#if event.secondary_player_name}
                                    → {event.secondary_player_name}
                                  {/if}
                                </p>
                              {/if}
                            </div>
                          </div>
                          <div class="flex-1 pl-8"></div>
                        {:else}
                          <div class="flex-1 pr-8"></div>
                          <div class="flex-1 pl-8 flex justify-start">
                            <div
                              class="max-w-xs w-full rounded-lg border-l-4 p-3 shadow-sm text-left {get_event_bg_class(
                                event,
                              )}"
                            >
                              <div
                                class="flex items-center justify-start gap-2 mb-1"
                              >
                                <span
                                  class="text-sm font-bold text-red-600 dark:text-red-400"
                                >
                                  {format_event_time(
                                    event.minute,
                                    event.stoppage_time_minute,
                                  )}
                                </span>
                                <span
                                  class="font-semibold text-gray-900 dark:text-white text-sm"
                                >
                                  {event.description ||
                                    get_event_label(event.event_type)}
                                </span>
                              </div>
                              {#if event.player_name}
                                <p
                                  class="text-xs text-gray-500 dark:text-gray-400"
                                >
                                  {event.player_name}
                                  {#if event.secondary_player_name}
                                    → {event.secondary_player_name}
                                  {/if}
                                </p>
                              {/if}
                            </div>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

{#if toast_visible}
  <Toast
    message={toast_message}
    type={toast_type}
    bind:is_visible={toast_visible}
  />
{/if}
