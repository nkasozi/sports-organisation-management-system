<script lang="ts">
  import { goto } from "$app/navigation";
  import DynamicEntityList from "$lib/presentation/components/DynamicEntityList.svelte";
  import type { BaseEntity } from "$lib/core/entities/BaseEntity";

  function handle_create_new(): void {
    goto("/competitions/create");
  }

  function handle_edit_entity(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    goto(`/competitions/${event.detail.entity.id}`);
  }
</script>

<svelte:head>
  <title>Competitions - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Competitions
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400">
        Manage tournaments, leagues, and championships
      </p>
    </div>
  </div>

  <DynamicEntityList
    entity_type="Competition"
    show_actions={true}
    is_mobile_view={true}
    on:create_new={handle_create_new}
    on:edit_entity={handle_edit_entity}
  />
</div>
