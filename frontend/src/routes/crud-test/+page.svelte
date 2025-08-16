<script lang="ts">
  import EntityCrudWrapper from "$lib/components/EntityCrudWrapper.svelte";
  import type { BaseEntity } from "$lib/core/BaseEntity";

  // Component state
  let selected_entity_type: string = "organization";
  let is_mobile_view: boolean = true;

  // Available entity types for testing
  const entity_types = [
    { value: "organization", label: "Organizations" },
    { value: "competition", label: "Competitions" },
    { value: "competition_constraint", label: "Competition Constraints" },
    { value: "team", label: "Teams" },
    { value: "player", label: "Players" },
    { value: "official", label: "Officials" },
    { value: "game", label: "Games" },
  ];

  function handle_entity_created(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    console.log(`Entity created: ${event.detail.entity.id}`);
  }

  function handle_entity_updated(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    console.log(`Entity updated: ${event.detail.entity.id}`);
  }

  function handle_entity_deleted(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    console.log(`Entity deleted: ${event.detail.entity.id}`);
  }

  function handle_entities_deleted(
    event: CustomEvent<{ entities: BaseEntity[] }>
  ): void {
    console.log(
      `Multiple entities deleted: ${event.detail.entities.length} items`
    );
  }
</script>

<svelte:head>
  <title>CRUD Test - Sports Management</title>
</svelte:head>

<div
  class="crud-test-page min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1
        class="text-2xl sm:text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2"
      >
        Generalized CRUD System Test
      </h1>
      <p class="text-accent-600 dark:text-accent-400 max-w-2xl mx-auto">
        Test the dynamic entity management system with any entity type. The form
        and list components automatically adapt based on entity metadata.
      </p>
    </div>

    <!-- Entity Type Selector -->
    <div class="card p-6 mb-6">
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <label for="entity_type_select" class="label font-semibold"
          >Select Entity Type:</label
        >
        <select
          id="entity_type_select"
          class="input max-w-sm"
          bind:value={selected_entity_type}
        >
          {#each entity_types as entity_type}
            <option value={entity_type.value}>{entity_type.label}</option>
          {/each}
        </select>

        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            id="mobile_view"
            class="w-4 h-4 text-accent-600 dark:text-accent-400 border-gray-300 dark:border-gray-600 rounded focus:ring-accent-500 dark:focus:ring-accent-400"
            bind:checked={is_mobile_view}
          />
          <label
            for="mobile_view"
            class="text-sm text-accent-700 dark:text-accent-300"
          >
            Mobile View
          </label>
        </div>
      </div>
    </div>

    <!-- Dynamic CRUD Wrapper -->
    <EntityCrudWrapper
      entity_type={selected_entity_type}
      initial_view="list"
      {is_mobile_view}
      show_list_actions={true}
      on:entity_created={handle_entity_created}
      on:entity_updated={handle_entity_updated}
      on:entity_deleted={handle_entity_deleted}
      on:entities_deleted={handle_entities_deleted}
    />
  </div>
</div>

<style>
  .crud-test-page {
    min-height: 100vh;
  }

  /* Mobile-first responsive adjustments */
  @media (max-width: 640px) {
    .crud-test-page {
      padding: 1rem 0;
    }
  }
</style>
