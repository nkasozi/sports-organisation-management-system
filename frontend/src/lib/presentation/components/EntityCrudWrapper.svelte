<!--
Main CRUD Wrapper Component
Combines form and list components for complete entity management
Uses explicit handlers instead of events for predictable data flow
-->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { createEventDispatcher } from "svelte";
  import type { BaseEntity } from "../../core/entities/BaseEntity";
  import type {
    EntityCrudHandlers,
    EntityViewCallbacks,
  } from "../../core/types/EntityHandlers";
  import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
  import DynamicEntityForm from "./DynamicEntityForm.svelte";
  import DynamicEntityList from "./DynamicEntityList.svelte";

  export let entity_type: string;
  export let initial_view: "list" | "create" | "edit" = "list";
  export let is_mobile_view: boolean = true;
  export let show_list_actions: boolean = true;

  const dispatch = createEventDispatcher<{
    entity_created: { entity: BaseEntity };
    entity_updated: { entity: BaseEntity };
    entity_deleted: { entity: BaseEntity };
    entities_deleted: { entities: BaseEntity[] };
    view_changed: { current_view: string; entity?: BaseEntity };
    selection_changed: { selected_entities: BaseEntity[] };
  }>();

  let current_view: "list" | "create" | "edit" = initial_view;
  let current_entity_for_editing: BaseEntity | null = null;
  let total_entity_count: number = 0;
  let entity_list_component: DynamicEntityList;

  $: page_title = build_page_title_for_current_view(current_view, entity_type);
  $: show_back_button = current_view !== "list";
  $: normalized_entity_type = normalize_entity_type(entity_type);
  $: crud_handlers = build_crud_handlers_for_entity_type(
    normalized_entity_type,
  );
  $: list_view_callbacks = build_list_view_callbacks();
  $: form_view_callbacks = build_form_view_callbacks();

  function normalize_entity_type(type: string): string {
    if (typeof type !== "string") return "";
    return type.toLowerCase().replace(/\s+/g, "").trim();
  }

  function build_page_title_for_current_view(
    view: string,
    type: string | undefined,
  ): string {
    const safe_type =
      typeof type === "string" && type.length > 0 ? type : "Entity";
    const type_display = safe_type.charAt(0).toUpperCase() + safe_type.slice(1);
    if (view === "create") return `Create New ${type_display}`;
    if (view === "edit") return `Edit ${type_display}`;
    return `${type_display} Management`;
  }

  function build_crud_handlers_for_entity_type(
    normalized_type: string,
  ): EntityCrudHandlers | null {
    const use_cases = get_use_cases_for_entity_type(normalized_type);
    if (!use_cases) {
      console.warn(
        `[EntityCrudWrapper] No use cases found for entity type: ${normalized_type}`,
      );
      return null;
    }

    return {
      create: use_cases.create
        ? async (input: Record<string, unknown>) => use_cases.create(input)
        : undefined,
      update: use_cases.update
        ? async (id: string, input: Record<string, unknown>) =>
            use_cases.update(id, input)
        : undefined,
      delete: use_cases.delete
        ? async (id: string) => use_cases.delete(id)
        : undefined,
      list: use_cases.list
        ? async (
            filter?: Record<string, string>,
            options?: { page_number?: number; page_size?: number },
          ) => use_cases.list(filter, options)
        : undefined,
      get_by_id: use_cases.get_by_id
        ? async (id: string) => use_cases.get_by_id(id)
        : undefined,
    };
  }

  function build_list_view_callbacks(): EntityViewCallbacks {
    return {
      on_create_requested: handle_create_requested,
      on_edit_requested: handle_edit_requested,
      on_delete_completed: handle_entity_deleted,
    };
  }

  function build_form_view_callbacks(): EntityViewCallbacks {
    return {
      on_save_completed: handle_save_completed,
      on_cancel: handle_form_cancelled,
    };
  }

  function handle_create_requested(): void {
    console.debug("[EntityCrudWrapper] Create requested for:", entity_type);

    if (normalized_entity_type === "fixturelineup") {
      goto("/fixture-lineups/create");
      return;
    }

    switch_to_view("create");
  }

  function handle_edit_requested(entity: BaseEntity): void {
    console.debug(
      "[EntityCrudWrapper] Edit requested for:",
      entity_type,
      entity.id,
    );
    switch_to_view("edit", entity);
  }

  function handle_save_completed(entity: BaseEntity, is_new: boolean): void {
    console.debug("[EntityCrudWrapper] Save completed:", {
      entity_type,
      entity_id: entity.id,
      is_new,
    });

    if (is_new) {
      dispatch("entity_created", { entity });
    } else {
      dispatch("entity_updated", { entity });
    }

    switch_to_view("list");
  }

  function handle_form_cancelled(): void {
    console.debug("[EntityCrudWrapper] Form cancelled");
    switch_to_view("list");
  }

  function handle_entity_deleted(entity: BaseEntity): void {
    console.debug("[EntityCrudWrapper] Entity deleted:", entity.id);
    dispatch("entity_deleted", { entity });
  }

  function handle_entities_batch_deleted(entities: BaseEntity[]): void {
    console.debug(
      "[EntityCrudWrapper] Entities batch deleted:",
      entities.length,
    );
    dispatch("entities_deleted", { entities });
  }

  function handle_list_count_updated(count: number): void {
    total_entity_count = count;
  }

  function handle_selection_changed(selected: BaseEntity[]): void {
    dispatch("selection_changed", { selected_entities: selected });
  }

  function switch_to_view(
    new_view: "list" | "create" | "edit",
    entity?: BaseEntity,
  ): void {
    console.debug("[EntityCrudWrapper] Switching view:", {
      from: current_view,
      to: new_view,
      entity_type,
    });

    current_view = new_view;

    if (new_view === "edit" && entity) {
      current_entity_for_editing = entity;
    } else {
      current_entity_for_editing = null;
    }

    dispatch("view_changed", { current_view: new_view, entity });
  }

  function navigate_back_to_list(): void {
    switch_to_view("list");
  }

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

<div class="crud-wrapper w-full">
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
          {crud_handlers}
          view_callbacks={list_view_callbacks}
          on_total_count_changed={handle_list_count_updated}
          on_selection_changed={handle_selection_changed}
          on_entities_batch_deleted={handle_entities_batch_deleted}
        />
      {:else if current_view === "create"}
        <DynamicEntityForm
          {entity_type}
          entity_data={null}
          {is_mobile_view}
          {crud_handlers}
          view_callbacks={form_view_callbacks}
        />
      {:else if current_view === "edit"}
        <DynamicEntityForm
          {entity_type}
          entity_data={current_entity_for_editing}
          {is_mobile_view}
          {crud_handlers}
          view_callbacks={form_view_callbacks}
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

  @media (max-width: 640px) {
    .crud-wrapper {
      padding: 0.5rem;
    }

    .crud-header {
      margin-bottom: 1rem;
    }
  }
</style>
