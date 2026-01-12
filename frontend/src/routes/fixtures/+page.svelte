<script lang="ts">
  import { goto } from "$app/navigation";
  import DynamicEntityList from "$lib/components/DynamicEntityList.svelte";

  function handle_create_new(): boolean {
    goto("/fixtures/create");
    return true;
  }

  function handle_edit_entity(
    event: CustomEvent<{ entity_id: string }>
  ): boolean {
    goto(`/fixtures/${event.detail.entity_id}`);
    return true;
  }
</script>

<svelte:head>
  <title>Fixtures - Sports Management</title>
</svelte:head>

<DynamicEntityList
  entity_type="fixture"
  on:create-new={handle_create_new}
  on:edit-entity={handle_edit_entity}
/>
