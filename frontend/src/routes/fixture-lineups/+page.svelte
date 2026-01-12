<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { get_fixture_lineup_use_cases } from "$lib/usecases/FixtureLineupUseCases";
  import type { FixtureLineup } from "$lib/domain/entities/FixtureLineup";
  let lineups: FixtureLineup[] = [];
  let loading = true;
  onMount(async () => {
    const result = await get_fixture_lineup_use_cases().list(undefined, {
      page: 1,
      page_size: 100,
    });
    if (result.success) lineups = result.data;
    loading = false;
  });
  function handle_create() {
    goto("/fixture-lineups/create");
  }
</script>

<svelte:head>
  <title>Team Fixture Lineups - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
      Team Fixture Lineups
    </h1>
    <button class="btn btn-primary" on:click={handle_create}
      >Create New Lineup</button
    >
  </div>
  {#if loading}
    <div>Loading...</div>
  {:else if lineups.length === 0}
    <div>No fixture lineups found.</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each lineups as lineup}
        <div class="p-4 border rounded-lg bg-white dark:bg-accent-800">
          <div class="font-semibold text-accent-900 dark:text-accent-100 mb-2">
            {lineup.team_id}
          </div>
          <div class="text-accent-600 dark:text-accent-300">
            Fixture: {lineup.fixture_id}
          </div>
          <div class="text-accent-600 dark:text-accent-300">
            Players: {lineup.selected_player_ids.length}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
