<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type {
    FixtureLineup,
    UpdateFixtureLineupInput,
  } from "$lib/domain/entities/FixtureLineup";
  import type { Fixture } from "$lib/domain/entities/Fixture";
  import type { Team } from "$lib/domain/entities/Team";
  import type { Player } from "$lib/domain/entities/Player";
  import { get_fixture_lineup_use_cases } from "$lib/usecases/FixtureLineupUseCases";
  import { get_fixture_use_cases } from "$lib/usecases/FixtureUseCases";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import { get_player_use_cases } from "$lib/usecases/PlayerUseCases";
  import {
    get_fixture_lineup_by_id,
    submit_lineup,
    lock_lineup,
  } from "$lib/services/fixtureLineupService";

  const lineup_use_cases = get_fixture_lineup_use_cases();
  const fixture_use_cases = get_fixture_use_cases();
  const team_use_cases = get_team_use_cases();
  const player_use_cases = get_player_use_cases();

  let lineup_id: string = "";
  let lineup: FixtureLineup | null = null;
  let fixture: Fixture | null = null;
  let team: Team | null = null;
  let team_players: Player[] = [];
  let selected_players_map: Map<string, Player> = new Map();
  let home_team: Team | null = null;
  let away_team: Team | null = null;

  let loading: boolean = true;
  let saving: boolean = false;
  let error_message: string = "";

  $: lineup_id = $page.params.id || "";

  onMount(async () => {
    await load_lineup();
  });

  async function load_lineup(): Promise<void> {
    loading = true;
    error_message = "";

    const result = await get_fixture_lineup_by_id(lineup_id);
    if (!result.success || !result.data) {
      error_message = result.error_message || "Lineup not found";
      loading = false;
      return;
    }

    lineup = result.data;

    const [fixture_result, team_result, players_result] = await Promise.all([
      fixture_use_cases.get_by_id(lineup.fixture_id),
      team_use_cases.get_by_id(lineup.team_id),
      player_use_cases.list(
        { team_id: lineup.team_id },
        { page: 1, page_size: 100 }
      ),
    ]);

    if (fixture_result.success && fixture_result.data) {
      fixture = fixture_result.data;

      const [home_team_result, away_team_result] = await Promise.all([
        team_use_cases.get_by_id(fixture.home_team_id),
        team_use_cases.get_by_id(fixture.away_team_id),
      ]);

      if (home_team_result.success && home_team_result.data)
        home_team = home_team_result.data;
      if (away_team_result.success && away_team_result.data)
        away_team = away_team_result.data;
    }

    if (team_result.success && team_result.data) team = team_result.data;
    if (players_result.success) {
      team_players = players_result.data;
      selected_players_map = new Map(
        team_players
          .filter((p) => lineup?.selected_player_ids.includes(p.id))
          .map((p) => [p.id, p])
      );
    }

    loading = false;
  }

  function toggle_player_selection(player_id: string): void {
    if (!lineup || lineup.status === "locked") return;

    const is_selected = lineup.selected_player_ids.includes(player_id);
    const updated_ids = is_selected
      ? lineup.selected_player_ids.filter((id) => id !== player_id)
      : [...lineup.selected_player_ids, player_id];

    lineup.selected_player_ids = updated_ids;
    selected_players_map = new Map(
      team_players
        .filter((p) => updated_ids.includes(p.id))
        .map((p) => [p.id, p])
    );
  }

  async function handle_save(): Promise<void> {
    if (!lineup) return;

    saving = true;
    error_message = "";

    const update_data: UpdateFixtureLineupInput = {
      selected_player_ids: lineup.selected_player_ids,
      notes: lineup.notes,
    };

    const result = await lineup_use_cases.update(lineup_id, update_data);
    saving = false;

    if (!result.success) {
      error_message = result.error_message || "Failed to update lineup";
      return;
    }

    goto("/fixture-lineups");
  }

  async function handle_submit(): Promise<void> {
    if (!lineup) return;

    if (
      !confirm(
        "Submit this lineup? You won't be able to edit it after submission."
      )
    ) {
      return;
    }

    saving = true;
    const result = await submit_lineup(lineup_id);
    saving = false;

    if (!result.success) {
      error_message = result.error_message || "Failed to submit lineup";
      return;
    }

    goto("/fixture-lineups");
  }

  function get_fixture_name(fixture: Fixture | null): string {
    if (!fixture) return "Unknown Fixture";
    const home_team_name = home_team?.name || "Unknown";
    const away_team_name = away_team?.name || "Unknown";
    return `${home_team_name} vs ${away_team_name}`;
  }

  function get_status_class(status: string): string {
    const status_map: Record<string, string> = {
      draft: "status-warning",
      submitted: "status-active",
      locked: "status-inactive",
    };
    return status_map[status] || "status-inactive";
  }
</script>

<svelte:head>
  <title>Lineup Details - Sports Organisation Management</title>
</svelte:head>

<div class="space-y-6">
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="loading-spinner"></div>
    </div>
  {:else if error_message}
    <div
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
    >
      <p class="text-red-600 dark:text-red-400">{error_message}</p>
    </div>
  {:else if lineup}
    <div
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
    >
      <div class="flex justify-between items-start mb-6">
        <div>
          <h1
            class="text-2xl font-bold text-accent-900 dark:text-accent-100 mb-2"
          >
            {team?.name || "Unknown Team"} Lineup
          </h1>
          <p class="text-accent-600 dark:text-accent-300">
            {get_fixture_name(fixture)}
          </p>
        </div>
        <span class="px-3 py-1 rounded-full {get_status_class(lineup.status)}">
          {lineup.status}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="card p-4">
          <p class="text-sm text-accent-600 dark:text-accent-400 mb-1">
            Players Selected
          </p>
          <p class="text-2xl font-bold text-accent-900 dark:text-accent-100">
            {lineup.selected_player_ids.length}
          </p>
        </div>
        <div class="card p-4">
          <p class="text-sm text-accent-600 dark:text-accent-400 mb-1">
            Submitted By
          </p>
          <p class="text-lg font-medium text-accent-900 dark:text-accent-100">
            {lineup.submitted_by || "-"}
          </p>
        </div>
        <div class="card p-4">
          <p class="text-sm text-accent-600 dark:text-accent-400 mb-1">
            Submitted At
          </p>
          <p class="text-lg font-medium text-accent-900 dark:text-accent-100">
            {lineup.submitted_at
              ? new Date(lineup.submitted_at).toLocaleDateString()
              : "-"}
          </p>
        </div>
      </div>

      {#if lineup.status !== "locked"}
        <div class="mb-6">
          <h2
            class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4"
          >
            Manage Players
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each team_players as player}
              {@const is_selected = lineup.selected_player_ids.includes(
                player.id
              )}
              <button
                type="button"
                class="p-4 rounded-lg border-2 transition-all {is_selected
                  ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                  : 'border-accent-200 dark:border-accent-700 hover:border-secondary-300'}"
                on:click={() => toggle_player_selection(player.id)}
              >
                <div class="flex items-center justify-between">
                  <div class="text-left">
                    <p class="font-medium text-accent-900 dark:text-accent-100">
                      {player.first_name}
                      {player.last_name}
                    </p>
                    <p class="text-sm text-accent-600 dark:text-accent-400">
                      #{player.jersey_number} • {player.position}
                    </p>
                  </div>
                  {#if is_selected}
                    <svg
                      class="h-6 w-6 text-secondary-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </div>
      {:else}
        <div class="mb-6">
          <h2
            class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4"
          >
            Selected Players
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each Array.from(selected_players_map.values()) as player}
              <div
                class="p-4 rounded-lg border-2 border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20"
              >
                <p class="font-medium text-accent-900 dark:text-accent-100">
                  {player.first_name}
                  {player.last_name}
                </p>
                <p class="text-sm text-accent-600 dark:text-accent-400">
                  #{player.jersey_number} • {player.position}
                </p>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if lineup.notes}
        <div class="mb-6">
          <h3
            class="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
          >
            Notes
          </h3>
          <p class="text-accent-900 dark:text-accent-100">{lineup.notes}</p>
        </div>
      {/if}

      <div class="flex justify-end space-x-4">
        <button
          class="btn btn-secondary"
          on:click={() => goto("/fixture-lineups")}
        >
          Back to List
        </button>
        {#if lineup.status === "draft"}
          <button
            class="btn btn-secondary"
            on:click={handle_save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            class="btn btn-primary"
            on:click={handle_submit}
            disabled={saving}
          >
            Submit Lineup
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
