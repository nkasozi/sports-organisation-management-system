<script lang="ts">
  import EntityCrudWrapper from "$lib/presentation/components/EntityCrudWrapper.svelte";
  import { auth_store } from "$lib/presentation/stores/auth";

  function handle_system_user_changed(): void {
    auth_store.refresh_profiles();
  }
</script>

<svelte:head>
  <title>System Users - Sports Management</title>
</svelte:head>

<EntityCrudWrapper
  entity_type="systemuser"
  on:entity_created={handle_system_user_changed}
  on:entity_updated={handle_system_user_changed}
  on:entity_deleted={handle_system_user_changed}
  on:entities_deleted={handle_system_user_changed}
/>
