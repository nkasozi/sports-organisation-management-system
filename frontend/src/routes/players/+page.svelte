<script lang="ts">
  import EntityCrudWrapper from "$lib/presentation/components/EntityCrudWrapper.svelte";
</script>

<svelte:head>
  <title>Players - Sports Management</title>
</svelte:head>

<EntityCrudWrapper entity_type="Player" enable_bulk_import={true} />
