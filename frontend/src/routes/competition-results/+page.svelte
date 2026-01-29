<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Competition } from "$lib/core/entities/Competition";
  import {
    derive_competition_status,
    get_competition_status_display,
  } from "$lib/core/entities/Competition";
  import type { Fixture } from "$lib/core/entities/Fixture";
  import type { Team } from "$lib/core/entities/Team";
  import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
  import type { LoadingState } from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
  import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
  import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_competition_format_use_cases } from "$lib/core/usecases/CompetitionFormatUseCases";
  import { get_competition_team_use_cases } from "$lib/core/usecases/CompetitionTeamUseCases";
  import LoadingStateWrapper from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";

  const competition_use_cases = get_competition_use_cases();
  const fixture_use_cases = get_fixture_use_cases();
  const team_use_cases = get_team_use_cases();
  const format_use_cases = get_competition_format_use_cases();
  const competition_team_use_cases = get_competition_team_use_cases();

  let competitions: Competition[] = [];
  let selected_competition_id: string = "";
  let selected_competition: Competition | null = null;
  let competition_format: CompetitionFormat | null = null;
  let fixtures: Fixture[] = [];
  let teams: Team[] = [];
  let team_map: Map<string, Team> = new Map();
  let loading_state: LoadingState = "loading";
  let fixtures_loading: boolean = false;
  let error_message: string = "";

  let active_tab: "standings" | "fixtures" | "results" | "stats" = "standings";

  $: selected_competition_derived_status = selected_competition
    ? derive_competition_status(
        selected_competition.start_date,
        selected_competition.end_date,
      )
    : null;

  $: selected_competition_status_display = selected_competition_derived_status
    ? get_competition_status_display(selected_competition_derived_status)
    : null;

  interface TeamStanding {
    team_id: string;
    team_name: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
  }

  interface PlayerStats {
    player_name: string;
    team_name: string;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
  }

  $: standings = calculate_standings(fixtures, teams);
  $: completed_fixtures = fixtures.filter((f) => f.status === "completed");
  $: upcoming_fixtures = fixtures.filter((f) => f.status === "scheduled");
  $: in_progress_fixtures = fixtures.filter((f) => f.status === "in_progress");
  $: player_stats = calculate_player_stats(fixtures);

  onMount(async () => {
    await load_competitions();
  });

  async function load_competitions(): Promise<void> {
    loading_state = "loading";

    const result = await competition_use_cases.list(
      {},
      { page_number: 1, page_size: 100 },
    );

    if (!result.success) {
      loading_state = "error";
      error_message = result.error_message || "Failed to load competitions";
      return;
    }

    competitions = result.data;
    loading_state = "success";

    if (competitions.length > 0) {
      selected_competition_id = competitions[0].id;
      await load_competition_data();
    }
  }

  async function load_competition_data(): Promise<void> {
    if (!selected_competition_id) return;

    fixtures_loading = true;

    const comp_result = await competition_use_cases.get_by_id(
      selected_competition_id,
    );
    if (comp_result.success && comp_result.data) {
      selected_competition = comp_result.data;

      if (selected_competition.competition_format_id) {
        const format_result = await format_use_cases.get_by_id(
          selected_competition.competition_format_id,
        );
        if (format_result.success && format_result.data) {
          competition_format = format_result.data;
        }
      }
    }

    const comp_teams_result =
      await competition_team_use_cases.list_teams_in_competition(
        selected_competition_id,
        { page_number: 1, page_size: 100 },
      );
    if (comp_teams_result.success) {
      const team_ids = comp_teams_result.data.items.map(
        (ct: { team_id: string }) => ct.team_id,
      );
      const teams_promises = team_ids.map((id: string) =>
        team_use_cases.get_by_id(id),
      );
      const teams_results = await Promise.all(teams_promises);
      teams = [];
      for (const result of teams_results) {
        if (result.success && result.data) {
          teams.push(result.data);
        }
      }
      team_map = new Map(teams.map((t) => [t.id, t]));
    }

    const fixtures_result =
      await fixture_use_cases.list_fixtures_by_competition(
        selected_competition_id,
      );
    if (fixtures_result.success) {
      fixtures = fixtures_result.data.items;
    }

    fixtures_loading = false;
  }

  function handle_competition_change(): void {
    load_competition_data();
  }

  function calculate_standings(
    fixtures: Fixture[],
    teams: Team[],
  ): TeamStanding[] {
    const standings_map = new Map<string, TeamStanding>();

    for (const team of teams) {
      standings_map.set(team.id, {
        team_id: team.id,
        team_name: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
      });
    }

    const completed = fixtures.filter((f) => f.status === "completed");

    for (const fixture of completed) {
      const home = standings_map.get(fixture.home_team_id);
      const away = standings_map.get(fixture.away_team_id);

      if (!home || !away) continue;

      const home_goals = fixture.home_team_score ?? 0;
      const away_goals = fixture.away_team_score ?? 0;

      home.played++;
      away.played++;
      home.goals_for += home_goals;
      home.goals_against += away_goals;
      away.goals_for += away_goals;
      away.goals_against += home_goals;

      if (home_goals > away_goals) {
        home.won++;
        home.points += 3;
        away.lost++;
      } else if (home_goals < away_goals) {
        away.won++;
        away.points += 3;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;
        home.points += 1;
        away.points += 1;
      }
    }

    for (const standing of standings_map.values()) {
      standing.goal_difference = standing.goals_for - standing.goals_against;
    }

    return Array.from(standings_map.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference)
        return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });
  }

  function calculate_player_stats(fixtures: Fixture[]): PlayerStats[] {
    const stats_map = new Map<string, PlayerStats>();

    for (const fixture of fixtures) {
      if (!fixture.game_events) continue;

      for (const event of fixture.game_events) {
        if (!event.player_name) continue;

        const key = `${event.player_name}-${event.team_side}`;
        if (!stats_map.has(key)) {
          const team =
            event.team_side === "home"
              ? team_map.get(fixture.home_team_id)
              : team_map.get(fixture.away_team_id);
          stats_map.set(key, {
            player_name: event.player_name,
            team_name: team?.name ?? "Unknown",
            goals: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
          });
        }

        const player = stats_map.get(key)!;
        switch (event.event_type) {
          case "goal":
          case "penalty_scored":
            player.goals++;
            break;
          case "yellow_card":
            player.yellow_cards++;
            break;
          case "red_card":
          case "second_yellow":
            player.red_cards++;
            break;
        }
      }
    }

    return Array.from(stats_map.values()).sort((a, b) => b.goals - a.goals);
  }

  function get_team_name(team_id: string): string {
    return team_map.get(team_id)?.name ?? "Unknown Team";
  }

  function format_date(date_string: string): string {
    return new Date(date_string).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<svelte:head>
  <title>Competition Results - Sports Management</title>
</svelte:head>

<div class="w-full">
  <LoadingStateWrapper
    state={loading_state}
    loading_text="Loading competitions..."
    {error_message}
  >
    {#if competitions.length === 0}
      <div class="card p-8 sm:p-12 text-center">
        <svg
          class="mx-auto h-12 w-12 text-accent-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
        <h3
          class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
        >
          No competitions found
        </h3>
        <p class="mt-2 text-accent-600 dark:text-accent-400">
          Create a competition first to see results.
        </p>
        <button
          type="button"
          class="btn btn-primary-action mt-4"
          on:click={() => goto("/competitions/create")}
        >
          Create Competition
        </button>
      </div>
    {:else}
      <div class="card p-4 sm:p-6 space-y-6 overflow-hidden">
        <div
          class="flex flex-col gap-4 border-b border-gray-200 dark:border-gray-700 pb-4"
        >
          <div class="min-w-0">
            <h2
              class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100"
            >
              Competition Results
            </h2>
            <p class="text-xs sm:text-sm text-accent-600 dark:text-accent-400">
              View standings, fixtures, and statistics
            </p>
          </div>

          <div class="flex flex-col gap-3 w-full sm:w-auto">
            <select
              id="competition_select"
              bind:value={selected_competition_id}
              on:change={handle_competition_change}
              class="select-styled w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]"
            >
              {#each competitions as competition}
                <option value={competition.id}>{competition.name}</option>
              {/each}
            </select>

            {#if selected_competition && selected_competition_status_display}
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full {selected_competition_status_display.color}"
                >
                  {selected_competition_status_display.label}
                </span>
                {#if competition_format}
                  <span
                    class="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded-full"
                  >
                    {competition_format.name}
                  </span>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <div
          class="border-b border-gray-200 dark:border-gray-700 -mx-4 sm:-mx-6 px-4 sm:px-6"
        >
          <nav
            class="flex overflow-x-auto -mb-px scrollbar-hide"
            aria-label="Tabs"
          >
            <button
              type="button"
              class="flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors {active_tab ===
              'standings'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-accent-700 dark:hover:text-accent-300 hover:border-gray-300'}"
              on:click={() => (active_tab = "standings")}
            >
              <span class="hidden sm:inline">📊 </span> Standings
            </button>
            <button
              type="button"
              class="flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors {active_tab ===
              'fixtures'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-accent-700 dark:hover:text-accent-300 hover:border-gray-300'}"
              on:click={() => (active_tab = "fixtures")}
            >
              <span class="hidden sm:inline">📅 </span> Upcoming<span
                class="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full"
                >{upcoming_fixtures.length}</span
              >
            </button>
            <button
              type="button"
              class="flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors {active_tab ===
              'results'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-accent-700 dark:hover:text-accent-300 hover:border-gray-300'}"
              on:click={() => (active_tab = "results")}
            >
              <span class="hidden sm:inline">✅ </span> Results<span
                class="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full"
                >{completed_fixtures.length}</span
              >
            </button>
            <button
              type="button"
              class="flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors {active_tab ===
              'stats'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-accent-700 dark:hover:text-accent-300 hover:border-gray-300'}"
              on:click={() => (active_tab = "stats")}
            >
              <span class="hidden sm:inline">⚽ </span> Stats
            </button>
          </nav>
        </div>

        <div class="min-h-[200px]">
          {#if fixtures_loading}
            <div class="flex items-center justify-center py-12">
              <div
                class="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"
              ></div>
            </div>
          {:else if active_tab === "standings"}
            {#if standings.length === 0}
              <div class="text-center py-8 text-accent-500">
                No teams registered for this competition yet.
              </div>
            {:else}
              <div class="hidden sm:block overflow-x-auto">
                <table
                  class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                >
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >#</th
                      >
                      <th
                        class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >Team</th
                      >
                      <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >P</th
                      >
                      <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >W</th
                      >
                      <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >D</th
                      >
                      <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >L</th
                      >
                      <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell"
                        >GF</th
                      >
                      <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell"
                        >GA</th
                      >
                      <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >GD</th
                      >
                      <th
                        class="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold"
                        >Pts</th
                      >
                    </tr>
                  </thead>
                  <tbody
                    class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
                  >
                    {#each standings as standing, index}
                      <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td
                          class="px-3 py-3 text-sm font-medium {index < 3
                            ? 'text-green-600'
                            : 'text-gray-600 dark:text-gray-400'}"
                        >
                          {index + 1}
                        </td>
                        <td
                          class="px-3 py-3 text-sm font-medium text-accent-900 dark:text-accent-100"
                        >
                          {standing.team_name}
                        </td>
                        <td
                          class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400"
                          >{standing.played}</td
                        >
                        <td
                          class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400"
                          >{standing.won}</td
                        >
                        <td
                          class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400"
                          >{standing.drawn}</td
                        >
                        <td
                          class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400"
                          >{standing.lost}</td
                        >
                        <td
                          class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400 hidden md:table-cell"
                          >{standing.goals_for}</td
                        >
                        <td
                          class="px-3 py-3 text-sm text-center text-gray-600 dark:text-gray-400 hidden md:table-cell"
                          >{standing.goals_against}</td
                        >
                        <td
                          class="px-3 py-3 text-sm text-center {standing.goal_difference >
                          0
                            ? 'text-green-600'
                            : standing.goal_difference < 0
                              ? 'text-red-600'
                              : 'text-gray-600 dark:text-gray-400'}"
                        >
                          {standing.goal_difference > 0
                            ? "+"
                            : ""}{standing.goal_difference}
                        </td>
                        <td
                          class="px-3 py-3 text-sm text-center font-bold text-accent-900 dark:text-accent-100"
                          >{standing.points}</td
                        >
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              <div class="sm:hidden space-y-2">
                {#each standings as standing, index}
                  <div
                    class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <span
                        class="w-6 h-6 flex items-center justify-center text-sm font-bold rounded-full {index <
                        3
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}"
                      >
                        {index + 1}
                      </span>
                      <span
                        class="font-medium text-accent-900 dark:text-accent-100 truncate max-w-[120px]"
                      >
                        {standing.team_name}
                      </span>
                    </div>
                    <div class="flex items-center gap-4 text-sm">
                      <div class="text-center">
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          P
                        </div>
                        <div
                          class="font-medium text-gray-700 dark:text-gray-300"
                        >
                          {standing.played}
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          GD
                        </div>
                        <div
                          class="font-medium {standing.goal_difference > 0
                            ? 'text-green-600'
                            : standing.goal_difference < 0
                              ? 'text-red-600'
                              : 'text-gray-700 dark:text-gray-300'}"
                        >
                          {standing.goal_difference > 0
                            ? "+"
                            : ""}{standing.goal_difference}
                        </div>
                      </div>
                      <div class="text-center min-w-[32px]">
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          Pts
                        </div>
                        <div
                          class="font-bold text-accent-900 dark:text-accent-100"
                        >
                          {standing.points}
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else if active_tab === "fixtures"}
            {#if upcoming_fixtures.length === 0}
              <div class="text-center py-8 text-accent-500">
                No upcoming fixtures scheduled.
              </div>
            {:else}
              <div class="space-y-3">
                {#each upcoming_fixtures as fixture}
                  <div
                    class="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div
                      class="text-xs text-center text-gray-500 dark:text-gray-400 mb-2"
                    >
                      {format_date(fixture.scheduled_date)}
                    </div>
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex-1 text-right">
                        <span
                          class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1"
                        >
                          {get_team_name(fixture.home_team_id)}
                        </span>
                      </div>
                      <div class="flex-shrink-0 px-3 sm:px-6">
                        <div
                          class="text-base sm:text-lg font-bold text-gray-400"
                        >
                          VS
                        </div>
                      </div>
                      <div class="flex-1 text-left">
                        <span
                          class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1"
                        >
                          {get_team_name(fixture.away_team_id)}
                        </span>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else if active_tab === "results"}
            {#if completed_fixtures.length === 0}
              <div class="text-center py-8 text-accent-500">
                No completed fixtures yet.
              </div>
            {:else}
              <div class="space-y-3">
                {#each completed_fixtures as fixture}
                  {@const home_score = fixture.home_team_score ?? 0}
                  {@const away_score = fixture.away_team_score ?? 0}
                  <button
                    type="button"
                    class="w-full p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-left"
                    on:click={() => goto(`/live-games/${fixture.id}`)}
                  >
                    <div
                      class="text-xs text-center text-gray-500 dark:text-gray-400 mb-2"
                    >
                      {format_date(fixture.scheduled_date)}
                    </div>
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex-1 text-right">
                        <span
                          class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1 {home_score >
                          away_score
                            ? 'text-green-600 dark:text-green-400'
                            : ''}"
                        >
                          {get_team_name(fixture.home_team_id)}
                        </span>
                      </div>
                      <div class="flex-shrink-0 px-2 sm:px-4">
                        <div
                          class="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold"
                        >
                          <span
                            class={home_score > away_score
                              ? "text-green-600 dark:text-green-400"
                              : "text-accent-900 dark:text-accent-100"}
                          >
                            {home_score}
                          </span>
                          <span class="text-gray-400 text-base sm:text-lg"
                            >-</span
                          >
                          <span
                            class={away_score > home_score
                              ? "text-green-600 dark:text-green-400"
                              : "text-accent-900 dark:text-accent-100"}
                          >
                            {away_score}
                          </span>
                        </div>
                      </div>
                      <div class="flex-1 text-left">
                        <span
                          class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1 {away_score >
                          home_score
                            ? 'text-green-600 dark:text-green-400'
                            : ''}"
                        >
                          {get_team_name(fixture.away_team_id)}
                        </span>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            {/if}
          {:else if active_tab === "stats"}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3
                  class="text-base sm:text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4 flex items-center gap-2"
                >
                  <span>⚽</span> Top Scorers
                </h3>
                {#if player_stats.filter((p) => p.goals > 0).length === 0}
                  <div
                    class="text-center py-4 text-gray-500 dark:text-gray-400"
                  >
                    No goals scored yet.
                  </div>
                {:else}
                  <div class="space-y-2">
                    {#each player_stats
                      .filter((p) => p.goals > 0)
                      .slice(0, 10) as player, index}
                      <div
                        class="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-gray-900 rounded-lg"
                      >
                        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span
                            class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 flex items-center justify-center text-xs sm:text-sm font-bold rounded-full {index <
                            3
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}"
                          >
                            {index + 1}
                          </span>
                          <div class="min-w-0">
                            <div
                              class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
                            >
                              {player.player_name}
                            </div>
                            <div
                              class="text-xs text-gray-500 dark:text-gray-400 truncate"
                            >
                              {player.team_name}
                            </div>
                          </div>
                        </div>
                        <span
                          class="text-lg sm:text-xl font-bold text-accent-900 dark:text-accent-100 ml-2"
                        >
                          {player.goals}
                        </span>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3
                  class="text-base sm:text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4 flex items-center gap-2"
                >
                  <span>🟨</span> Most Cards
                </h3>
                {#if player_stats.filter((p) => p.yellow_cards > 0 || p.red_cards > 0).length === 0}
                  <div
                    class="text-center py-4 text-gray-500 dark:text-gray-400"
                  >
                    No cards issued yet.
                  </div>
                {:else}
                  <div class="space-y-2">
                    {#each player_stats
                      .filter((p) => p.yellow_cards > 0 || p.red_cards > 0)
                      .sort((a, b) => b.yellow_cards + b.red_cards * 2 - (a.yellow_cards + a.red_cards * 2))
                      .slice(0, 10) as player}
                      <div
                        class="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-gray-900 rounded-lg"
                      >
                        <div class="min-w-0">
                          <div
                            class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
                          >
                            {player.player_name}
                          </div>
                          <div
                            class="text-xs text-gray-500 dark:text-gray-400 truncate"
                          >
                            {player.team_name}
                          </div>
                        </div>
                        <div class="flex gap-2 sm:gap-3 ml-2">
                          {#if player.yellow_cards > 0}
                            <span class="flex items-center gap-1">
                              <span
                                class="w-2.5 h-3.5 sm:w-3 sm:h-4 bg-yellow-400 rounded-sm"
                              ></span>
                              <span
                                class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
                                >{player.yellow_cards}</span
                              >
                            </span>
                          {/if}
                          {#if player.red_cards > 0}
                            <span class="flex items-center gap-1">
                              <span
                                class="w-2.5 h-3.5 sm:w-3 sm:h-4 bg-red-500 rounded-sm"
                              ></span>
                              <span
                                class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
                                >{player.red_cards}</span
                              >
                            </span>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </LoadingStateWrapper>
</div>
