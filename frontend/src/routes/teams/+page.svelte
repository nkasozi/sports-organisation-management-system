<script lang="ts">
  import EntityCrudWrapper from "$lib/presentation/components/EntityCrudWrapper.svelte";
  import TeamProfilePreview from "$lib/presentation/components/TeamProfilePreview.svelte";
  import { writable } from "svelte/store";

  let selected_team_id = writable<string | null>(null);
  let entity_wrapper: EntityCrudWrapper;

  function handle_selection_changed(event: CustomEvent) {
    const selection = event.detail;
    if (selection && selection.length === 1) {
      selected_team_id.set(selection[0].id);
    } else {
      selected_team_id.set(null);
    }
  }
</script>

<svelte:head>
  <title>Teams - Sports Management</title>
</svelte:head>

<div class="space-y-4">
  {#if $selected_team_id}
    <TeamProfilePreview team_id={$selected_team_id} />
  {/if}

  <EntityCrudWrapper
    bind:this={entity_wrapper}
    entity_type="Team"
    on:selection_changed={handle_selection_changed}
  />
</div>
