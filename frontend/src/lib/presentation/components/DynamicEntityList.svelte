<!--
Dynamic Entity List Component
Displays list of entities with CRUD operations
Follows coding rules: mobile-first, stateless helpers, explicit return types
-->
<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type {
    BaseEntity,
    EntityListResult,
    FieldMetadata,
  } from "../../core/entities/BaseEntity";
  import { entityMetadataRegistry } from "../../infrastructure/registry/EntityMetadataRegistry";
  import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import DynamicEntityForm from "./DynamicEntityForm.svelte";
  import { get_display_value_for_entity_field } from "../logic/dynamicListLogic";

  // Component props
  export let entity_type: string;
  export let show_actions: boolean = true;
  export let is_mobile_view: boolean = true;
  export let sub_entity_filter: SubEntityFilter | null = null;
  export const compact_mode: boolean = false;

  // Computed - is this a sub-entity list that should handle CRUD inline?
  $: is_sub_entity_mode = sub_entity_filter !== null;

  // Event dispatcher for parent communication
  const dispatch = createEventDispatcher<{
    edit_entity: { entity: BaseEntity };
    create_new: { entity_id?: undefined };
    delete_single: { entity: BaseEntity };
    delete_multiple: { entities: BaseEntity[] };
    refresh_completed: { total_count: number };
    selection_changed: { selected_entities: BaseEntity[] };
  }>();

  // Component state
  let entities: BaseEntity[] = [];
  let filtered_entities: BaseEntity[] = [];
  let is_loading: boolean = false;
  let error_message: string = "";
  let selected_entity_ids: Set<string> = new Set();
  let show_delete_confirmation: boolean = false;
  let entities_to_delete: BaseEntity[] = [];
  let is_deleting: boolean = false;

  // Inline form state for sub-entity mode
  let show_inline_form: boolean = false;
  let inline_form_entity: Partial<BaseEntity> | null = null;

  let show_column_selector: boolean = false;
  let show_export_modal: boolean = false;
  let show_advanced_filter: boolean = false;
  let visible_columns: Set<string> = new Set();
  let sort_column: string = "";
  let sort_direction: "asc" | "desc" = "asc";
  let filter_values: Record<string, string> = {};
  let foreign_key_options: Record<string, any[]> = {};

  // Computed values
  $: entity_metadata = get_entity_metadata_for_type(entity_type);
  $: display_name =
    typeof entity_metadata?.display_name === "string" &&
    entity_metadata.display_name.length > 0
      ? entity_metadata.display_name
      : typeof entity_type === "string" && entity_type.length > 0
        ? entity_type
        : "Entity";
  $: all_selected = check_if_all_entities_selected(
    filtered_entities,
    selected_entity_ids
  );
  $: some_selected = check_if_some_entities_selected(selected_entity_ids);
  $: can_show_bulk_actions = determine_if_bulk_actions_available(
    some_selected,
    show_actions
  );
  $: filtered_entities = apply_filters_and_sorting(
    entities,
    filter_values,
    sort_column,
    sort_direction
  );
  $: visible_column_list = get_visible_column_list(
    visible_columns,
    entity_metadata
  );

  function extract_items_from_result_data(
    data: BaseEntity[] | { items: BaseEntity[]; total_count: number }
  ): BaseEntity[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === "object" && "items" in data) {
      return data.items;
    }
    return [];
  }

  function extract_total_count_from_result_data(
    data: BaseEntity[] | { items: BaseEntity[]; total_count: number }
  ): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (data && typeof data === "object" && "total_count" in data) {
      return data.total_count;
    }
    return 0;
  }

  function extract_error_message_from_result(
    result: { success: boolean; error?: string; error_message?: string }
  ): string {
    if (!result.success) {
      if ("error_message" in result && result.error_message) {
        return result.error_message;
      }
      if ("error" in result && result.error) {
        return result.error;
      }
    }
    return "Unknown error";
  }

  // Load entities when component mounts
  onMount(async () => {
    console.log(`[ENTITY_LIST] onMount - entity_type: "${entity_type}"`);
    initialize_default_columns();
    load_all_entities_for_display();
    await load_foreign_key_options_for_filters();
  });

  async function load_foreign_key_options_for_filters(): Promise<void> {
    if (!entity_metadata) return;
    const fields = get_all_available_fields();
    const new_options: Record<string, any[]> = {};
    for (const field of fields) {
      if (field.field_type === "foreign_key" && field.foreign_key_entity) {
        const use_cases = get_use_cases_for_entity_type(
          field.foreign_key_entity
        );
        if (use_cases && typeof use_cases.list === "function") {
          const result = await use_cases.list(undefined, { page_size: 100 });
          if (result.success && result.data) {
            new_options[field.field_name] = extract_items_from_result_data(result.data);
          } else {
            new_options[field.field_name] = [];
          }
        } else {
          new_options[field.field_name] = [];
        }
      }
    }
    foreign_key_options = new_options;
  }

  function build_default_visible_column_names(
    fields: FieldMetadata[],
    max_columns: number
  ): string[] {
    const displayable_fields = fields.filter(
      (f: FieldMetadata) => f.field_type !== "sub_entity"
    );
    const explicitly_enabled_fields = displayable_fields.filter(
      (f: FieldMetadata) => f.show_in_list === true
    );
    const preferred_fields =
      explicitly_enabled_fields.length > 0 ? explicitly_enabled_fields : displayable_fields;
    return preferred_fields
      .slice(0, Math.max(0, max_columns))
      .map((f: FieldMetadata) => f.field_name);
  }

  function initialize_default_columns(): void {
    if (!entity_metadata) return;
    const default_field_names = build_default_visible_column_names(
      entity_metadata.fields,
      5
    );
    visible_columns = new Set(default_field_names);
  }

  function get_visible_column_list(
    columns: Set<string>,
    metadata: any
  ): string[] {
    return Array.from(columns);
  }

  function apply_filters_and_sorting(
    entity_list: BaseEntity[],
    filters: Record<string, string>,
    sort_col: string,
    sort_dir: "asc" | "desc"
  ): BaseEntity[] {
    let result = [...entity_list];

    const active_filters = Object.entries(filters).filter(
      ([_, value]) => value.trim() !== ""
    );

    if (active_filters.length > 0) {
      result = result.filter((entity) => {
        return active_filters.every(([field, filter_value]) => {
          const field_meta = entity_metadata?.fields.find(
            (f: { field_name: string }) => f.field_name === field
          );
          if (
            field_meta &&
            field_meta.field_type === "foreign_key" &&
            field_meta.foreign_key_entity
          ) {
            if (!filter_value) return true;
            const raw_value = (entity as unknown as Record<string, unknown>)[
              field
            ];
            return String(raw_value ?? "") === filter_value;
          } else {
            const entity_value = get_display_value_for_entity_field(
              entity,
              field,
              foreign_key_options
            ).toLowerCase();
            return entity_value.includes(filter_value.toLowerCase());
          }
        });
      });
    }

    if (sort_col) {
      result.sort((a, b) => {
        const a_value = get_display_value_for_entity_field(a, sort_col, foreign_key_options);
        const b_value = get_display_value_for_entity_field(b, sort_col, foreign_key_options);

        const comparison = a_value.localeCompare(b_value, undefined, {
          numeric: true,
        });
        return sort_dir === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }

  function toggle_sort_by_column(column: string): void {
    if (sort_column === column) {
      sort_direction = sort_direction === "asc" ? "desc" : "asc";
    } else {
      sort_column = column;
      sort_direction = "asc";
    }
  }

  function toggle_column_visibility(field_name: string): void {
    if (visible_columns.has(field_name)) {
      visible_columns.delete(field_name);
    } else {
      visible_columns.add(field_name);
    }
    visible_columns = visible_columns;
  }

  function export_to_csv(): void {
    const headers = visible_column_list.map((field_name) => {
      return (
        entity_metadata?.fields.find(
          (f: { field_name: string; display_name: string }) =>
            f.field_name === field_name
        )?.display_name || field_name
      );
    });

    const csv_rows = [headers.join(",")];

    filtered_entities.forEach((entity) => {
      const row = visible_column_list.map((field_name) => {
        const value = get_display_value_for_entity_field(entity, field_name, foreign_key_options);
        return `"${value.replace(/"/g, '""')}"`;
      });
      csv_rows.push(row.join(","));
    });

    const csv_content = csv_rows.join("\n");
    const blob = new Blob([csv_content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${entity_type}_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    show_export_modal = false;
  }

  function clear_all_filters(): void {
    filter_values = {};
    sort_column = "";
    sort_direction = "asc";
  }

  function get_entity_metadata_for_type(type: string): any {
    if (typeof type !== "string" || type.length === 0) {
      console.error(`Invalid or missing entity type:`, type);
      return null;
    }
    const normalized_type = type.toLowerCase();
    const metadata =
      entityMetadataRegistry.get_entity_metadata(normalized_type);
    if (!metadata) {
      console.error(
        `No metadata found for entity type: ${type} (normalized: ${normalized_type})`
      );
    }
    return metadata;
  }

  function check_if_all_entities_selected(
    entity_list: BaseEntity[],
    selected_ids: Set<string>
  ): boolean {
    if (entity_list.length === 0) return false;
    return entity_list.every((entity) => selected_ids.has(entity.id));
  }

  function check_if_some_entities_selected(selected_ids: Set<string>): boolean {
    return selected_ids.size > 0;
  }

  function determine_if_bulk_actions_available(
    has_selection: boolean,
    actions_enabled: boolean
  ): boolean {
    return has_selection && actions_enabled;
  }

  function build_filter_from_sub_entity_config(
    filter_config: SubEntityFilter | null
  ): Record<string, string> | undefined {
    if (!filter_config) return undefined;

    const filter: Record<string, string> = {};
    filter[filter_config.foreign_key_field] = filter_config.foreign_key_value;

    if (filter_config.holder_type_field && filter_config.holder_type_value) {
      filter[filter_config.holder_type_field] = filter_config.holder_type_value;
    }

    return filter;
  }

  async function load_all_entities_for_display(): Promise<void> {
    console.log(`[ENTITY_LIST] Loading entities for type: "${entity_type}"`);
    is_loading = true;
    error_message = "";

    try {
      const use_cases = get_use_cases_for_entity_type(entity_type);
      console.log(`[ENTITY_LIST] Use cases for "${entity_type}":`, use_cases ? "Found" : "NOT FOUND");

      if (!use_cases) {
        error_message = `No use cases found for entity type: ${entity_type}`;
        console.error(`[ENTITY_LIST] ERROR:`, error_message);
        return;
      }

      if (typeof use_cases.list !== "function") {
        error_message = `Use cases for ${entity_type} must implement the list() method`;
        console.error(
          `[ENTITY_LIST] ERROR:`, error_message,
          "Available methods:",
          Object.keys(use_cases)
        );
        return;
      }

      const filter = build_filter_from_sub_entity_config(sub_entity_filter);
      console.log(`[ENTITY_LIST] Calling list() for "${entity_type}" with filter:`, filter);
      const result = await use_cases.list(filter, { page_size: 1000 });
      console.log(`[ENTITY_LIST] List result for "${entity_type}":`, {
        success: result.success,
        itemCount: result.success ? extract_items_from_result_data(result.data).length : 0,
        error: result.success ? null : extract_error_message_from_result(result)
      });

      if (result.success) {
        entities = extract_items_from_result_data(result.data);
        console.log(`[ENTITY_LIST] ✅ Loaded ${entities.length} ${entity_type} entities`, entities);
        const total = extract_total_count_from_result_data(result.data);
        dispatch("refresh_completed", { total_count: total });
      } else {
        error_message = extract_error_message_from_result(result);
        console.error(
          `[ENTITY_LIST] ❌ Failed to load ${entity_type} entities:`,
          error_message
        );
      }
    } catch (error) {
      error_message = `Error loading ${display_name} list: ${error}`;
      console.error(`[ENTITY_LIST] ❌ Exception loading ${entity_type} entities:`, error);
    } finally {
      is_loading = false;
      console.log(`[ENTITY_LIST] Finished loading "${entity_type}" - is_loading: false`);
    }
  }

  function create_new_entity_with_sub_entity_defaults(): Partial<BaseEntity> {
    const new_entity: Record<string, any> = { id: "" };
    if (sub_entity_filter) {
      new_entity[sub_entity_filter.foreign_key_field] = sub_entity_filter.foreign_key_value;
      if (sub_entity_filter.holder_type_field && sub_entity_filter.holder_type_value) {
        new_entity[sub_entity_filter.holder_type_field] = sub_entity_filter.holder_type_value;
      }
    }
    return new_entity as Partial<BaseEntity>;
  }

  function handle_create_new_entity(): boolean {
    console.debug(
      "[DEBUG] handle_create_new_entity called for entity_type:",
      entity_type
    );

    if (is_sub_entity_mode) {
      console.debug("[DEBUG] Sub-entity mode - showing inline form");
      inline_form_entity = create_new_entity_with_sub_entity_defaults();
      show_inline_form = true;
      return true;
    }

    console.debug("[DEBUG] handle_create_new_entity event dispatched", {
      event_type: "create_new",
      entity_type,
    });
    dispatch("create_new", { entity_id: undefined });
    return true;
  }

  function handle_edit_entity(entity: BaseEntity): boolean {
    console.debug(
      "[DEBUG] handle_edit_entity called for entity_type:",
      entity_type,
      "entity:",
      entity
    );

    if (is_sub_entity_mode) {
      console.debug("[DEBUG] Sub-entity mode - showing inline edit form");
      inline_form_entity = { ...entity };
      show_inline_form = true;
      return true;
    }

    console.debug("[DEBUG] handle_edit_entity event dispatched", {
      event_type: "edit_entity",
      entity_type,
      entity_id: entity.id,
      entity,
    });
    dispatch("edit_entity", { entity });
    return true;
  }

  function handle_inline_form_cancel(): boolean {
    console.debug("[DEBUG] handle_inline_form_cancel called");
    show_inline_form = false;
    inline_form_entity = null;
    return true;
  }

  async function handle_inline_form_save(event: CustomEvent<{ entity: BaseEntity }>): Promise<boolean> {
    const saved_entity = event.detail?.entity;
    console.debug("[DEBUG] handle_inline_form_save called", { saved_entity });

    show_inline_form = false;
    inline_form_entity = null;

    await refresh_entity_list();
    return true;
  }

  function handle_delete_single_entity(entity: BaseEntity): boolean {
    console.debug(
      "[DEBUG] handle_delete_single_entity called for entity_type:",
      entity_type,
      "entity:",
      entity
    );
    console.debug("[DEBUG] handle_delete_single_entity event dispatched", {
      event_type: "delete_single",
      entity_type,
      entity_id: entity.id,
    });
    entities_to_delete = [entity];
    show_delete_confirmation = true;
    return true;
  }

  function handle_delete_multiple_entities(): boolean {
    const selected_entities = entities.filter((entity) =>
      selected_entity_ids.has(entity.id)
    );
    console.debug(
      "[DEBUG] handle_delete_multiple_entities called for entity_type:",
      entity_type,
      "selected_entities:",
      selected_entities
    );
    console.debug("[DEBUG] handle_delete_multiple_entities event dispatched", {
      event_type: "delete_multiple",
      entity_type,
      entity_ids: selected_entities.map((e) => e.id),
    });
    entities_to_delete = selected_entities;
    show_delete_confirmation = true;
    return true;
  }

  async function confirm_deletion_action(): Promise<void> {
    if (entities_to_delete.length === 0) return;

    is_deleting = true;

    try {
      const use_cases = get_use_cases_for_entity_type(entity_type);

      if (!use_cases) {
        error_message = `No use cases found for entity type: ${entity_type}`;
        return;
      }

      if (entities_to_delete.length === 1) {
        const entity = entities_to_delete[0];
        const delete_method = use_cases.delete;

        if (!delete_method) {
          error_message = `No delete method found for entity type: ${entity_type}`;
          return;
        }

        const result = await delete_method(entity.id);

        if (result.success) {
          entities = entities.filter((e) => e.id !== entity.id);
          selected_entity_ids.delete(entity.id);
          dispatch("delete_single", { entity });
        } else {
          error_message = result.error_message || "Failed to delete entity";
        }
      } else {
        const ids_to_delete = entities_to_delete.map((e) => e.id);
        const use_cases_with_extras = use_cases as typeof use_cases & {
          delete_multiple?: (ids: string[]) => Promise<{ success: boolean; error_message?: string }>;
        };
        const delete_multiple_method = use_cases_with_extras.delete_multiple;

        if (delete_multiple_method) {
          const result = await delete_multiple_method(ids_to_delete);
          if (result.success) {
            entities = entities.filter((e) => !ids_to_delete.includes(e.id));
            selected_entity_ids.clear();
            dispatch("delete_multiple", { entities: entities_to_delete });
          } else {
            error_message = result.error_message || "Failed to delete entities";
          }
        } else {
          let all_success = true;
          for (const entity_id of ids_to_delete) {
            const result = await use_cases.delete(entity_id);
            if (!result.success) {
              all_success = false;
              error_message = result.error_message || `Failed to delete entity ${entity_id}`;
              break;
            }
          }
          if (all_success) {
            entities = entities.filter((e) => !ids_to_delete.includes(e.id));
            selected_entity_ids.clear();
            dispatch("delete_multiple", { entities: entities_to_delete });
          }
        }
      }
    } catch (error) {
      error_message = `Error deleting ${display_name}: ${error}`;
      console.error(`Error deleting ${entity_type} entities:`, error);
    } finally {
      is_deleting = false;
      show_delete_confirmation = false;
      entities_to_delete = [];
      selected_entity_ids = new Set(); // Clear selection
    }
  }

  function cancel_deletion_action(): void {
    show_delete_confirmation = false;
    entities_to_delete = [];
  }

  function toggle_all_entity_selection(): void {
    if (all_selected) {
      selected_entity_ids.clear();
    } else {
      selected_entity_ids = new Set(entities.map((entity) => entity.id));
    }
    selected_entity_ids = selected_entity_ids; // Trigger reactivity
    dispatch_selection_changed();
  }

  function toggle_single_entity_selection(entity_id: string): void {
    if (selected_entity_ids.has(entity_id)) {
      selected_entity_ids.delete(entity_id);
    } else {
      selected_entity_ids.add(entity_id);
    }
    selected_entity_ids = selected_entity_ids; // Trigger reactivity
    dispatch_selection_changed();
  }

  function get_selected_entities_list(): BaseEntity[] {
    return entities.filter((entity) => selected_entity_ids.has(entity.id));
  }

  function dispatch_selection_changed(): void {
    const selected_entities = get_selected_entities_list();
    dispatch("selection_changed", { selected_entities });
  }

  function get_all_available_fields(): FieldMetadata[] {
    if (!entity_metadata) return [];
    return entity_metadata.fields.filter(
      (f: FieldMetadata) =>
        !f.is_read_only || f.field_name === "id" || f.field_name === "status"
    );
  }

  function build_full_name_from_entity(entity: any): string {
    const first_name = entity.first_name;
    const last_name = entity.last_name;
    if (typeof first_name === "string" || typeof last_name === "string") {
      return [first_name, last_name]
        .filter((part) => typeof part === "string" && part.trim().length > 0)
        .join(" ")
        .trim();
    }
    return "";
  }

  function refresh_entity_list(): void {
    load_all_entities_for_display();
  }

  // Public API for parent components
  export function get_current_selected_entities(): BaseEntity[] {
    return get_selected_entities_list();
  }

  export function clear_all_selections(): void {
    selected_entity_ids.clear();
    selected_entity_ids = selected_entity_ids; // Trigger reactivity
    dispatch_selection_changed();
  }

  export function get_selected_entity_count(): number {
    return selected_entity_ids.size;
  }
</script>

<div class="w-full">
  {#if error_message}
    <div
      class="alert bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 p-4 rounded-lg mb-4"
    >
      <p>{error_message}</p>
      <button class="btn btn-outline mt-2" on:click={refresh_entity_list}>
        Retry
      </button>
    </div>
  {/if}

  <div
    class={is_mobile_view
      ? "card p-4 sm:p-6 space-y-4"
      : "card p-4 sm:p-6 space-y-6"}
  >
    <!-- Header with title and actions -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4"
    >
      <div>
        <h2
          class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100"
        >
          {display_name} List
        </h2>
        <p class="text-sm text-accent-600 dark:text-accent-400">
          {filtered_entities.length} of {entities.length}
          {entities.length === 1 ? "item" : "items"}
        </p>
      </div>

      <div class="flex flex-wrap gap-2 w-full sm:w-auto">
        <button
          class="btn btn-outline w-auto"
          on:click={() => (show_advanced_filter = !show_advanced_filter)}
          title="Advanced Filter"
        >
          <svg
            class="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter
        </button>

        <button
          class="btn btn-outline w-auto"
          on:click={() => (show_column_selector = !show_column_selector)}
          title="Manage Columns"
        >
          <svg
            class="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          Columns
        </button>

        <button
          class="btn btn-outline w-auto"
          on:click={() => (show_export_modal = true)}
          title="Export Data"
        >
          <svg
            class="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export
        </button>

        {#if can_show_bulk_actions}
          <button
            class="btn btn-outline w-auto"
            on:click={handle_delete_multiple_entities}
            disabled={is_deleting}
          >
            Delete ({selected_entity_ids.size})
          </button>
        {/if}

        {#if show_actions}
          <button
            class="btn btn-secondary w-auto"
            on:click={handle_create_new_entity}
          >
            Create New
          </button>
        {/if}
      </div>
    </div>

    {#if show_advanced_filter}
      <div
        class="border border-accent-200 dark:border-accent-700 rounded-lg p-4 space-y-3"
      >
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-medium text-accent-900 dark:text-accent-100">
            Advanced Filters
          </h3>
          <button
            class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            on:click={clear_all_filters}
          >
            Clear All
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each get_all_available_fields() as field}
            {#if field.field_type !== "file"}
              <div>
                <label
                  class="block text-xs font-medium text-accent-700 dark:text-accent-300 mb-1"
                  for="filter_{field.field_name}"
                >
                  {field.display_name}
                </label>
                {#if field.field_type === "foreign_key" && field.foreign_key_entity}
                  <select
                    id="filter_{field.field_name}"
                    class="w-full px-3 py-2 text-sm border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100"
                    bind:value={filter_values[field.field_name]}
                  >
                    <option value="">Any</option>
                    {#each foreign_key_options[field.field_name] || [] as option}
                      <option value={option.id}
                        >{option.name ||
                          option.display_name ||
                          option.id}</option
                      >
                    {/each}
                  </select>
                {:else if field.field_type === "enum" && field.enum_values}
                  <select
                    id="filter_{field.field_name}"
                    class="w-full px-3 py-2 text-sm border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100"
                    bind:value={filter_values[field.field_name]}
                  >
                    <option value="">Any</option>
                    {#each field.enum_values as option}
                      <option value={option}>{option}</option>
                    {/each}
                  </select>
                {:else if field.field_type === "date"}
                  <input
                    id="filter_{field.field_name}"
                    type="date"
                    class="w-full px-3 py-2 text-sm border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100"
                    bind:value={filter_values[field.field_name]}
                  />
                {:else}
                  <input
                    id="filter_{field.field_name}"
                    type="text"
                    class="w-full px-3 py-2 text-sm border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100"
                    placeholder={typeof field.display_name === "string" &&
                    field.display_name.length > 0
                      ? `Filter by ${field.display_name.toLowerCase()}`
                      : "Filter by field"}
                    bind:value={filter_values[field.field_name]}
                  />
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <!-- Inline Form for Sub-Entity Create/Edit -->
    {#if show_inline_form && inline_form_entity && is_sub_entity_mode}
      <div class="border-2 border-primary-300 dark:border-primary-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
            {inline_form_entity.id ? "Edit" : "Add New"} {display_name}
          </h3>
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Close form"
            on:click={handle_inline_form_cancel}
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <DynamicEntityForm
          {entity_type}
          entity_data={inline_form_entity}
          {is_mobile_view}
          is_inline_mode={true}
          on:inline_save_success={handle_inline_form_save}
          on:inline_cancel={handle_inline_form_cancel}
        />
      </div>
    {/if}

    <!-- Loading state -->
    {#if is_loading}
      <div class="flex justify-center items-center py-8">
        <div class="text-accent-600 dark:text-accent-400">
          <p>Loading {display_name} list...</p>
        </div>
      </div>

      <!-- Empty state -->
    {:else if filtered_entities.length === 0}
      <div class="text-center py-8 space-y-4">
        <p class="text-accent-600 dark:text-accent-400">
          {entities.length === 0
            ? typeof display_name === "string" && display_name.length > 0
              ? `No ${display_name.toLowerCase()} found.`
              : "No items found."
            : "No items match your filters."}
        </p>
        {#if entities.length > 0}
          <button class="btn btn-outline" on:click={clear_all_filters}>
            Clear Filters
          </button>
        {:else if show_actions}
          <button class="btn btn-secondary" on:click={handle_create_new_entity}>
            Create First {display_name}
          </button>
        {/if}
      </div>

      <!-- Entity list -->
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              {#if show_actions}
                <th class="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    class="w-4 h-4 text-accent-600 dark:text-accent-400 border-gray-300 dark:border-gray-600 rounded focus:ring-accent-500 dark:focus:ring-accent-400"
                    checked={all_selected}
                    on:change={toggle_all_entity_selection}
                  />
                </th>
              {/if}

              {#each visible_column_list as field_name}
                <th
                  class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  on:click={() => toggle_sort_by_column(field_name)}
                >
                  <div class="flex items-center gap-1">
                    <span>
                      {entity_metadata?.fields.find(
                        (f: { field_name: string; display_name: string }) =>
                          f.field_name === field_name
                      )?.display_name || field_name}
                    </span>
                    {#if sort_column === field_name}
                      <svg
                        class="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {#if sort_direction === "asc"}
                          <path
                            fill-rule="evenodd"
                            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                            clip-rule="evenodd"
                          />
                        {:else}
                          <path
                            fill-rule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          />
                        {/if}
                      </svg>
                    {/if}
                  </div>
                </th>
              {/each}

              {#if show_actions}
                <th
                  class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              {/if}
            </tr>
          </thead>

          <tbody
            class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
          >
            {#each filtered_entities as entity}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                {#if show_actions}
                  <td class="px-3 py-4">
                    <input
                      type="checkbox"
                      class="w-4 h-4 text-accent-600 dark:text-accent-400 border-gray-300 dark:border-gray-600 rounded focus:ring-accent-500 dark:focus:ring-accent-400"
                      checked={selected_entity_ids.has(entity.id)}
                      on:change={() =>
                        toggle_single_entity_selection(entity.id)}
                    />
                  </td>
                {/if}

                {#each visible_column_list as field_name}
                  <td
                    class="px-3 py-4 text-sm text-accent-900 dark:text-accent-100"
                  >
                    <div class="max-w-xs truncate">
                      {get_display_value_for_entity_field(entity, field_name, foreign_key_options)}
                    </div>
                  </td>
                {/each}

                {#if show_actions}
                  <td class="px-3 py-4 text-right text-sm">
                    <div
                      class="flex flex-row gap-2 justify-end items-center flex-wrap sm:flex-nowrap"
                    >
                      <button
                        class="btn btn-outline btn-sm"
                        on:click={() => handle_edit_entity(entity)}
                      >
                        Edit
                      </button>
                      <button
                        class="btn btn-outline btn-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        on:click={() => handle_delete_single_entity(entity)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Column Selector Modal -->
  {#if show_column_selector}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="column-selector-title"
      tabindex="-1"
      on:click={() => (show_column_selector = false)}
      on:keydown={(e) => e.key === "Escape" && (show_column_selector = false)}
    >
      <div
        class="card p-6 max-w-md w-full space-y-4"
        role="presentation"
        on:click|stopPropagation
        on:keydown|stopPropagation
      >
        <div class="flex justify-between items-center">
          <h3
            id="column-selector-title"
            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
          >
            Manage Columns
          </h3>
          <button
            type="button"
            class="text-accent-500 hover:text-accent-700"
            aria-label="Close column selector"
            on:click={() => (show_column_selector = false)}
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p class="text-sm text-accent-600 dark:text-accent-400">
          Select which columns to display in the table
        </p>

        <div class="max-h-96 overflow-y-auto space-y-2">
          {#each get_all_available_fields() as field}
            <label
              class="flex items-center p-2 hover:bg-accent-50 dark:hover:bg-accent-700 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                checked={visible_columns.has(field.field_name)}
                on:change={() => toggle_column_visibility(field.field_name)}
              />
              <span class="ml-3 text-sm text-accent-900 dark:text-accent-100">
                {field.display_name}
              </span>
            </label>
          {/each}
        </div>

        <div
          class="flex justify-end pt-4 border-t border-accent-200 dark:border-accent-700"
        >
          <button
            class="btn btn-secondary"
            on:click={() => (show_column_selector = false)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Export Modal -->
  {#if show_export_modal}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      tabindex="-1"
      on:click={() => (show_export_modal = false)}
      on:keydown={(e) => e.key === "Escape" && (show_export_modal = false)}
    >
      <div
        class="card p-6 max-w-md w-full space-y-4"
        role="presentation"
        on:click|stopPropagation
        on:keydown|stopPropagation
      >
        <div class="flex justify-between items-center">
          <h3
            id="export-modal-title"
            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
          >
            Export Data
          </h3>
          <button
            type="button"
            class="text-accent-500 hover:text-accent-700"
            aria-label="Close export modal"
            on:click={() => (show_export_modal = false)}
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p class="text-sm text-accent-600 dark:text-accent-400">
          Export {filtered_entities.length}
          {filtered_entities.length === 1 ? "item" : "items"} with {visible_columns.size}
          visible columns
        </p>

        <div class="space-y-3">
          <div
            class="p-4 border border-accent-200 dark:border-accent-700 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-accent-900 dark:text-accent-100">
                  CSV Format
                </h4>
                <p class="text-xs text-accent-600 dark:text-accent-400 mt-1">
                  Comma-separated values, compatible with Excel
                </p>
              </div>
              <button class="btn btn-secondary" on:click={export_to_csv}>
                Export CSV
              </button>
            </div>
          </div>

          <div
            class="p-4 border border-accent-200 dark:border-accent-700 rounded-lg opacity-50"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-accent-900 dark:text-accent-100">
                  JSON Format
                </h4>
                <p class="text-xs text-accent-600 dark:text-accent-400 mt-1">
                  Coming soon
                </p>
              </div>
              <button class="btn btn-outline" disabled> Export JSON </button>
            </div>
          </div>
        </div>

        <div
          class="flex justify-end pt-4 border-t border-accent-200 dark:border-accent-700"
        >
          <button
            class="btn btn-outline"
            on:click={() => (show_export_modal = false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete confirmation modal -->
  {#if show_delete_confirmation}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="card p-6 max-w-md w-full space-y-4">
        <h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
          Confirm Deletion
        </h3>

        <p class="text-accent-700 dark:text-accent-300">
          Are you sure you want to delete {entities_to_delete.length === 1
            ? "this"
            : "these"}
          {entities_to_delete.length}
          {display_name.toLowerCase()}{entities_to_delete.length === 1
            ? ""
            : "s"}? This action cannot be undone.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            class="btn btn-outline w-full sm:w-auto"
            on:click={cancel_deletion_action}
            disabled={is_deleting}
          >
            Cancel
          </button>
          <button
            class="btn bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            on:click={confirm_deletion_action}
            disabled={is_deleting}
          >
            {#if is_deleting}
              Deleting...
            {:else}
              Delete {entities_to_delete.length === 1
                ? display_name
                : `${entities_to_delete.length} Items`}
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
