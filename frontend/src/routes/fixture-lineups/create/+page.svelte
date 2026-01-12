<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type { CreateFixtureLineupInput } from "$lib/domain/entities/FixtureLineup";
  import type { Fixture } from "$lib/domain/entities/Fixture";
  import type { Team } from "$lib/domain/entities/Team";
  import type { Player } from "$lib/domain/entities/Player";
  import type { Competition } from "$lib/domain/entities/Competition";
  import type { Sport } from "$lib/domain/entities/Sport";
  import { get_fixture_lineup_use_cases } from "$lib/usecases/FixtureLineupUseCases";
  import { get_fixture_use_cases } from "$lib/usecases/FixtureUseCases";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import { get_player_use_cases } from "$lib/usecases/PlayerUseCases";
  import { get_competition_use_cases } from "$lib/usecases/CompetitionUseCases";
  import { get_sport_by_id } from "$lib/services/sportService";
  import { create_empty_fixture_lineup_input } from "$lib/domain/entities/FixtureLineup";

  const lineup_use_cases = get_fixture_lineup_use_cases();
  const fixture_use_cases = get_fixture_use_cases();
  const team_use_cases = get_team_use_cases();
  const player_use_cases = get_player_use_cases();
  const competition_use_cases = get_competition_use_cases();

  let form_data: CreateFixtureLineupInput = create_empty_fixture_lineup_input();
  let selected_fixture: Fixture | null = null;
  let selected_team: Team | null = null;
  let team_players: Player[] = [];
  let min_players: number = 2;
  let max_players: number = 18;

  let fixtures: Fixture[] = [];
  let teams: Team[] = [];
  let loading: boolean = true;
  let saving: boolean = false;
  let error_message: string = "";
  let validation_errors: Record<string, string> = {};

  onMount(async () => {
    await load_reference_data();
    loading = false;
  });

  async function load_reference_data(): Promise<void> {
    const [fixtures_result, teams_result] = await Promise.all([
      fixture_use_cases.list(undefined, {
        page: 1,
        page_size: 200,
      }),
      team_use_cases.list(undefined, { page: 1, page_size: 200 }),
    ]);

    if (fixtures_result.success) {
      fixtures = fixtures_result.data;
    }

    if (teams_result.success) {
      teams = teams_result.data;
    }
  }

  async function handle_fixture_change(): Promise<void> {
    if (!form_data.fixture_id) {
      selected_fixture = null;
      teams = [];
      return;
    }

    const fixture_result = await fixture_use_cases.get_by_id(
      form_data.fixture_id
    );
    if (!fixture_result.success) return;

    selected_fixture = fixture_result.data || null;
    if (!selected_fixture) return;

    const competition_result = await competition_use_cases.get_by_id(
      selected_fixture.competition_id
    );
    if (!competition_result.success) return;

    const competition = competition_result.data;
    if (!competition) return;

    const sport_result = await get_sport_by_id(competition.sport_id);
    if (sport_result.success && sport_result.data) {
      min_players = sport_result.data.min_players_per_fixture || 2;
      max_players = sport_result.data.max_players_per_fixture || 18;
    }

    const [home_team_result, away_team_result] = await Promise.all([
      team_use_cases.get_by_id(selected_fixture.home_team_id),
      team_use_cases.get_by_id(selected_fixture.away_team_id),
    ]);

    teams = [];
    if (home_team_result.success && home_team_result.data)
      teams.push(home_team_result.data);
    if (away_team_result.success && away_team_result.data)
      teams.push(away_team_result.data);

    form_data.team_id = "";
    form_data.selected_player_ids = [];
    selected_team = null;
    team_players = [];
  }

  async function handle_team_change(): Promise<void> {
    if (!form_data.fixture_id) {
      validation_errors.fixture_id =
        "Select a fixture from the dropdown above.";
      log_debug("Validation failed: fixture_id missing", { form_data });
    }

    if (!form_data.team_id) {
      validation_errors.team_id =
        "Choose a team for this fixture using the dropdown above.";
      log_debug("Validation failed: team_id missing", { form_data });
      if (!form_data.fixture_id) {
        validation_errors.fixture_id =
          "No fixture selected.\nWhy: A fixture is required to create a lineup.\nHow to fix: Please select a fixture from the dropdown above.";
        log_debug("Validation failed: fixture_id missing", { form_data });
      }

      if (!form_data.team_id) {
        validation_errors.team_id =
          "No team selected.\nWhy: A team must be chosen for this fixture lineup.\nHow to fix: Please choose a team for this fixture using the dropdown above.";
        log_debug("Validation failed: team_id missing", { form_data });
      }

      if (form_data.selected_player_ids.length < min_players) {
        const team_name = selected_team?.name || "this team";
        const players_needed =
          min_players - form_data.selected_player_ids.length;
        validation_errors.players = `Not enough players selected for team '${team_name}'.\nWhy: At least ${min_players} player(s) are required for a lineup, but only ${form_data.selected_player_ids.length} are selected.\nHow to fix: Assign at least ${players_needed} more player(s) to '${team_name}'. Navigate to the Players tab and add players to '${team_name}' before creating a lineup.`;
        log_debug("Validation failed: not enough players", {
          selected: form_data.selected_player_ids.length,
          min_players,
          team_name,
          players_needed,
        });
      }

      if (form_data.selected_player_ids.length > max_players) {
        validation_errors.players = `Too many players selected.\nWhy: The maximum allowed for this lineup is ${max_players} player(s), but ${form_data.selected_player_ids.length} are selected.\nHow to fix: Deselect extra players until you have ${max_players} or fewer selected.`;
        log_debug("Validation failed: too many players", {
          selected: form_data.selected_player_ids.length,
          max_players,
        });
      }
      if (form_data.selected_player_ids.length >= max_players) {
        error_message = `Maximum ${max_players} players can be selected`;
        setTimeout(() => (error_message = ""), 3000);
        return;
      }
      form_data.selected_player_ids = [
        ...form_data.selected_player_ids,
        player_id,
      ];
    }
  }

  function select_all_players(): void {
    form_data.selected_player_ids = team_players
      .slice(0, max_players)
      .map((p) => p.id);
  }

  function deselect_all_players(): void {
    form_data.selected_player_ids = [];
  }

  async function handle_submit(): Promise<void> {
    validation_errors = {};
    error_message = "";
    log_debug("handle_submit called", { form_data });

    if (!form_data.fixture_id) {
      validation_errors.fixture_id = "Fixture is required";
      log_debug("Validation failed: fixture_id missing", { form_data });
    }

    if (!form_data.team_id) {
      validation_errors.team_id = "Team is required";
      log_debug("Validation failed: team_id missing", { form_data });
    }

    if (form_data.selected_player_ids.length < min_players) {
      const team_name = selected_team?.name || "this team";
      const players_needed = min_players - form_data.selected_player_ids.length;
      validation_errors.players = `Team '${team_name}' does not have enough players assigned for this fixture lineup. You need to assign at least ${players_needed} more player(s) (minimum required: ${min_players}).
Navigate to the Players tab and add players to '${team_name}' before creating a lineup.`;
      log_debug("Validation failed: not enough players", {
        selected: form_data.selected_player_ids.length,
        min_players,
        team_name,
        players_needed,
      });
    }

    if (form_data.selected_player_ids.length > max_players) {
      validation_errors.players = `Maximum ${max_players} player(s) can be selected`;
      log_debug("Validation failed: too many players", {
        selected: form_data.selected_player_ids.length,
        max_players,
      });
    }

    if (Object.keys(validation_errors).length > 0) {
      log_debug("Validation errors", { validation_errors });
      return;
    }

    saving = true;
    log_debug("Submitting lineup", { form_data });
    const result = await lineup_use_cases.create(form_data);
    saving = false;
    log_debug("Create result", { result });

    if (!result.success) {
      error_message = result.error_message || "Failed to create lineup";
      log_debug("Create failed", { error_message });
      return;
    }

    log_debug("Lineup created successfully, navigating");
    goto("/fixture-lineups");
  }

  function log_debug(message: string, data?: any): boolean {
    // Use a helper for debug logs, no comments, clear naming
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] ${message}`, data);
    return true;
  }

  function get_fixture_name(fixture: Fixture): string {
    const home_team = teams.find((t) => t.id === fixture.home_team_id);
    const away_team = teams.find((t) => t.id === fixture.away_team_id);
    return `${home_team?.name || "Unknown"} vs ${away_team?.name || "Unknown"}`;
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
        <p class="text-red-600 dark:text-red-400">{error_message}</p>
      </div>
    {/if}

    {#if Object.keys(validation_errors).length > 0}
      <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <ul class="list-disc pl-5">
          {#each Object.entries(validation_errors) as [key, msg]}
            <li class="text-red-600 dark:text-red-400">{msg}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <form on:submit|preventDefault={handle_submit} class="space-y-6">
      <div>
        <label
          for="fixture"
          class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
        >
          Fixture <span class="text-red-500">*</span>
        </label>
        <select
          id="fixture"
          bind:value={form_data.fixture_id}
          on:change={handle_fixture_change}
          class="input {validation_errors.fixture_id ? 'input-error' : ''}"
          required
        >
          <option value="">Select a fixture</option>
          {#each fixtures as fixture}
            <option value={fixture.id}>{get_fixture_name(fixture)}</option>
          {/each}
        </select>
        {#if validation_errors.fixture_id}
          <div
            class="mt-1 text-red-600 dark:text-red-400 text-sm font-semibold"
          >
            {validation_errors.fixture_id}
          </div>
        {/if}
      </div>

      {#if selected_fixture}
        <div>
          <label
            for="team"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
          >
            Team <span class="text-red-500">*</span>
          </label>
          <select
            id="team"
            bind:value={form_data.team_id}
            on:change={handle_team_change}
            class="input {validation_errors.team_id ? 'input-error' : ''}"
            required
          >
            <option value="">Select a team</option>
            {#each teams as team}
              <option value={team.id}>{team.name}</option>
            {/each}
          </select>
          {#if validation_errors.team_id}
            <div
              class="mt-1 text-red-600 dark:text-red-400 text-sm font-semibold"
            >
              {validation_errors.team_id}
            </div>
          {/if}
        </div>
      {/if}

      {#if selected_team && team_players.length > 0}
        <div>
          <div class="flex justify-between items-center mb-4">
            <div
              class="block text-sm font-medium text-accent-700 dark:text-accent-300"
            >
              Select Players ({form_data.selected_player_ids
                .length}/{max_players})
              <span class="text-red-500">*</span>
            </div>
            <div class="space-x-2">
              <button
                type="button"
                class="btn btn-sm btn-secondary"
                on:click={select_all_players}
              >
                Select All
              </button>
              <button
                type="button"
                class="btn btn-sm btn-secondary"
                on:click={deselect_all_players}
              >
                Deselect All
              </button>
            </div>
          </div>

          {#if validation_errors.players}
            <div
              class="mb-4 text-red-600 dark:text-red-400 text-sm font-semibold"
            >
              {validation_errors.players}
            </div>
          {/if}

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each team_players as player}
              {@const is_selected = form_data.selected_player_ids.includes(
                player.id
              )}
              <label
                class="flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer select-none {is_selected
                  ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                  : 'border-accent-200 dark:border-accent-700 hover:border-secondary-300'}"
              >
                <input
                  type="checkbox"
                  class="form-checkbox h-5 w-5 text-secondary-600 mr-3"
                  checked={is_selected}
                  on:change={() => toggle_player_selection(player.id)}
                  aria-label="Select {player.first_name} {player.last_name}"
                />
                <div class="flex-1 text-left">
                  <p class="font-medium text-accent-900 dark:text-accent-100">
                    {player.first_name}
                    {player.last_name}
                  </p>
                  <p class="text-sm text-accent-600 dark:text-accent-400">
                    #{player.jersey_number} • {player.position}
                  </p>
                </div>
              </label>
            {/each}
          </div>
        </div>

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
      {/if}

      <div class="flex justify-end space-x-4">
        <button
          type="button"
          class="btn btn-secondary"
          on:click={() => goto("/fixture-lineups")}
        >
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" disabled={saving}>
          {saving ? "Creating..." : "Create Lineup"}
        </button>
      </div>
    </form>
  </div>
</div>
