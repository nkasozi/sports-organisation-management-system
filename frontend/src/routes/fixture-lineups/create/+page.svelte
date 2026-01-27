<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
  import type { Fixture } from "$lib/core/entities/Fixture";
  import type { Team } from "$lib/core/entities/Team";
  import type { Competition } from "$lib/core/entities/Competition";
  import type { Sport } from "$lib/core/entities/Sport";
  import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
  import { get_fixture_lineup_use_cases } from "$lib/core/usecases/FixtureLineupUseCases";
  import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
  import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
  import { get_competition_team_use_cases } from "$lib/core/usecases/CompetitionTeamUseCases";
  import { get_player_team_membership_use_cases } from "$lib/core/usecases/PlayerTeamMembershipUseCases";
  import { get_player_position_use_cases } from "$lib/core/usecases/PlayerPositionUseCases";
  import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
  import { get_sport_by_id } from "$lib/adapters/services/sportService";
  import { create_empty_fixture_lineup_input } from "$lib/core/entities/FixtureLineup";
  import UiWizardStepper from "$lib/presentation/components/UiWizardStepper.svelte";
  import SelectField from "$lib/presentation/components/ui/SelectField.svelte";
  import {
    build_position_name_by_id,
    build_team_players,
    matches_team_player_search,
    type TeamPlayer,
  } from "$lib/core/services/teamPlayers";
  import {
    build_error_message,
    derive_initial_selected_players,
    convert_team_player_to_lineup_player,
    sort_lineup_players,
  } from "$lib/core/services/fixtureLineupWizard";

  const lineup_use_cases = get_fixture_lineup_use_cases();
  const fixture_use_cases = get_fixture_use_cases();
  const team_use_cases = get_team_use_cases();
  const player_use_cases = get_player_use_cases();
  const competition_use_cases = get_competition_use_cases();
  const competition_team_use_cases = get_competition_team_use_cases();
  const membership_use_cases = get_player_team_membership_use_cases();
  const player_position_use_cases = get_player_position_use_cases();
  const organization_use_cases = get_organization_use_cases();

  let form_data: CreateFixtureLineupInput = create_empty_fixture_lineup_input();
  let selected_fixture: Fixture | null = null;
  let selected_team: Team | null = null;
  let team_players: TeamPlayer[] = [];
  let min_players: number = 2;
  let max_players: number = 18;
  let starters_count: number = 11;

  type WizardStep = {
    step_key: "fixture" | "team" | "players" | "confirm";
    step_title: string;
    step_description?: string;
    is_completed: boolean;
    is_optional?: boolean;
  };

  let current_step_index: number = 0;
  let confirm_lock_understood: boolean = false;
  let player_search_text: string = "";
  let competition_teams_for_fixture: CompetitionTeam[] = [];
  let fixture_team_label_by_team_id: Map<string, string> = new Map();
  let filtered_team_players: TeamPlayer[] = [];
  let teams_with_existing_lineups: Map<string, string> = new Map();

  let fixtures: Fixture[] = [];
  let teams: Team[] = [];
  let available_teams: Team[] = [];
  let all_teams: Team[] = [];
  let all_competitions: Competition[] = [];
  let loading: boolean = true;
  let saving: boolean = false;
  let error_message: string = "";
  let validation_errors: Record<string, string> = {};

  $: current_fixture_title = selected_fixture
    ? get_fixture_name(selected_fixture)
    : "";

  $: fixture_select_options = fixtures.map((fixture) => ({
    value: fixture.id,
    label: get_fixture_name(fixture),
  }));

  $: team_select_options = available_teams.map((team) => ({
    value: team.id,
    label: fixture_team_label_by_team_id.get(team.id) || team.name,
  }));

  $: filtered_team_players = build_filtered_team_players(
    team_players,
    player_search_text,
  );

  $: wizard_steps = build_wizard_steps(
    selected_fixture,
    selected_team,
    form_data.selected_players.length,
    min_players,
    max_players,
    confirm_lock_understood,
  );

  onMount(async () => {
    await load_reference_data();
    loading = false;
  });

  async function load_reference_data(): Promise<void> {
    const [fixtures_result, teams_result, competitions_result] =
      await Promise.all([
        fixture_use_cases.list(undefined, {
          page_number: 1,
          page_size: 200,
        }),
        team_use_cases.list(undefined, { page_number: 1, page_size: 200 }),
        competition_use_cases.list(undefined, {
          page_number: 1,
          page_size: 200,
        }),
      ]);

    if (fixtures_result.success) {
      fixtures = fixtures_result.data;
    }

    if (teams_result.success) {
      all_teams = teams_result.data;
      teams = teams_result.data;
    }

    if (competitions_result.success) {
      all_competitions = competitions_result.data;
    }

    if (fixtures.length === 0) {
      error_message = build_error_message(
        "No fixtures available.",
        "A fixture is required to submit a team lineup.",
        "Create fixtures first (Fixtures tab), then come back here to submit a lineup.",
      );
    }
  }

  async function handle_fixture_change(): Promise<void> {
    error_message = "";
    validation_errors = {};
    confirm_lock_understood = false;
    player_search_text = "";

    if (!form_data.fixture_id) {
      selected_fixture = null;
      competition_teams_for_fixture = [];
      fixture_team_label_by_team_id = new Map();
      teams = [];
      reset_team_and_roster();
      current_step_index = 0;
      return;
    }

    const fixture_result = await fixture_use_cases.get_by_id(
      form_data.fixture_id,
    );
    if (!fixture_result.success || !fixture_result.data) {
      error_message = build_error_message(
        "Failed to load fixture.",
        "The selected fixture could not be found.",
        "Refresh the page and try selecting the fixture again.",
      );
      selected_fixture = null;
      teams = [];
      reset_team_and_roster();
      current_step_index = 0;
      return;
    }

    selected_fixture = fixture_result.data;

    const competition_result = await competition_use_cases.get_by_id(
      selected_fixture.competition_id,
    );
    if (!competition_result.success || !competition_result.data) {
      error_message = build_error_message(
        "Failed to load competition for fixture.",
        "Competition data is required to determine lineup rules.",
        "Ensure the fixture has a valid competition, then retry.",
      );
      teams = [];
      reset_team_and_roster();
      current_step_index = 0;
      return;
    }

    const competition = competition_result.data;

    const [organization_result, competition_teams_result] = await Promise.all([
      organization_use_cases.get_by_id(competition.organization_id),
      competition_team_use_cases.list_teams_in_competition(competition.id, {
        page_number: 1,
        page_size: 2000,
      }),
    ]);

    if (
      organization_result.success &&
      organization_result.data &&
      organization_result.data.sport_id
    ) {
      const sport_result = await get_sport_by_id(
        organization_result.data.sport_id,
      );
      if (sport_result.success && sport_result.data) {
        min_players = sport_result.data.min_players_per_fixture || 2;
        max_players = sport_result.data.max_players_per_fixture || 18;
        starters_count = sport_result.data.max_players_on_field || 11;
      }
    }

    if (competition.rule_overrides) {
      const overrides = competition.rule_overrides;
      if (overrides.min_players_on_field !== undefined) {
        min_players = overrides.min_players_on_field;
      }
      if (overrides.max_squad_size !== undefined) {
        max_players = overrides.max_squad_size;
      }
      if (overrides.max_players_on_field !== undefined) {
        starters_count = overrides.max_players_on_field;
      }
    }

    competition_teams_for_fixture =
      competition_teams_result.success && competition_teams_result.data
        ? competition_teams_result.data.items
        : [];

    const [home_team_result, away_team_result] = await Promise.all([
      team_use_cases.get_by_id(selected_fixture.home_team_id),
      team_use_cases.get_by_id(selected_fixture.away_team_id),
    ]);

    teams = [];
    if (home_team_result.success && home_team_result.data)
      teams.push(home_team_result.data);
    if (away_team_result.success && away_team_result.data)
      teams.push(away_team_result.data);

    fixture_team_label_by_team_id = build_fixture_team_label_map(
      teams,
      competition_teams_for_fixture,
    );

    const existing_lineups_result =
      await lineup_use_cases.list_lineups_by_fixture(form_data.fixture_id, {
        page: 1,
        page_size: 100,
      });

    teams_with_existing_lineups = new Map();
    if (existing_lineups_result.success && existing_lineups_result.data) {
      for (const lineup of existing_lineups_result.data) {
        const team_for_lineup = teams.find((t) => t.id === lineup.team_id);
        const team_label = team_for_lineup
          ? fixture_team_label_by_team_id.get(team_for_lineup.id) ||
            team_for_lineup.name
          : lineup.team_id;
        teams_with_existing_lineups.set(lineup.team_id, team_label);
      }
    }

    available_teams = teams.filter(
      (team) => !teams_with_existing_lineups.has(team.id),
    );

    reset_team_and_roster();
    current_step_index = 1;
  }

  async function handle_team_change(): Promise<void> {
    validation_errors = {};
    error_message = "";
    confirm_lock_understood = false;
    player_search_text = "";

    if (!form_data.fixture_id) {
      validation_errors.fixture_id = build_error_message(
        "No fixture selected.",
        "A fixture is required before you can choose a team.",
        "Select a fixture in Step 1, then continue.",
      );
      reset_team_and_roster();
      return;
    }

    if (!form_data.team_id) {
      reset_team_and_roster();
      return;
    }

    if (selected_fixture) {
      const fixture_team_ids = new Set([
        selected_fixture.home_team_id,
        selected_fixture.away_team_id,
      ]);
      if (!fixture_team_ids.has(form_data.team_id)) {
        validation_errors.team_id = build_error_message(
          "Invalid team selection.",
          "Only teams participating in the selected fixture can submit a lineup.",
          "Choose either the home or away team listed for the fixture.",
        );
        reset_team_and_roster();
        return;
      }
    }

    const [team_result, players_result, memberships_result, positions_result] =
      await Promise.all([
        team_use_cases.get_by_id(form_data.team_id),
        player_use_cases.list_players_by_team(form_data.team_id, {
          page_number: 1,
          page_size: 500,
        }),
        membership_use_cases.list_memberships_by_team(form_data.team_id, {
          page_number: 1,
          page_size: 5000,
        }),
        player_position_use_cases.list(undefined, {
          page_number: 1,
          page_size: 500,
        }),
      ]);

    selected_team = team_result.success ? (team_result.data ?? null) : null;

    const base_players =
      players_result.success && players_result.data
        ? players_result.data.items
        : [];
    const memberships =
      memberships_result.success && memberships_result.data
        ? memberships_result.data.items
        : [];
    const positions = positions_result.success ? positions_result.data : [];

    const position_name_by_id = build_position_name_by_id(positions);
    team_players = build_team_players(
      base_players,
      memberships,
      position_name_by_id,
    );

    if (team_players.length === 0) {
      validation_errors.players = build_error_message(
        "No players found for this team.",
        "A team must have players assigned via Player-Team Memberships.",
        "Create Player-Team Memberships for this team, then retry.",
      );
      form_data.selected_players = [];
      current_step_index = 2;
      return;
    }

    form_data.selected_players = derive_initial_selected_players(
      team_players,
      max_players,
    );
    current_step_index = 2;
  }

  function validate_players_step(): boolean {
    validation_errors = {};
    const count = form_data.selected_players.length;

    if (count < min_players) {
      validation_errors.players = build_error_message(
        `Not enough players selected (${count} of minimum ${min_players}).`,
        `This fixture requires at least ${min_players} players to be selected.`,
        `Select ${min_players - count} more player(s) to continue.`,
      );
      return false;
    }

    if (count > max_players) {
      validation_errors.players = build_error_message(
        `Too many players selected (${count} of maximum ${max_players}).`,
        `This fixture allows a maximum of ${max_players} players.`,
        `Remove ${count - max_players} player(s) to continue.`,
      );
      return false;
    }

    return true;
  }

  function handle_step_change_attempt(
    from_step_index: number,
    to_step_index: number,
  ): boolean {
    if (from_step_index === 2 && to_step_index > from_step_index) {
      return validate_players_step();
    }
    return true;
  }

  function get_player_role_label(player_index: number): string {
    if (player_index < starters_count) {
      return "Starter";
    }
    return "Substitute";
  }

  function toggle_player_selection(player_id: string): boolean {
    const selected_player_ids = form_data.selected_players.map((p) => p.id);
    const is_selected = selected_player_ids.includes(player_id);

    if (is_selected) {
      form_data.selected_players = form_data.selected_players.filter(
        (p) => p.id !== player_id,
      );
      return true;
    }

    if (form_data.selected_players.length >= max_players) {
      error_message = `Maximum ${max_players} players can be selected`;
      setTimeout(() => (error_message = ""), 3000);
      return false;
    }

    const team_player = team_players.find((p) => p.id === player_id);
    if (!team_player) return false;

    form_data.selected_players = [
      ...form_data.selected_players,
      convert_team_player_to_lineup_player(team_player),
    ];
    return true;
  }

  function select_all_players(): void {
    form_data.selected_players = team_players
      .slice(0, max_players)
      .map((p) => convert_team_player_to_lineup_player(p));
  }

  function deselect_all_players(): void {
    form_data.selected_players = [];
  }

  async function handle_submit_locked_lineup(): Promise<void> {
    if (saving) return;
    validation_errors = {};
    error_message = "";

    if (!selected_fixture || !form_data.fixture_id) {
      validation_errors.fixture_id = build_error_message(
        "Fixture is required.",
        "A lineup must belong to a fixture.",
        "Select a fixture in Step 1.",
      );
      current_step_index = 0;
      return;
    }

    if (!selected_team || !form_data.team_id) {
      validation_errors.team_id = build_error_message(
        "Team is required.",
        "A lineup must be submitted by a team participating in the fixture.",
        "Select a team in Step 2.",
      );
      current_step_index = 1;
      return;
    }

    const count = form_data.selected_players.length;
    if (count < min_players || count > max_players) {
      validation_errors.players = build_error_message(
        "Invalid squad size.",
        `This fixture requires between ${min_players} and ${max_players} players, but ${count} were selected.`,
        "Adjust the selected players in Step 3, then confirm again.",
      );
      current_step_index = 2;
      return;
    }

    if (!confirm_lock_understood) {
      validation_errors.confirm = build_error_message(
        "Confirmation required.",
        "Submitting a lineup locks it to prevent accidental changes.",
        "Tick the confirmation checkbox in Step 4 to proceed.",
      );
      current_step_index = 3;
      return;
    }

    saving = true;

    const existing = await lineup_use_cases.get_lineup_for_team_in_fixture(
      form_data.fixture_id,
      form_data.team_id,
    );

    if (existing.success) {
      saving = false;
      error_message = build_error_message(
        "A lineup already exists for this team in this fixture.",
        "Only one locked lineup is allowed per team per fixture.",
        "Open the existing lineup from the Fixture Lineups list.",
      );
      return;
    }

    const create_input: CreateFixtureLineupInput = {
      ...form_data,
      status: "locked",
      submitted_at: new Date().toISOString(),
      submitted_by: form_data.submitted_by?.trim() || "system",
    };

    const result = await lineup_use_cases.create(create_input);
    saving = false;

    if (!result.success || !result.data) {
      error_message =
        result.error_message ||
        build_error_message(
          "Failed to submit lineup.",
          "The lineup could not be saved.",
          "Retry. If the problem persists, reset demo data and try again.",
        );
      return;
    }

    goto(`/fixture-lineups/${result.data.id}`);
  }

  function log_debug(message: string, data?: any): boolean {
    console.log(`[DEBUG] ${message}`, data);
    return true;
  }

  function get_fixture_name(fixture: Fixture): string {
    const home_team = all_teams.find((t) => t.id === fixture.home_team_id);
    const away_team = all_teams.find((t) => t.id === fixture.away_team_id);
    const competition = all_competitions.find(
      (c) => c.id === fixture.competition_id,
    );
    const teams_label = `${home_team?.name || "Unknown"} vs ${away_team?.name || "Unknown"}`;
    const date_time_suffix = format_fixture_date_time(
      fixture.scheduled_date,
      fixture.scheduled_time,
    );
    const competition_suffix = competition?.name || "";

    let label = teams_label;
    if (date_time_suffix) {
      label += ` [${date_time_suffix}]`;
    }
    if (competition_suffix) {
      label += ` [${competition_suffix}]`;
    }
    return label;
  }

  function format_fixture_date_time(
    scheduled_date: string,
    scheduled_time: string,
  ): string {
    if (!scheduled_date || scheduled_date.trim() === "") return "";

    const date = new Date(scheduled_date);
    if (isNaN(date.getTime())) return "";

    const day = date.getDate();
    const month_names = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = month_names[date.getMonth()];
    const year = date.getFullYear();
    const formatted_date = `${day} ${month} ${year}`;

    if (scheduled_time && scheduled_time.trim() !== "") {
      return `${formatted_date} - ${scheduled_time}`;
    }

    return formatted_date;
  }

  function reset_team_and_roster(): boolean {
    form_data.team_id = "";
    form_data.selected_players = [];
    selected_team = null;
    team_players = [];
    return true;
  }

  function build_filtered_team_players(
    players: TeamPlayer[],
    search_text: string,
  ): TeamPlayer[] {
    const search = search_text.trim();
    if (!search) return players;
    return players.filter((player) =>
      matches_team_player_search(player, search),
    );
  }

  function build_fixture_team_label_map(
    fixture_teams: Team[],
    competition_teams: CompetitionTeam[],
  ): Map<string, string> {
    const by_team_id = new Map(competition_teams.map((ct) => [ct.team_id, ct]));

    return new Map(
      fixture_teams.map((team) => {
        const competition_team = by_team_id.get(team.id) || null;
        const seed = competition_team?.seed_number
          ? ` • Seed ${competition_team.seed_number}`
          : "";
        const status = competition_team?.status
          ? ` • ${competition_team.status}`
          : " • not registered";
        return [team.id, `${team.name}${seed}${status}`];
      }),
    );
  }

  function build_wizard_steps(
    fixture: Fixture | null,
    team: Team | null,
    selected_player_count: number,
    minimum_players: number,
    maximum_players: number,
    confirm_lock: boolean,
  ): WizardStep[] {
    const fixture_completed = Boolean(fixture);
    const team_completed = Boolean(team);
    const players_completed =
      selected_player_count >= minimum_players &&
      selected_player_count <= maximum_players;
    const confirm_completed = players_completed && confirm_lock;

    return [
      {
        step_key: "fixture",
        step_title: "Fixture",
        step_description: "Choose the fixture",
        is_completed: fixture_completed,
      },
      {
        step_key: "team",
        step_title: "Team",
        step_description: "Choose home/away competition team",
        is_completed: team_completed,
      },
      {
        step_key: "players",
        step_title: "Players",
        step_description: `Select ${minimum_players}-${maximum_players}`,
        is_completed: players_completed,
      },
      {
        step_key: "confirm",
        step_title: "Confirm",
        step_description: "Review + lock",
        is_completed: confirm_completed,
      },
    ];
  }
</script>

<svelte:head>
  <title>Create Fixture Lineup - Sports Organisation Management</title>
</svelte:head>

<div class="space-y-6">
  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
  >
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100 mb-2">
        Create Fixture Lineup
      </h1>
      <p class="text-accent-600 dark:text-accent-300">
        Select players for this team's lineup ({min_players}-{max_players} players)
      </p>
    </div>

    {#if error_message}
      <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p class="text-red-600 dark:text-red-400 whitespace-pre-line">
          {error_message}
        </p>
      </div>
    {/if}

    {#if Object.keys(validation_errors).length > 0}
      <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <ul class="list-disc pl-5">
          {#each Object.entries(validation_errors) as [key, msg]}
            <li class="text-red-600 dark:text-red-400 whitespace-pre-line">
              {msg}
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <UiWizardStepper
      steps={wizard_steps}
      bind:current_step_index
      is_mobile_view={true}
      is_busy={saving}
      validate_step_change={handle_step_change_attempt}
      on:wizard_cancelled={() => goto("/fixture-lineups")}
      on:wizard_completed={handle_submit_locked_lineup}
    >
      <svelte:fragment let:step_index>
        <div class="space-y-6">
          {#if step_index === 0}
            <div>
              <SelectField
                label="Fixture"
                name="fixture"
                value={form_data.fixture_id}
                options={fixture_select_options}
                placeholder={loading
                  ? "Loading fixtures..."
                  : "Search fixture..."}
                required={true}
                disabled={loading || saving}
                is_loading={loading}
                error={validation_errors.fixture_id || ""}
                on:change={(event) => {
                  form_data.fixture_id = event.detail.value;
                  void handle_fixture_change();
                }}
              />
            </div>

            {#if fixtures.length === 0}
              <div
                class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg whitespace-pre-line text-red-700 dark:text-red-300"
              >
                {error_message}
              </div>
            {/if}
          {/if}

          {#if step_index === 1}
            <div>
              <div class="mb-4">
                <div class="text-sm text-accent-600 dark:text-accent-300">
                  {#if selected_fixture}
                    {get_fixture_name(selected_fixture)}
                  {:else}
                    Select a fixture first.
                  {/if}
                </div>
              </div>

              {#if teams_with_existing_lineups.size > 0}
                <div
                  class="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700"
                >
                  <div class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div>
                      <p class="font-medium text-amber-800 dark:text-amber-200">
                        Some teams have already submitted lineups
                      </p>
                      <p
                        class="mt-1 text-sm text-amber-700 dark:text-amber-300"
                      >
                        The following teams already have a lineup for this
                        fixture and are not shown below:
                      </p>
                      <ul
                        class="mt-2 text-sm text-amber-700 dark:text-amber-300 list-disc list-inside"
                      >
                        {#each Array.from(teams_with_existing_lineups.values()) as team_name}
                          <li>{team_name}</li>
                        {/each}
                      </ul>
                      {#if available_teams.length === 0}
                        <p
                          class="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200"
                        >
                          All teams in this fixture have already submitted their
                          lineups.
                        </p>
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}

              <SelectField
                label="Team"
                name="team"
                value={form_data.team_id}
                options={team_select_options}
                placeholder={!selected_fixture
                  ? "Select a fixture first"
                  : available_teams.length === 0
                    ? "All teams have submitted lineups"
                    : "Search home/away team..."}
                required={true}
                disabled={!selected_fixture ||
                  saving ||
                  available_teams.length === 0}
                error={validation_errors.team_id || ""}
                on:change={(event) => {
                  form_data.team_id = event.detail.value;
                  void handle_team_change();
                }}
              />
            </div>
          {/if}

          {#if step_index === 2}
            <div class="space-y-4">
              {#if current_fixture_title}
                <div
                  class="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-700"
                >
                  <p
                    class="text-sm font-medium text-secondary-800 dark:text-secondary-200"
                  >
                    {current_fixture_title}
                  </p>
                </div>
              {/if}
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div class="text-sm text-accent-700 dark:text-accent-300">
                  <span class="font-medium">
                    Selected {form_data.selected_players.length} of {max_players}
                    (min {min_players})
                  </span>
                  <span
                    class="block sm:inline sm:ml-2 text-xs text-accent-500 dark:text-accent-400"
                  >
                    • First {starters_count} = Starters, rest = Substitutes
                  </span>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-primary-action"
                    on:click={select_all_players}
                    disabled={!selected_team}
                  >
                    Select First {max_players}
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline"
                    on:click={deselect_all_players}
                    disabled={!selected_team}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div>
                <input
                  class="input"
                  placeholder="Search by name, jersey, or position"
                  bind:value={player_search_text}
                  disabled={!selected_team}
                />
              </div>

              {#if validation_errors.players}
                <div
                  class="whitespace-pre-line text-red-600 dark:text-red-400 text-sm font-semibold"
                >
                  {validation_errors.players}
                </div>
              {/if}

              {#if !selected_team}
                <div
                  class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200"
                >
                  Select a team first to load players.
                </div>
              {:else if filtered_team_players.length === 0}
                <div
                  class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200"
                >
                  No players match your search.
                </div>
              {:else}
                <div
                  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {#each filtered_team_players as player}
                    {@const player_selection_index =
                      form_data.selected_players.findIndex(
                        (p) => p.id === player.id,
                      )}
                    {@const is_selected = player_selection_index >= 0}
                    {@const player_role = is_selected
                      ? get_player_role_label(player_selection_index)
                      : ""}
                    {@const selection_disabled =
                      !is_selected &&
                      form_data.selected_players.length >= max_players}
                    <button
                      type="button"
                      class="flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer select-none text-left {is_selected
                        ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                        : 'border-accent-200 dark:border-accent-700 hover:border-secondary-300'} {selection_disabled
                        ? 'opacity-60 cursor-not-allowed'
                        : ''}"
                      on:click={() => {
                        if (!selection_disabled)
                          toggle_player_selection(player.id);
                      }}
                      aria-disabled={selection_disabled}
                    >
                      <div class="flex-1">
                        <div class="flex items-start justify-between gap-2">
                          <div>
                            <p
                              class="font-medium text-accent-900 dark:text-accent-100"
                            >
                              {player.first_name}
                              {player.last_name}
                            </p>
                            <p
                              class="text-sm text-accent-600 dark:text-accent-400"
                            >
                              #{player.jersey_number ?? "?"} • {player.position ||
                                "No position"}
                            </p>
                            {#if is_selected}
                              <span
                                class="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded {player_role ===
                                'Starter'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}"
                              >
                                {player_role}
                              </span>
                            {/if}
                          </div>
                          <div
                            class="h-6 w-6 rounded-full flex items-center justify-center border {is_selected
                              ? 'bg-secondary-600 border-secondary-600 text-white'
                              : 'border-accent-300 dark:border-accent-600 text-transparent'}"
                          >
                            ✓
                          </div>
                        </div>
                      </div>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}

          {#if step_index === 3}
            <div class="space-y-5">
              {#if current_fixture_title}
                <div
                  class="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-700"
                >
                  <p
                    class="text-sm font-medium text-secondary-800 dark:text-secondary-200"
                  >
                    {current_fixture_title}
                  </p>
                </div>
              {/if}
              <div
                class="p-4 rounded-lg border border-accent-200 dark:border-accent-700 bg-accent-50 dark:bg-accent-900/20"
              >
                <div class="font-semibold text-accent-900 dark:text-accent-100">
                  Submission summary
                </div>
                <div class="text-sm text-accent-700 dark:text-accent-300 mt-1">
                  {#if selected_fixture}
                    Fixture: {get_fixture_name(selected_fixture)}
                  {/if}
                  {#if selected_team}
                    <div>Team: {selected_team.name}</div>
                  {/if}
                  <div>
                    Squad size: {form_data.selected_players.length}
                    ({Math.min(
                      starters_count,
                      form_data.selected_players.length,
                    )} starters, {Math.max(
                      0,
                      form_data.selected_players.length - starters_count,
                    )} substitutes)
                  </div>
                </div>
              </div>

              {#if form_data.selected_players.length > 0}
                {@const starters = form_data.selected_players.slice(
                  0,
                  starters_count,
                )}
                {@const substitutes =
                  form_data.selected_players.slice(starters_count)}

                <div class="space-y-4">
                  <div>
                    <h3
                      class="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2"
                    >
                      <span
                        class="inline-block w-3 h-3 rounded-full bg-green-500"
                      ></span>
                      Starters ({starters.length})
                    </h3>
                    <div class="space-y-2">
                      {#each sort_lineup_players(starters) as player}
                        <div
                          class="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                        >
                          <div class="flex items-center justify-between">
                            <div
                              class="font-medium text-accent-900 dark:text-accent-100"
                            >
                              #{player.jersey_number ?? "?"}
                              {player.first_name}
                              {player.last_name}
                            </div>
                            <div
                              class="text-sm text-accent-600 dark:text-accent-400"
                            >
                              {player.position || "No position"}
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>

                  {#if substitutes.length > 0}
                    <div>
                      <h3
                        class="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2"
                      >
                        <span
                          class="inline-block w-3 h-3 rounded-full bg-amber-500"
                        ></span>
                        Substitutes ({substitutes.length})
                      </h3>
                      <div class="space-y-2">
                        {#each sort_lineup_players(substitutes) as player}
                          <div
                            class="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                          >
                            <div class="flex items-center justify-between">
                              <div
                                class="font-medium text-accent-900 dark:text-accent-100"
                              >
                                #{player.jersey_number ?? "?"}
                                {player.first_name}
                                {player.last_name}
                              </div>
                              <div
                                class="text-sm text-accent-600 dark:text-accent-400"
                              >
                                {player.position || "No position"}
                              </div>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}

              <div
                class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-900 dark:text-yellow-100"
              >
                <div class="font-semibold">Warning</div>
                <div class="text-sm mt-1">
                  Submitting this lineup will lock it. Editing will only be
                  possible in exceptional circumstances.
                </div>
              </div>

              {#if validation_errors.confirm}
                <div
                  class="whitespace-pre-line text-red-600 dark:text-red-400 text-sm font-semibold"
                >
                  {validation_errors.confirm}
                </div>
              {/if}

              <label
                class="flex items-start gap-3 p-4 rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  class="mt-1 form-checkbox h-5 w-5 text-secondary-600"
                  bind:checked={confirm_lock_understood}
                />
                <div>
                  <div class="font-medium text-accent-900 dark:text-accent-100">
                    I understand this lineup will be locked after submission.
                  </div>
                  <div class="text-sm text-accent-600 dark:text-accent-400">
                    If changes are needed later, an admin workflow will be
                    required.
                  </div>
                </div>
              </label>

              <div>
                <label
                  for="notes"
                  class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  bind:value={form_data.notes}
                  rows="3"
                  class="input"
                  placeholder="Add any notes about this lineup..."
                ></textarea>
              </div>
            </div>
          {/if}
        </div>
      </svelte:fragment>
    </UiWizardStepper>
  </div>
</div>
