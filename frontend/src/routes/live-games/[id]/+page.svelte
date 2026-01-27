<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type {
    Fixture,
    GameEvent,
    GamePeriod,
    QuickEventButton,
  } from "$lib/core/entities/Fixture";
  import type { Team } from "$lib/core/entities/Team";
  import type { Competition } from "$lib/core/entities/Competition";
  import type { Sport, SportGamePeriod } from "$lib/core/entities/Sport";
  import type {
    LineupPlayer,
    FixtureLineup,
    CreateFixtureLineupInput,
  } from "$lib/core/entities/FixtureLineup";
  import {
    get_lineup_player_display_name,
    create_empty_fixture_lineup_input,
  } from "$lib/core/entities/FixtureLineup";
  import {
    get_quick_event_buttons,
    create_game_event,
    get_event_icon,
    get_event_label,
    format_event_time,
    get_period_display_name,
  } from "$lib/core/entities/Fixture";
  import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_fixture_lineup_use_cases } from "$lib/core/usecases/FixtureLineupUseCases";
  import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
  import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
  import { get_sport_use_cases } from "$lib/core/usecases/SportUseCases";
  import { get_player_team_membership_use_cases } from "$lib/core/usecases/PlayerTeamMembershipUseCases";
  import { get_venue_use_cases } from "$lib/core/usecases/VenueUseCases";
  import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
  import type { Venue } from "$lib/core/entities/Venue";
  import type { Official } from "$lib/core/entities/Official";
  import { get_official_full_name } from "$lib/core/entities/Official";
  import Toast from "$lib/presentation/components/ui/Toast.svelte";
  import ConfirmationModal from "$lib/presentation/components/ui/ConfirmationModal.svelte";
  import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";

  const fixture_use_cases = get_fixture_use_cases();
  const team_use_cases = get_team_use_cases();
  const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
  const competition_use_cases = get_competition_use_cases();
  const organization_use_cases = get_organization_use_cases();
  const sport_use_cases = get_sport_use_cases();
  const player_membership_use_cases = get_player_team_membership_use_cases();
  const venue_use_cases = get_venue_use_cases();
  const official_use_cases = get_official_use_cases();

  let fixture: Fixture | null = null;
  let home_team: Team | null = null;
  let away_team: Team | null = null;
  let competition: Competition | null = null;
  let sport: Sport | null = null;
  let venue: Venue | null = null;
  let assigned_officials_data: Array<{
    official: Official;
    role_name: string;
  }> = [];
  let home_players: LineupPlayer[] = [];
  let away_players: LineupPlayer[] = [];
  let is_loading: boolean = true;
  let error_message: string = "";
  let is_updating: boolean = false;

  let game_clock_seconds: number = 0;
  let clock_interval: ReturnType<typeof setInterval> | null = null;
  let is_clock_running: boolean = false;

  let show_start_modal: boolean = false;
  let show_end_modal: boolean = false;
  let show_event_modal: boolean = false;

  let selected_event_type: QuickEventButton | null = null;
  let selected_team_side: "home" | "away" = "home";
  let selected_player_id: string = "";
  let event_player_name: string = "";
  let event_description: string = "";
  let event_minute: number = 0;

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  function get_effective_periods(): SportGamePeriod[] {
    return competition?.rule_overrides?.periods ?? sport?.periods ?? [];
  }

  function get_playing_periods(): SportGamePeriod[] {
    return get_effective_periods().filter((p) => !p.is_break);
  }

  function get_period_duration_seconds_by_index(period_index: number): number {
    const playing_periods = get_playing_periods();
    if (period_index < 0 || period_index >= playing_periods.length) {
      return 45 * 60;
    }
    return playing_periods[period_index].duration_minutes * 60;
  }

  function get_current_period_index(): number {
    const current_period = fixture?.current_period ?? "first_half";
    const period_map: Record<string, number> = {
      first_half: 0,
      second_half: 1,
      first_quarter: 0,
      second_quarter: 1,
      third_quarter: 2,
      fourth_quarter: 3,
      extra_time_first: -1,
      extra_time_second: -2,
    };
    return period_map[current_period] ?? 0;
  }

  $: fixture_id = $page.params.id ?? "";
  $: elapsed_minutes = Math.floor(game_clock_seconds / 60);
  $: current_period_index = get_current_period_index();
  $: current_period_duration = get_current_period_duration_seconds(
    fixture?.current_period ?? "first_half",
  );
  $: period_elapsed_seconds =
    game_clock_seconds -
    get_period_start_seconds(fixture?.current_period ?? "first_half");
  $: remaining_seconds_in_period = Math.max(
    0,
    current_period_duration - period_elapsed_seconds,
  );
  $: countdown_minutes = Math.floor(remaining_seconds_in_period / 60);
  $: countdown_seconds = remaining_seconds_in_period % 60;
  $: clock_display = `${countdown_minutes.toString().padStart(2, "0")}:${countdown_seconds.toString().padStart(2, "0")}`;
  $: home_score = fixture?.home_team_score ?? 0;
  $: away_score = fixture?.away_team_score ?? 0;
  $: game_events = fixture?.game_events ?? [];
  $: sorted_events = [...game_events].sort(
    (a, b) =>
      b.minute - a.minute ||
      new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
  );
  $: is_game_active = fixture?.status === "in_progress";
  $: all_event_buttons = get_quick_event_buttons();

  onMount(async () => {
    if (!fixture_id) {
      error_message = "No fixture ID provided";
      is_loading = false;
      return;
    }
    await load_fixture();
  });

  onDestroy(() => {
    stop_clock();
  });

  async function load_fixture(): Promise<void> {
    console.log("[LiveGame] load_fixture() starting, fixture_id:", fixture_id);
    is_loading = true;
    error_message = "";

    const result = await fixture_use_cases.get_by_id(fixture_id);
    console.log("[LiveGame] fixture_use_cases.get_by_id result:", {
      success: result.success,
      has_data: !!result.data,
      error: result.error_message,
    });

    if (!result.success || !result.data) {
      error_message = result.error_message || "Failed to load fixture";
      is_loading = false;
      console.log("[LiveGame] Failed to load fixture:", error_message);
      return;
    }

    fixture = result.data;
    console.log("[LiveGame] Fixture loaded:", {
      id: fixture.id,
      home_team_id: fixture.home_team_id,
      away_team_id: fixture.away_team_id,
      status: fixture.status,
    });

    if (fixture.status === "in_progress") {
      game_clock_seconds = (fixture.current_minute || 0) * 60;
      start_clock();
    }

    const [home_result, away_result] = await Promise.all([
      team_use_cases.get_by_id(fixture.home_team_id),
      team_use_cases.get_by_id(fixture.away_team_id),
    ]);

    console.log("[LiveGame] Teams loaded:", {
      home_success: home_result.success,
      home_name: home_result.data?.name,
      away_success: away_result.success,
      away_name: away_result.data?.name,
    });

    if (home_result.success && home_result.data) home_team = home_result.data;
    if (away_result.success && away_result.data) away_team = away_result.data;

    if (fixture.competition_id) {
      const competition_result = await competition_use_cases.get_by_id(
        fixture.competition_id,
      );
      if (competition_result.success && competition_result.data) {
        competition = competition_result.data;

        if (competition.organization_id) {
          const org_result = await organization_use_cases.get_by_id(
            competition.organization_id,
          );
          if (
            org_result.success &&
            org_result.data &&
            org_result.data.sport_id
          ) {
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

    console.log(
      "[LiveGame] Fetching lineups for home_team_id:",
      fixture.home_team_id,
      "away_team_id:",
      fixture.away_team_id,
    );

    const [home_lineup_result, away_lineup_result] = await Promise.all([
      fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture_id,
        fixture.home_team_id,
      ),
      fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture_id,
        fixture.away_team_id,
      ),
    ]);

    console.log("[LiveGame] Home lineup result:", {
      success: home_lineup_result.success,
      has_data: !!home_lineup_result.data,
      error: home_lineup_result.error_message,
      selected_players_count:
        home_lineup_result.data?.selected_players?.length ?? 0,
    });

    console.log("[LiveGame] Away lineup result:", {
      success: away_lineup_result.success,
      has_data: !!away_lineup_result.data,
      error: away_lineup_result.error_message,
      selected_players_count:
        away_lineup_result.data?.selected_players?.length ?? 0,
    });

    home_players =
      home_lineup_result.success && home_lineup_result.data
        ? home_lineup_result.data.selected_players
        : [];

    away_players =
      away_lineup_result.success && away_lineup_result.data
        ? away_lineup_result.data.selected_players
        : [];

    console.log("[LiveGame] Final players loaded:", {
      home_players_count: home_players.length,
      away_players_count: away_players.length,
      home_players_sample: home_players
        .slice(0, 2)
        .map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` })),
      away_players_sample: away_players
        .slice(0, 2)
        .map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` })),
    });

    if (fixture.venue) {
      const venue_result = await venue_use_cases.get_by_id(fixture.venue);
      if (venue_result.success && venue_result.data) {
        venue = venue_result.data;
      }
    }

    if (fixture.assigned_officials && fixture.assigned_officials.length > 0) {
      const officials_promises = fixture.assigned_officials.map(
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
  }

  function get_period_start_seconds(period: GamePeriod): number {
    const playing_periods = get_playing_periods();
    const period_map: Record<string, number> = {
      first_half: 0,
      second_half: 1,
      first_quarter: 0,
      second_quarter: 1,
      third_quarter: 2,
      fourth_quarter: 3,
      extra_time_first: -1,
      extra_time_second: -2,
    };

    const period_index = period_map[period] ?? 0;

    if (period === "extra_time_first") {
      const total_regular_time = playing_periods.reduce(
        (sum, p) => sum + p.duration_minutes * 60,
        0,
      );
      return total_regular_time;
    }

    if (period === "extra_time_second") {
      const total_regular_time = playing_periods.reduce(
        (sum, p) => sum + p.duration_minutes * 60,
        0,
      );
      return total_regular_time + 15 * 60;
    }

    let start_seconds = 0;
    for (let i = 0; i < period_index && i < playing_periods.length; i++) {
      start_seconds += playing_periods[i].duration_minutes * 60;
    }
    return start_seconds;
  }

  function get_current_period_duration_seconds(period: GamePeriod): number {
    const playing_periods = get_playing_periods();
    const period_map: Record<string, number> = {
      first_half: 0,
      second_half: 1,
      first_quarter: 0,
      second_quarter: 1,
      third_quarter: 2,
      fourth_quarter: 3,
    };

    const period_index = period_map[period];

    if (period === "extra_time_first" || period === "extra_time_second") {
      return 15 * 60;
    }

    if (
      period_index !== undefined &&
      period_index >= 0 &&
      period_index < playing_periods.length
    ) {
      return playing_periods[period_index].duration_minutes * 60;
    }

    return playing_periods.length > 0
      ? playing_periods[0].duration_minutes * 60
      : 45 * 60;
  }

  function start_clock(): void {
    if (clock_interval) return;
    is_clock_running = true;
    clock_interval = setInterval(tick_clock, 1000);
  }

  function tick_clock(): void {
    game_clock_seconds += 1;
  }

  function stop_clock(): void {
    if (clock_interval) {
      clearInterval(clock_interval);
      clock_interval = null;
    }
    is_clock_running = false;
  }

  function toggle_clock(): void {
    if (is_clock_running) {
      stop_clock();
    } else {
      start_clock();
    }
  }

  function build_missing_lineups_error_message(
    home_missing: boolean,
    away_missing: boolean,
  ): string {
    if (home_missing && away_missing) {
      return `Both teams (${home_team?.name || "Home Team"} and ${away_team?.name || "Away Team"}) have not submitted their squads for this fixture.`;
    }
    if (home_missing) {
      return `${home_team?.name || "Home Team"} has not submitted their squad for this fixture.`;
    }
    return `${away_team?.name || "Away Team"} has not submitted their squad for this fixture.`;
  }

  async function auto_generate_lineup_for_team(
    team_id: string,
    team_name: string,
  ): Promise<boolean> {
    if (!fixture) return false;

    const memberships_result = await player_membership_use_cases.list({
      team_id,
      status: "active",
    });

    const active_memberships = (memberships_result.data || []).filter(
      (m: any) => m.status === "active",
    );

    if (active_memberships.length === 0) {
      show_toast(
        `${team_name} has no active players to generate a lineup.`,
        "error",
      );
      return false;
    }

    const player_promises = active_memberships.map((m: any) =>
      import("$lib/core/usecases/PlayerUseCases").then((mod) =>
        mod.get_player_use_cases().get_by_id(m.player_id),
      ),
    );
    const player_results = await Promise.all(player_promises);

    const players = player_results
      .filter((result) => result.success && result.data)
      .map((result) => result.data);

    const selected_players: LineupPlayer[] = active_memberships.map(
      (membership: any) => {
        const player = players.find((p: any) => p?.id === membership.player_id);
        return {
          id: membership.player_id,
          first_name: player?.first_name || "Unknown",
          last_name: player?.last_name || "Player",
          jersey_number: membership.jersey_number ?? null,
          position: null,
          is_captain: false,
          is_substitute: false,
        };
      },
    );

    const lineup_input: CreateFixtureLineupInput = {
      fixture_id: fixture.id,
      team_id,
      selected_players,
      status: "submitted",
      submitted_by: "auto-generated",
      submitted_at: new Date().toISOString(),
      notes: "Auto-generated lineup at game start",
    };

    const create_result = await fixture_lineup_use_cases.create(lineup_input);
    return create_result.success;
  }

  async function start_game(): Promise<void> {
    if (!fixture) return;

    const home_lineup_missing = home_players.length === 0;
    const away_lineup_missing = away_players.length === 0;
    const has_missing_lineups = home_lineup_missing || away_lineup_missing;

    if (has_missing_lineups) {
      const allow_auto_submission =
        competition?.allow_auto_squad_submission ?? false;

      if (!allow_auto_submission) {
        const error_msg = build_missing_lineups_error_message(
          home_lineup_missing,
          away_lineup_missing,
        );
        show_toast(
          error_msg + " Please submit lineups before starting the game.",
          "error",
        );
        show_start_modal = false;
        return;
      }

      is_updating = true;
      let auto_gen_success = true;

      if (home_lineup_missing && home_team) {
        show_toast(`Auto-generating lineup for ${home_team.name}...`, "info");
        const success = await auto_generate_lineup_for_team(
          fixture.home_team_id,
          home_team.name,
        );
        if (!success) {
          show_toast(
            `Failed to auto-generate lineup for ${home_team.name}`,
            "error",
          );
          auto_gen_success = false;
        }
      }

      if (away_lineup_missing && away_team && auto_gen_success) {
        show_toast(`Auto-generating lineup for ${away_team.name}...`, "info");
        const success = await auto_generate_lineup_for_team(
          fixture.away_team_id,
          away_team.name,
        );
        if (!success) {
          show_toast(
            `Failed to auto-generate lineup for ${away_team.name}`,
            "error",
          );
          auto_gen_success = false;
        }
      }

      if (!auto_gen_success) {
        is_updating = false;
        show_start_modal = false;
        return;
      }

      await load_fixture();
    }

    is_updating = true;

    const result = await fixture_use_cases.start_fixture(fixture.id);

    is_updating = false;
    show_start_modal = false;

    if (!result.success) {
      show_toast(`Failed to start game: ${result.error}`, "error");
      return;
    }

    fixture = result.data;
    game_clock_seconds = 0;
    start_clock();
    show_toast("Game started! Clock is running.", "success");
  }

  async function end_game(): Promise<void> {
    if (!fixture) return;

    is_updating = true;
    stop_clock();

    const result = await fixture_use_cases.end_fixture(fixture.id);

    is_updating = false;
    show_end_modal = false;

    if (!result.success) {
      show_toast(`Failed to end game: ${result.error}`, "error");
      return;
    }

    fixture = result.data;
    show_toast("Game completed!", "success");
  }

  function open_event_modal(
    event_type: QuickEventButton,
    team: "home" | "away",
  ): void {
    if (!is_game_active) return;
    selected_event_type = event_type;
    selected_team_side = team;
    selected_player_id = "";
    event_player_name = "";
    event_description = "";
    event_minute = Math.floor(game_clock_seconds / 60);
    show_event_modal = true;
  }

  function cancel_event(): void {
    show_event_modal = false;
    selected_event_type = null;
    selected_player_id = "";
    event_player_name = "";
    event_description = "";
    event_minute = 0;
  }

  async function record_event(): Promise<void> {
    if (!fixture || !selected_event_type) return;

    is_updating = true;

    const event_label = selected_event_type.label;

    const new_event = create_game_event(
      selected_event_type.id,
      event_minute,
      selected_team_side,
      event_player_name,
      event_description || selected_event_type.label,
    );

    const result = await fixture_use_cases.record_game_event(
      fixture.id,
      new_event,
    );

    is_updating = false;

    if (!result.success) {
      show_toast(`Failed to record event: ${result.error}`, "error");
      return;
    }

    fixture = result.data;
    cancel_event();
    show_toast(`${event_label} recorded!`, "success");
  }

  async function change_period(new_period: GamePeriod): Promise<void> {
    if (!fixture) return;

    is_updating = true;

    let new_minute = elapsed_minutes;
    if (new_period === "second_half") {
      new_minute = 45;
      game_clock_seconds = 45 * 60;
    } else if (new_period === "extra_time_first") {
      new_minute = 90;
      game_clock_seconds = 90 * 60;
    }

    const period_event = create_game_event(
      "period_start",
      new_minute,
      "match",
      "",
      `${get_period_display_name(new_period)} started`,
    );

    await fixture_use_cases.record_game_event(fixture.id, period_event);
    const result = await fixture_use_cases.update_period(
      fixture.id,
      new_period,
      new_minute,
    );

    is_updating = false;

    if (!result.success) {
      show_toast(`Failed to change period: ${result.error}`, "error");
      return;
    }

    fixture = result.data;
    start_clock();
    show_toast(`${get_period_display_name(new_period)} started!`, "info");
  }

  async function end_current_period(): Promise<void> {
    if (!fixture) return;

    stop_clock();
    is_updating = true;

    const period_event = create_game_event(
      "period_end",
      elapsed_minutes,
      "match",
      "",
      `${get_period_display_name(fixture.current_period)} ended`,
    );

    const result = await fixture_use_cases.record_game_event(
      fixture.id,
      period_event,
    );

    is_updating = false;

    if (!result.success) {
      show_toast(`Failed to end period: ${result.error}`, "error");
      return;
    }

    fixture = result.data;

    const next_period_map: Record<GamePeriod, GamePeriod> = {
      pre_game: "first_half",
      first_half: "half_time",
      half_time: "second_half",
      second_half: "finished",
      extra_time_first: "extra_time_second",
      extra_time_second: "finished",
      penalty_shootout: "finished",
      finished: "finished",
    };

    const next = next_period_map[fixture.current_period];
    await fixture_use_cases.update_period(fixture.id, next, elapsed_minutes);
    fixture = { ...fixture, current_period: next };

    show_toast(
      `${get_period_display_name(fixture.current_period)} ended`,
      "info",
    );
  }

  function navigate_back(): void {
    goto("/live-games");
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info",
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
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

  function build_player_select_options_for_team(
    team_side: "home" | "away",
    home_lineup_players: LineupPlayer[],
    away_lineup_players: LineupPlayer[],
  ): Array<{ value: string; label: string }> {
    const players =
      team_side === "home" ? home_lineup_players : away_lineup_players;
    const options = players.map((player) => ({
      value: player.id,
      label: get_lineup_player_display_name(player),
    }));
    console.log(
      `[LiveGame] build_player_select_options_for_team(${team_side}):`,
      {
        home_players_count: home_lineup_players.length,
        away_players_count: away_lineup_players.length,
        selected_team_players_count: players.length,
        options_count: options.length,
        options: options.slice(0, 3),
      },
    );
    return options;
  }

  $: player_select_options = build_player_select_options_for_team(
    selected_team_side,
    home_players,
    away_players,
  );
</script>

<svelte:head>
  <title>
    {fixture
      ? `${home_team?.name ?? "Home"} vs ${away_team?.name ?? "Away"}`
      : "Live Game Management"} - Sports Management
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
          Error Loading Game
        </h3>
        <p class="text-red-600 dark:text-red-400">{error_message}</p>
        <button
          type="button"
          class="btn btn-outline mt-4"
          on:click={navigate_back}>Back to Live Games</button
        >
      </div>
    </div>
  {:else if fixture}
    <div class="flex flex-col h-screen">
      <div class="bg-gray-900 text-white px-4 py-3 sticky top-0 z-40">
        <div
          class="flex items-center justify-between max-w-4xl mx-auto relative"
        >
          <button
            type="button"
            class="p-2 hover:bg-gray-800 rounded-lg absolute left-4 top-1/2 -translate-y-1/2 md:static md:translate-y-0"
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

          <div class="flex flex-col items-center flex-1">
            <div class="flex items-center gap-4 sm:gap-6 justify-center">
              <div class="text-center">
                <div
                  class="text-xs text-gray-400 mb-1 truncate max-w-20 sm:max-w-none"
                >
                  {home_team?.name ?? "HOME"}
                </div>
                <div class="text-3xl sm:text-4xl font-bold tabular-nums">
                  {home_score}
                </div>
              </div>

              <div class="text-center min-w-24 sm:min-w-32">
                <div class="text-xs text-gray-400 mb-1">
                  {#if fixture.status === "in_progress"}
                    {get_period_display_name(fixture.current_period)}
                  {:else if fixture.status === "completed"}
                    Full Time
                  {:else}
                    {fixture.scheduled_time}
                  {/if}
                </div>
                {#if fixture.status === "in_progress"}
                  <div
                    class="text-xl sm:text-2xl font-mono font-bold text-primary-400"
                  >
                    {clock_display}
                  </div>
                  {#if is_clock_running}
                    <div
                      class="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1 animate-pulse"
                    ></div>
                  {/if}
                {:else}
                  <div class="text-xl font-semibold text-gray-400">VS</div>
                {/if}
              </div>

              <div class="text-center">
                <div
                  class="text-xs text-gray-400 mb-1 truncate max-w-20 sm:max-w-none"
                >
                  {away_team?.name ?? "AWAY"}
                </div>
                <div class="text-3xl sm:text-4xl font-bold tabular-nums">
                  {away_score}
                </div>
              </div>
            </div>

            <div class="flex gap-2 mt-3 md:hidden">
              {#if fixture.status === "scheduled"}
                <button
                  class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                  on:click={() => (show_start_modal = true)}
                >
                  ▶️ Start
                </button>
              {:else if is_game_active}
                <button
                  class="px-3 py-2 rounded-lg text-sm font-medium {is_clock_running
                    ? 'bg-yellow-500 text-black'
                    : 'bg-green-500 text-white'}"
                  on:click={toggle_clock}
                >
                  {is_clock_running ? "⏸️ Pause" : "▶️ Resume"}
                </button>
                <button
                  class="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                  on:click={() => (show_end_modal = true)}
                >
                  🏁 End
                </button>
              {/if}
            </div>
          </div>

          <div class="hidden md:flex gap-2">
            {#if fixture.status === "scheduled"}
              <button
                class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                on:click={() => (show_start_modal = true)}
              >
                ▶️ Start
              </button>
            {:else if is_game_active}
              <button
                class="px-3 py-2 rounded-lg text-sm font-medium {is_clock_running
                  ? 'bg-yellow-500 text-black'
                  : 'bg-green-500 text-white'}"
                on:click={toggle_clock}
              >
                {is_clock_running ? "⏸️ Pause" : "▶️ Resume"}
              </button>
              <button
                class="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                on:click={() => (show_end_modal = true)}
              >
                🏁 End
              </button>
            {/if}
          </div>
        </div>
      </div>

      {#if is_game_active}
        <div class="bg-gray-800 text-white px-4 py-2 border-b border-gray-700">
          <div class="flex justify-center gap-3 max-w-4xl mx-auto flex-wrap">
            {#if fixture.current_period === "first_half" && !is_clock_running}
              <button
                class="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium"
                on:click={end_current_period}
              >
                ⏹️ End 1st Half
              </button>
            {:else if fixture.current_period === "half_time"}
              <button
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                on:click={() => change_period("second_half")}
              >
                ▶️ Start 2nd Half
              </button>
            {:else if fixture.current_period === "second_half" && !is_clock_running}
              <button
                class="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium"
                on:click={end_current_period}
              >
                ⏹️ End 2nd Half
              </button>
              <button
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium"
                on:click={() => change_period("extra_time_first")}
              >
                ⚡ Extra Time
              </button>
            {/if}
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4"
        >
          <div class="max-w-5xl mx-auto">
            <div class="flex flex-col md:flex-row">
              <div class="flex-1 md:pr-4">
                <div
                  class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-3 text-center uppercase tracking-wider"
                >
                  🏠 {home_team?.name ?? "Home"}
                </div>
                <div class="grid grid-cols-4 gap-2">
                  {#each all_event_buttons as event_btn}
                    <button
                      class="flex flex-col items-center justify-center p-2 rounded-lg text-white transition-all active:scale-95 {event_btn.color}"
                      on:click={() => open_event_modal(event_btn, "home")}
                      disabled={!is_clock_running}
                    >
                      <span class="text-lg">{event_btn.icon}</span>
                      <span class="text-xs mt-1 truncate w-full text-center"
                        >{event_btn.label}</span
                      >
                    </button>
                  {/each}
                </div>
              </div>

              <div
                class="hidden md:block w-px bg-gray-300 dark:bg-gray-600 mx-2 self-stretch"
              ></div>
              <div
                class="md:hidden h-px bg-gray-300 dark:bg-gray-600 my-4 w-full"
              ></div>

              <div class="flex-1 md:pl-4">
                <div
                  class="text-xs font-medium text-red-600 dark:text-red-400 mb-3 text-center uppercase tracking-wider"
                >
                  ✈️ {away_team?.name ?? "Away"}
                </div>
                <div class="grid grid-cols-4 gap-2">
                  {#each all_event_buttons as event_btn}
                    <button
                      class="flex flex-col items-center justify-center p-2 rounded-lg text-white transition-all active:scale-95 {event_btn.color}"
                      on:click={() => open_event_modal(event_btn, "away")}
                      disabled={!is_clock_running}
                    >
                      <span class="text-lg">{event_btn.icon}</span>
                      <span class="text-xs mt-1 truncate w-full text-center"
                        >{event_btn.label}</span
                      >
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <div class="flex-1 overflow-y-auto px-4 py-6">
        <div class="max-w-3xl mx-auto">
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
                    <span class="text-xs text-gray-600 dark:text-gray-300"
                      >{home_team?.name?.slice(0, 3).toUpperCase() ??
                        "HOM"}</span
                    >
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
                    <span class="text-xs text-gray-600 dark:text-gray-300"
                      >{away_team?.name?.slice(0, 3).toUpperCase() ??
                        "AWY"}</span
                    >
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

          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-blue-500"></span>
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
                >{home_team?.name ?? "Home"}</span
              >
            </div>
            <h3
              class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Match Timeline
            </h3>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
                >{away_team?.name ?? "Away"}</span
              >
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
                {#if fixture.status === "scheduled"}
                  Start the game to begin recording events
                {:else if is_game_active}
                  Use the buttons above to record match events
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
                      <div
                        class="absolute left-1/2 transform -translate-x-1/2 z-10 w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 border-4 border-purple-400 dark:border-purple-600 flex items-center justify-center text-xl"
                      >
                        {get_event_icon(event.event_type)}
                      </div>
                      <div class="w-full flex items-center">
                        <div class="flex-1"></div>
                        <div
                          class="w-48 mx-auto text-center py-3 px-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
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
                        <div class="flex-1"></div>
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
        </div>
      </div>
    </div>
  {/if}
</div>

<ConfirmationModal
  is_visible={show_start_modal}
  title="Start Game"
  message="Are you sure you want to start this game? The match clock will begin."
  confirm_text="Start Game"
  is_processing={is_updating}
  on:confirm={start_game}
  on:cancel={() => (show_start_modal = false)}
/>

<ConfirmationModal
  is_visible={show_end_modal}
  title="End Game"
  message="Are you sure you want to end this game with the current score of {home_score} - {away_score}?"
  confirm_text="End Game"
  is_destructive
  is_processing={is_updating}
  on:confirm={end_game}
  on:cancel={() => (show_end_modal = false)}
/>

{#if show_event_modal && selected_event_type}
  <div
    class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
  >
    <div
      class="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl shadow-2xl"
    >
      <div
        class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">{selected_event_type.icon}</span>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {selected_event_type.label}
            </h3>
            <span
              class="text-xs {selected_team_side === 'home'
                ? 'text-blue-600'
                : 'text-red-600'}"
            >
              {selected_team_side === "home"
                ? `🏠 ${home_team?.name}`
                : `✈️ ${away_team?.name}`}
            </span>
          </div>
        </div>
        <button
          aria-label="Close event form"
          class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          on:click={cancel_event}
        >
          <svg
            class="w-5 h-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="p-4 space-y-4">
        <div>
          <label
            for="event_minute"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Game Minute</label
          >
          <div class="flex items-center gap-2">
            <input
              id="event_minute"
              type="number"
              min="0"
              max="120"
              bind:value={event_minute}
              class="w-24 px-3 py-2 text-center text-2xl font-mono font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span class="text-2xl font-bold text-gray-500">'</span>
            <button
              type="button"
              class="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              on:click={() =>
                (event_minute = Math.floor(game_clock_seconds / 60))}
            >
              Reset to {Math.floor(game_clock_seconds / 60)}'
            </button>
          </div>
        </div>

        {#if selected_event_type.requires_player}
          <div>
            <SearchableSelectField
              label="Player"
              name="event_player"
              bind:value={selected_player_id}
              options={player_select_options}
              placeholder="Search for a player..."
              on:change={(e) => {
                const players =
                  selected_team_side === "home" ? home_players : away_players;
                const player = players.find(
                  (p: LineupPlayer) => p.id === e.detail.value,
                );
                event_player_name = player
                  ? `${player.first_name} ${player.last_name}`
                  : "";
              }}
            />
          </div>
        {/if}

        <div>
          <label
            for="event_description"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Description (optional)</label
          >
          <input
            id="event_description"
            type="text"
            bind:value={event_description}
            placeholder="Add details..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div
        class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"
      >
        <button
          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          on:click={cancel_event}
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50"
          disabled={is_updating}
          on:click={record_event}
        >
          {#if is_updating}
            Recording...
          {:else}
            ✓ Record Event
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<Toast
  bind:is_visible={toast_visible}
  message={toast_message}
  type={toast_type}
  on:dismiss={() => (toast_visible = false)}
/>
