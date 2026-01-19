<!--
Main CRUD Wrapper Component
Combines form and list components for complete entity management
Follows coding rules: stateless helpers, explicit return types, mobile-first
-->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { createEventDispatcher } from "svelte";
  import type { BaseEntity } from "../../core/entities/BaseEntity";
  import DynamicEntityForm from "./DynamicEntityForm.svelte";
  import DynamicEntityList from "./DynamicEntityList.svelte";

  // Component props
  export let entity_type: string;
  export let initial_view: "list" | "create" | "edit" = "list";
  export let is_mobile_view: boolean = true;
  export let show_list_actions: boolean = true;

  // Event dispatcher for parent communication
  const dispatch = createEventDispatcher<{
    entity_created: { entity: BaseEntity };
    entity_updated: { entity: BaseEntity };
    entity_deleted: { entity: BaseEntity };
    entities_deleted: { entities: BaseEntity[] };
    view_changed: { current_view: string; entity?: BaseEntity };
    selection_changed: { selected_entities: BaseEntity[] };
  }>();

  // Component state
  let current_view: "list" | "create" | "edit" = initial_view;
  let current_entity_for_editing: BaseEntity | null = null;
  let total_entity_count: number = 0;

  // References to child components for refresh
  let entity_list_component: DynamicEntityList;

  // Computed values
  $: page_title = build_page_title_for_current_view(current_view, entity_type);
  $: show_back_button = determine_if_back_button_needed(current_view);

  function build_page_title_for_current_view(
    view: string,
    type: string | undefined
  ): string {
    const safe_type =
      typeof type === "string" && type.length > 0 ? type : "Entity";
    const type_display = safe_type.charAt(0).toUpperCase() + safe_type.slice(1);
    if (view === "create") return `Create New ${type_display}`;
    if (view === "edit") return `Edit ${type_display}`;
    return `${type_display} Management`;
  }

  function determine_if_back_button_needed(view: string): boolean {
    return view !== "list";
  }

  function switch_to_view(
    new_view: "list" | "create" | "edit",
    entity?: BaseEntity
  ): void {
    current_view = new_view;

    if (new_view === "edit" && entity) {
      current_entity_for_editing = entity;
    } else {
      current_entity_for_editing = null;
    }

    dispatch("view_changed", { current_view: new_view, entity });
  }

  function handle_create_new_request(): void {
    console.debug("[DEBUG] handle_create_new_request called");
    const normalized_entity_type = normalize_entity_type(entity_type);
    if (normalized_entity_type === "fixturelineup") {
      goto("/fixture-lineups/create");
      return;
    }
    switch_to_view("create");
  }

  function normalize_entity_type(type: string): string {
    if (typeof type !== "string") return "";
    return type.toLowerCase().replace(/\s+/g, "").trim();
  }

  function handle_edit_entity_request(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    console.debug("[DEBUG] handle_edit_entity_request called", {
      entity: event.detail.entity,
    });
    switch_to_view("edit", event.detail.entity);
  }

  function handle_entity_save_success(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    const saved_entity = event.detail.entity;

    if (current_view === "create") {
      dispatch("entity_created", { entity: saved_entity });
    } else if (current_view === "edit") {
      dispatch("entity_updated", { entity: saved_entity });
    }

    // Refresh the list and return to list view
    if (entity_list_component) {
      entity_list_component.refresh_entity_list();
    }
    switch_to_view("list");
  }

  function handle_entity_save_error(
    event: CustomEvent<{
      error_message: string;
      validation_errors?: Record<string, string>;
    }>
  ): void {
    console.error(
      `Entity save failed: ${event.detail.error_message}`,
      event.detail.validation_errors
    );
    // Form component will handle displaying the error to user
  }

  function handle_form_cancel(): void {
    switch_to_view("list");
  }

  function handle_single_entity_deletion(
    event: CustomEvent<{ entity: BaseEntity }>
  ): void {
    console.debug("[DEBUG] handle_single_entity_deletion called", {
      entity: event.detail.entity,
    });
    dispatch("entity_deleted", { entity: event.detail.entity });
  }

  function handle_multiple_entities_deletion(
    event: CustomEvent<{ entities: BaseEntity[] }>
  ): void {
    console.debug("[DEBUG] handle_multiple_entities_deletion called", {
      entities: event.detail.entities,
    });
    dispatch("entities_deleted", { entities: event.detail.entities });
  }

  function handle_list_refresh_completed(
    event: CustomEvent<{ total_count: number }>
  ): void {
    total_entity_count = event.detail.total_count;
  }

  function handle_entity_selection_changed(
    event: CustomEvent<{ selected_entities: BaseEntity[] }>
  ): void {
    dispatch("selection_changed", {
      selected_entities: event.detail.selected_entities,
    });
  }

  function navigate_back_to_list(): void {
    switch_to_view("list");
  }

  // Public API for parent components
  export function refresh_entity_data(): void {
    if (entity_list_component && current_view === "list") {
      entity_list_component.refresh_entity_list();
    }
  }

  export function get_current_view_info(): {
    view: string;
    entity_count: number;
    editing_entity: BaseEntity | null;
  } {
    return {
      view: current_view,
      entity_count: total_entity_count,
      editing_entity: current_entity_for_editing,
    };
  }

  export function get_selected_entities_from_list(): BaseEntity[] {
    if (entity_list_component && current_view === "list") {
      return entity_list_component.get_current_selected_entities();
    }
    return [];
  }

  export function get_selected_entity_count(): number {
    if (entity_list_component && current_view === "list") {
      return entity_list_component.get_selected_entity_count();
    }
    return 0;
  }
</script>

<!-- Main CRUD container with mobile-first responsive design -->
<div class="crud-wrapper w-full">
  <!-- Header section with navigation and title -->
  <div class="flex justify-center w-full">
    <div class="crud-header mb-4 sm:mb-6 w-full max-w-6xl px-4 sm:px-6">
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          {#if show_back_button}
            <button
              class="btn btn-outline"
              on:click={navigate_back_to_list}
              aria-label="Back to list"
            >
              ← Back
            </button>
          {/if}

          <div>
            <h1
              class="text-xl sm:text-2xl font-bold text-accent-900 dark:text-accent-100"
            >
              {page_title}
            </h1>
            {#if current_view === "list" && total_entity_count > 0}
              <p class="text-sm text-accent-600 dark:text-accent-400">
                {total_entity_count}
                {total_entity_count === 1 ? "item" : "items"} total
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="flex justify-center w-full">
    <div class="crud-content w-full max-w-6xl px-4 sm:px-6">
      {#if current_view === "list"}
        <DynamicEntityList
          bind:this={entity_list_component}
          {entity_type}
          show_actions={show_list_actions}
          {is_mobile_view}
          on:create_new={handle_create_new_request}
          on:edit_entity={handle_edit_entity_request}
          on:delete_single={handle_single_entity_deletion}
          on:delete_multiple={handle_multiple_entities_deletion}
          on:refresh_completed={handle_list_refresh_completed}
          on:selection_changed={handle_entity_selection_changed}
        />
      {:else if current_view === "create"}
        <DynamicEntityForm
          {entity_type}
          entity_data={null}
          {is_mobile_view}
          on:save_success={handle_entity_save_success}
          on:save_error={handle_entity_save_error}
          on:cancel={handle_form_cancel}
        />
      {:else if current_view === "edit"}
        <DynamicEntityForm
          {entity_type}
          entity_data={current_entity_for_editing}
          {is_mobile_view}
          on:save_success={handle_entity_save_success}
          on:save_error={handle_entity_save_error}
          on:cancel={handle_form_cancel}
        />
      {/if}
    </div>
  </div>
</div>

<style>
  .crud-wrapper {
    min-height: 100%;
  }

  .crud-header {
    border-bottom: 1px solid rgb(229 231 235 / 1);
    padding-bottom: 1rem;
  }

  :global(.dark) .crud-header {
    border-bottom-color: rgb(75 85 99 / 1);
  }

  .crud-content {
    flex: 1;
  }

  /* Mobile-first responsive adjustments */
  @media (max-width: 640px) {
    .crud-wrapper {
      padding: 0.5rem;
    }

    .crud-header {
      margin-bottom: 1rem;
    }
  }
</style>
