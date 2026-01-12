<script lang="ts">
  import { goto } from "$app/navigation";
  import DynamicEntityList from "$lib/components/DynamicEntityList.svelte";
  import type { BaseEntity } from "$lib/core/BaseEntity";

  function handle_create_new(): void {
    goto("/sports/create");
  }

  function handle_edit_entity(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    goto(`/sports/${event.detail.entity.id}`);
  }
</script>

<svelte:head>
  <title>Sports - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Sports
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400">
        Manage sports, rules, and regulations
      </p>
    </div>
  </div>

  <DynamicEntityList
    entity_type="Sport"
    show_actions={true}
    is_mobile_view={true}
    on:create_new={handle_create_new}
    on:edit_entity={handle_edit_entity}
  />
</div>
