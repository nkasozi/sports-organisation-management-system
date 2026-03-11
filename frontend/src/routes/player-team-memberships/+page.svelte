<script lang="ts">
  import { goto } from "$app/navigation";
  import EntityCrudWrapper from "$lib/presentation/components/EntityCrudWrapper.svelte";

  function handle_bulk_create(): void {
    goto("/player-team-memberships/bulk-assign");
  }
</script>

<svelte:head>
  <title>Player Team Memberships - Sports Management</title>
</svelte:head>

<EntityCrudWrapper
  entity_type="PlayerTeamMembership"
  bulk_create_handler={handle_bulk_create}
/>
