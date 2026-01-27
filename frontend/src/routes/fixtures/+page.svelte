<script lang="ts">
  import EntityCrudWrapper from "$lib/presentation/components/EntityCrudWrapper.svelte";
</script>

<svelte:head>
  <title>Fixtures - Sports Management</title>
</svelte:head>

<EntityCrudWrapper entity_type="Fixture" enable_bulk_import={true} />
