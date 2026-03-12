<!--
Dynamic Entity List Component
Displays list of entities with CRUD operations
Follows coding rules: mobile-first, stateless helpers, explicit return types
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import type {
    BaseEntity,
    FieldMetadata,
  } from "../../core/entities/BaseEntity";
  import { entityMetadataRegistry } from "../../infrastructure/registry/EntityMetadataRegistry";
  import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import DynamicEntityForm from "./DynamicEntityForm.svelte";
  import {
    get_display_value_for_entity_field,
    extract_items_from_result_data,
    extract_total_count_from_result_data,
    extract_error_message_from_result,
    build_default_visible_column_names,
    check_if_all_entities_selected,
    check_if_some_entities_selected,
    determine_if_bulk_actions_available,
    build_filter_from_sub_entity_config,
    apply_filters_and_sorting,
    toggle_sort_direction,
    toggle_column_in_set,
    build_csv_content,
    build_csv_filename,
    get_selected_entities_from_list,
    clear_filter_state,
    toggle_select_all_entities,
    toggle_single_entity_selection as compute_entity_selection_toggle,
    get_column_responsive_class,
    normalize_entity_type_for_filter,
    build_entity_authorization_filter,
    apply_id_filter_to_entities,
    merge_entity_list_filters,
    type EntityAuthFilterResult,
  } from "../logic/dynamicListLogic";
  import {
    save_column_preferences,
    load_column_preferences,
  } from "../logic/columnPreferences";
  import type {
    EntityCrudHandlers,
    EntityViewCallbacks,
    CrudFunctionality,
  } from "$lib/core/types/EntityHandlers";
  import { is_functionality_disabled } from "$lib/core/types/EntityHandlers";
  import BulkImportModal from "./BulkImportModal.svelte";
  import SearchableSelectField from "./ui/SearchableSelectField.svelte";
  import Pagination from "./ui/Pagination.svelte";
  import {
    build_entity_display_label,
    format_entity_display_name,
  } from "../logic/dynamicFormLogic";
  import { auth_store } from "../stores/auth";
  import { type UserScopeProfile } from "$lib/core/interfaces/ports";
  import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
  import { ensure_auth_profile } from "../logic/authGuard";

  export let entity_type: string;
  export let show_actions: boolean = true;
  export let is_mobile_view: boolean = true;
  export let sub_entity_filter: SubEntityFilter | null = null;
  export let crud_handlers: EntityCrudHandlers | null = null;
  export let view_callbacks: EntityViewCallbacks | null = null;
  export let bulk_create_handler: (() => void) | null = null;
  export let enable_bulk_import: boolean = false;
  export let button_color_class: string = "btn-primary-action";
  export let info_message: string | null = null;
  export let disabled_functionalities: CrudFunctionality[] = [];

  const DEFAULT_PAGE_SIZE = 10;
  const PAGE_SIZE_OPTIONS = [10, 20, 50];

  export let on_total_count_changed: ((count: number) => void) | null = null;
  export let on_selection_changed: ((selected: BaseEntity[]) => void) | null =
    null;
  export let on_entities_batch_deleted:
    | ((entities: BaseEntity[]) => void)
    | null = null;

  $: has_custom_handlers = crud_handlers !== null;
  $: is_sub_entity_mode = sub_entity_filter !== null;
  $: is_create_disabled = is_functionality_disabled(
    "create",
    disabled_functionalities,
  );
  $: is_edit_disabled = is_functionality_disabled(
    "edit",
    disabled_functionalities,
  );
  $: is_delete_disabled = is_functionality_disabled(
    "delete",
    disabled_functionalities,
  );

  let entities: BaseEntity[] = [];
  let filtered_entities: BaseEntity[] = [];
  let current_page: number = 1;
  let items_per_page: number = DEFAULT_PAGE_SIZE;
  let is_loading: boolean = false;
  let error_message: string = "";
  let selected_entity_ids: Set<string> = new Set();
  let show_delete_confirmation: boolean = false;
  let entities_to_delete: BaseEntity[] = [];
  let is_deleting: boolean = false;

  let show_inline_form: boolean = false;
  let inline_form_entity: Partial<BaseEntity> | null = null;

  let show_column_selector: boolean = false;
  let show_export_modal: boolean = false;
  let show_advanced_filter: boolean = false;
  let show_bulk_import_modal: boolean = false;
  let visible_columns: Set<string> = new Set();
  let sort_column: string = "";
  let sort_direction: "asc" | "desc" = "asc";
  let filter_values: Record<string, string> = {};
  let foreign_key_options: Record<string, any[]> = {};
  let auth_profile_missing: boolean = false;
  let columns_restored_from_cache: boolean = false;

  // Computed values
  $: entity_metadata = get_entity_metadata_for_type(entity_type);
  $: display_name =
    typeof entity_metadata?.display_name === "string" &&
    entity_metadata.display_name.length > 0
      ? entity_metadata.display_name
      : format_entity_display_name(entity_type);
  $: all_selected = check_if_all_entities_selected(
    filtered_entities,
    selected_entity_ids,
  );
  $: some_selected = check_if_some_entities_selected(selected_entity_ids);
  $: can_show_bulk_actions = determine_if_bulk_actions_available(
    some_selected,
    show_actions,
  );
  $: filtered_entities = apply_filters_and_sorting(
    entities,
    filter_values,
    sort_column,
    sort_direction,
    entity_metadata,
    foreign_key_options,
  );
  $: {
    filtered_entities;
    current_page = 1;
  }
  $: total_pages = Math.max(
    1,
    Math.ceil(filtered_entities.length / items_per_page),
  );
  $: paginated_entities = filtered_entities.slice(
    (current_page - 1) * items_per_page,
    current_page * items_per_page,
  );
  $: visible_column_list = get_visible_column_list(
    visible_columns,
    entity_metadata,
  );

  onMount(async () => {
    console.log(`[ENTITY_LIST] onMount - entity_type: "${entity_type}"`);
    initialize_default_columns();
    const auth_result = await ensure_auth_profile();
    if (!auth_result.success) {
      auth_profile_missing = true;
      error_message = auth_result.error_message;
      return;
    }
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
          field.foreign_key_entity,
        );
        if (use_cases && typeof use_cases.list === "function") {
          const result = await use_cases.list(undefined, { page_size: 100 });
          if (result.success && result.data) {
            new_options[field.field_name] = extract_items_from_result_data(
              result.data,
            );
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

  function initialize_default_columns(): void {
    if (!entity_metadata) return;

    const all_fields = get_all_available_fields();
    const available_field_names = all_fields.map(
      (f: FieldMetadata) => f.field_name,
    );
    const cached_result = load_column_preferences(
      entity_type,
      sub_entity_filter,
      available_field_names,
    );

    if (cached_result.restored && cached_result.columns) {
      visible_columns = cached_result.columns;
      columns_restored_from_cache = true;
      console.log(
        `[DynamicEntityList] Restored ${cached_result.columns.size} cached column preferences for ${entity_type}`,
      );
      return;
    }

    const default_field_names = build_default_visible_column_names(
      entity_metadata.fields,
      5,
    );
    visible_columns = new Set(default_field_names);
  }

  function get_visible_column_list(
    columns: Set<string>,
    metadata: any,
  ): string[] {
    return Array.from(columns);
  }

  function get_field_metadata_by_name(
    field_name: string,
  ): FieldMetadata | undefined {
    if (!entity_metadata) return undefined;
    return entity_metadata.fields.find(
      (f: FieldMetadata) => f.field_name === field_name,
    );
  }

  function toggle_sort_by_column(column: string): void {
    const result = toggle_sort_direction(sort_column, column, sort_direction);
    sort_column = result.sort_column;
    sort_direction = result.sort_direction;
  }

  function toggle_column_visibility(field_name: string): void {
    visible_columns = toggle_column_in_set(visible_columns, field_name);
    save_column_preferences(entity_type, sub_entity_filter, visible_columns);
  }

  function export_to_csv(): void {
    const csv_content = build_csv_content(
      filtered_entities,
      visible_column_list,
      entity_metadata,
      foreign_key_options,
    );
    const filename = build_csv_filename(entity_type, new Date());
    const blob = new Blob([csv_content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    show_export_modal = false;
  }

  function clear_all_filters(): void {
    const cleared = clear_filter_state();
    filter_values = cleared.filter_values;
    sort_column = cleared.sort_column;
    sort_direction = cleared.sort_direction;
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
        `No metadata found for entity type: ${type} (normalized: ${normalized_type})`,
      );
    }
    return metadata;
  }

  async function load_all_entities_for_display(): Promise<void> {
    console.log(`[ENTITY_LIST] Loading entities for type: "${entity_type}"`);
    is_loading = true;
    error_message = "";

    try {
      const auth_state = get(auth_store);
      const sub_filter = build_filter_from_sub_entity_config(sub_entity_filter);
      const auth_build_result = build_entity_authorization_filter(
        auth_state.current_profile as UserScopeProfile | null,
        entity_metadata,
        entity_type,
      );
      if (auth_build_result.profile_missing) {
        console.error(
          "[DynamicEntityList] No auth profile found after initialization - failing safely",
        );
      }
      auth_profile_missing = auth_build_result.profile_missing;
      console.debug(
        "[DynamicEntityList] Final auth filter:",
        auth_build_result.filter,
      );
      const auth_filter = auth_build_result.filter;

      if (auth_profile_missing) {
        entities = [];
        error_message =
          "Unable to load data: No user profile is set. Please select a user profile to continue.";
        is_loading = false;
        return;
      }
      const normalized_type = entity_type.toLowerCase().replace(/[\s_-]/g, "");
      if (auth_state.current_token) {
        const authorization_check =
          await get_authorization_adapter().check_entity_authorized(
            auth_state.current_token.raw_token,
            normalized_type,
            "read",
          );
        if (!authorization_check.success) return;
        if (!authorization_check.data.is_authorized) {
          entities = [];
          error_message = `Access denied: Your role does not have permission to view ${display_name} data.`;
          console.warn(
            `[DynamicEntityList] READ permission denied for role "${authorization_check.data.role}" on entity "${normalized_type}"`,
          );
          is_loading = false;
          return;
        }
      }

      const filter = merge_entity_list_filters(sub_filter, auth_filter);

      console.debug(
        `[DynamicEntityList] Applied filters for "${entity_type}":`,
        { sub_filter, auth_filter, merged: filter },
      );

      if (crud_handlers?.list) {
        console.debug(
          `[DynamicEntityList] Using custom list handler for "${entity_type}"`,
        );
        const result = await crud_handlers.list(filter, { page_size: 1000 });

        if (result.success && result.data) {
          let loaded_entities = extract_items_from_result_data(result.data);
          loaded_entities = apply_id_filter_to_entities(
            loaded_entities,
            filter,
          );
          entities = loaded_entities;
          console.debug(
            `[DynamicEntityList] ✅ Custom handler loaded ${entities.length} ${entity_type} entities`,
          );
          const total = entities.length;
          on_total_count_changed?.(total);
        } else {
          error_message = extract_error_message_from_result(result);
          console.error(
            `[ENTITY_LIST] ❌ Custom handler failed:`,
            error_message,
          );
        }
        return;
      }

      const use_cases = get_use_cases_for_entity_type(entity_type);
      console.log(
        `[ENTITY_LIST] Use cases for "${entity_type}":`,
        use_cases ? "Found" : "NOT FOUND",
      );

      if (!use_cases) {
        error_message = `No use cases found for entity type: ${entity_type}`;
        console.error(`[ENTITY_LIST] ERROR:`, error_message);
        return;
      }

      if (typeof use_cases.list !== "function") {
        error_message = `Use cases for ${entity_type} must implement the list() method`;
        console.error(
          `[ENTITY_LIST] ERROR:`,
          error_message,
          "Available methods:",
          Object.keys(use_cases),
        );
        return;
      }

      console.log(
        `[ENTITY_LIST] Calling list() for "${entity_type}" with filter:`,
        filter,
      );
      const result = await use_cases.list(filter, { page_size: 1000 });
      console.log(`[ENTITY_LIST] List result for "${entity_type}":`, {
        success: result.success,
        itemCount: result.success
          ? extract_items_from_result_data(result.data).length
          : 0,
        error: result.success
          ? null
          : extract_error_message_from_result(result),
      });

      if (result.success) {
        let loaded_entities = extract_items_from_result_data(result.data);
        loaded_entities = apply_id_filter_to_entities(loaded_entities, filter);
        entities = loaded_entities;
        console.debug(
          `[DynamicEntityList] ✅ Loaded ${entities.length} ${entity_type} entities`,
        );
        const total = entities.length;
        on_total_count_changed?.(total);
      } else {
        error_message = extract_error_message_from_result(result);
        console.error(
          `[ENTITY_LIST] ❌ Failed to load ${entity_type} entities:`,
          error_message,
        );
      }
    } catch (error) {
      error_message = `Error loading ${display_name} list: ${error}`;
      console.error(
        `[ENTITY_LIST] ❌ Exception loading ${entity_type} entities:`,
        error,
      );
    } finally {
      is_loading = false;
      console.log(
        `[ENTITY_LIST] Finished loading "${entity_type}" - is_loading: false`,
      );
    }
  }

  function create_new_entity_with_sub_entity_defaults(): Partial<BaseEntity> {
    const new_entity: Record<string, any> = { id: "" };
    if (sub_entity_filter) {
      new_entity[sub_entity_filter.foreign_key_field] =
        sub_entity_filter.foreign_key_value;
      if (
        sub_entity_filter.holder_type_field &&
        sub_entity_filter.holder_type_value
      ) {
        new_entity[sub_entity_filter.holder_type_field] =
          sub_entity_filter.holder_type_value;
      }
    }
    return new_entity as Partial<BaseEntity>;
  }

  function handle_create_new_entity(): boolean {
    console.debug("[DynamicEntityList] handle_create_new_entity called:", {
      entity_type,
      is_sub_entity_mode,
      has_view_callbacks: view_callbacks !== null,
    });

    if (is_sub_entity_mode) {
      console.debug(
        "[DynamicEntityList] Sub-entity mode - showing inline form",
      );
      inline_form_entity = create_new_entity_with_sub_entity_defaults();
      show_inline_form = true;
      return true;
    }

    if (view_callbacks?.on_create_requested) {
      console.debug("[DynamicEntityList] Calling on_create_requested callback");
      view_callbacks.on_create_requested();
      return true;
    }

    console.warn("[DynamicEntityList] No create handler available");
    return false;
  }

  function handle_edit_entity(entity: BaseEntity): boolean {
    console.debug("[DynamicEntityList] handle_edit_entity called:", {
      entity_type,
      entity_id: entity.id,
      is_sub_entity_mode,
      has_view_callbacks: view_callbacks !== null,
    });

    if (is_sub_entity_mode) {
      console.debug(
        "[DynamicEntityList] Sub-entity mode - showing inline edit form",
      );
      inline_form_entity = { ...entity };
      show_inline_form = true;
      return true;
    }

    if (view_callbacks?.on_edit_requested) {
      console.debug("[DynamicEntityList] Calling on_edit_requested callback");
      view_callbacks.on_edit_requested(entity);
      return true;
    }

    console.warn("[DynamicEntityList] No edit handler available");
    return false;
  }

  function handle_inline_form_cancel(): boolean {
    console.debug("[DynamicEntityList] handle_inline_form_cancel called");
    show_inline_form = false;
    inline_form_entity = null;
    return true;
  }

  async function handle_inline_form_save(
    event: CustomEvent<{ entity: BaseEntity }>,
  ): Promise<boolean> {
    const saved_entity = event.detail?.entity;
    console.debug("[DynamicEntityList] handle_inline_form_save called", {
      saved_entity,
    });

    show_inline_form = false;
    inline_form_entity = null;

    await refresh_entity_list();
    return true;
  }

  function handle_delete_single_entity(entity: BaseEntity): boolean {
    console.debug("[DynamicEntityList] handle_delete_single_entity called:", {
      entity_type,
      entity_id: entity.id,
    });
    entities_to_delete = [entity];
    show_delete_confirmation = true;
    return true;
  }

  function handle_delete_multiple_entities(): boolean {
    const selected_entities = entities.filter((entity) =>
      selected_entity_ids.has(entity.id),
    );
    console.debug(
      "[DynamicEntityList] handle_delete_multiple_entities called:",
      {
        entity_type,
        count: selected_entities.length,
      },
    );
    entities_to_delete = selected_entities;
    show_delete_confirmation = true;
    return true;
  }

  async function confirm_deletion_action(): Promise<void> {
    if (entities_to_delete.length === 0) return;

    is_deleting = true;

    try {
      if (entities_to_delete.length === 1) {
        const entity = entities_to_delete[0];

        if (crud_handlers?.delete) {
          console.debug("[DynamicEntityList] Using custom delete handler");
          const result = await crud_handlers.delete(entity.id);
          if (result.success) {
            entities = entities.filter((e) => e.id !== entity.id);
            selected_entity_ids.delete(entity.id);
            view_callbacks?.on_delete_completed?.(entity);
          } else {
            error_message = result.error || "Failed to delete entity";
          }
          return;
        }

        const use_cases = get_use_cases_for_entity_type(entity_type);
        if (!use_cases) {
          error_message = `No use cases found for entity type: ${entity_type}`;
          return;
        }

        const delete_method = use_cases.delete;
        if (!delete_method) {
          error_message = `No delete method found for entity type: ${entity_type}`;
          return;
        }

        const result = await delete_method(entity.id);
        if (result.success) {
          entities = entities.filter((e) => e.id !== entity.id);
          selected_entity_ids.delete(entity.id);
          view_callbacks?.on_delete_completed?.(entity);
        } else {
          error_message = result.error || "Failed to delete entity";
        }
      } else {
        const ids_to_delete = entities_to_delete.map((e) => e.id);
        const deleted_entities = [...entities_to_delete];

        if (crud_handlers?.delete) {
          console.debug(
            "[DynamicEntityList] Using custom delete handler for batch",
          );
          let all_success = true;
          for (const entity_id of ids_to_delete) {
            const result = await crud_handlers.delete(entity_id);
            if (!result.success) {
              all_success = false;
              error_message =
                result.error || `Failed to delete entity ${entity_id}`;
              break;
            }
          }
          if (all_success) {
            entities = entities.filter((e) => !ids_to_delete.includes(e.id));
            selected_entity_ids.clear();
            on_entities_batch_deleted?.(deleted_entities);
          }
          return;
        }

        const use_cases = get_use_cases_for_entity_type(entity_type);
        if (!use_cases) {
          error_message = `No use cases found for entity type: ${entity_type}`;
          return;
        }

        const use_cases_with_extras = use_cases as typeof use_cases & {
          delete_multiple?: (
            ids: string[],
          ) => Promise<{ success: boolean; error_message?: string }>;
        };
        const delete_multiple_method = use_cases_with_extras.delete_multiple;

        if (delete_multiple_method) {
          const result = await delete_multiple_method(ids_to_delete);
          if (result.success) {
            entities = entities.filter((e) => !ids_to_delete.includes(e.id));
            selected_entity_ids.clear();
            on_entities_batch_deleted?.(deleted_entities);
          } else {
            error_message = result.error_message || "Failed to delete entities";
          }
        } else {
          let all_success = true;
          for (const entity_id of ids_to_delete) {
            const result = await use_cases.delete(entity_id);
            if (!result.success) {
              all_success = false;
              error_message =
                result.error || `Failed to delete entity ${entity_id}`;
              break;
            }
          }
          if (all_success) {
            entities = entities.filter((e) => !ids_to_delete.includes(e.id));
            selected_entity_ids.clear();
            on_entities_batch_deleted?.(deleted_entities);
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
      selected_entity_ids = new Set();
    }
  }

  function cancel_deletion_action(): void {
    show_delete_confirmation = false;
    entities_to_delete = [];
  }

  function toggle_all_entity_selection(): void {
    selected_entity_ids = toggle_select_all_entities(
      filtered_entities,
      all_selected,
    );
    selected_entity_ids = selected_entity_ids;
    dispatch_selection_changed();
  }

  function toggle_single_entity_selection(entity_id: string): void {
    selected_entity_ids = compute_entity_selection_toggle(
      selected_entity_ids,
      entity_id,
    );
    selected_entity_ids = selected_entity_ids;
    dispatch_selection_changed();
  }

  function get_selected_entities_list(): BaseEntity[] {
    return get_selected_entities_from_list(entities, selected_entity_ids);
  }

  function dispatch_selection_changed(): void {
    const selected_entities = get_selected_entities_list();
    on_selection_changed?.(selected_entities);
  }

  function is_field_controlled_by_sub_entity_filter(
    field_name: string,
  ): boolean {
    if (!sub_entity_filter) return false;
    if (field_name === sub_entity_filter.foreign_key_field) return true;
    if (
      sub_entity_filter.holder_type_field &&
      field_name === sub_entity_filter.holder_type_field
    )
      return true;
    return false;
  }

  function get_all_available_fields(): FieldMetadata[] {
    if (!entity_metadata) return [];

    const id_field: FieldMetadata = {
      field_name: "id",
      display_name: "ID",
      field_type: "string",
      is_required: false,
      is_read_only: true,
      show_in_list: false,
    };

    const metadata_fields = entity_metadata.fields.filter(
      (f: FieldMetadata) =>
        (!f.is_read_only ||
          f.field_name === "id" ||
          f.field_name === "status") &&
        !is_field_controlled_by_sub_entity_filter(f.field_name),
    );

    return [id_field, ...metadata_fields];
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
      class="rounded-xl border border-secondary-200 dark:border-secondary-800/50 bg-white dark:bg-accent-900 overflow-hidden mb-4"
    >
      <div class="h-1 bg-secondary-400"></div>
      <div class="p-4">
        <div class="flex items-start gap-3">
          <div
            class="flex-shrink-0 w-9 h-9 rounded-full bg-secondary-50 dark:bg-secondary-900/30 flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-secondary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-accent-800 dark:text-accent-200">
              {error_message}
            </p>
            <button
              type="button"
              class="mt-3 text-sm font-semibold text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 transition-colors flex items-center gap-1.5"
              on:click={refresh_entity_list}
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div
    class={is_mobile_view
      ? "card p-4 sm:p-6 space-y-4 overflow-x-auto"
      : "card p-4 sm:p-6 space-y-6 overflow-x-auto"}
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
          {#if filtered_entities.length > items_per_page}
            &nbsp;· page {current_page} of {total_pages}
          {/if}
        </p>

        {#if columns_restored_from_cache}
          <div
            class="mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <svg
                  class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <p class="text-xs text-blue-800 dark:text-blue-200">
                  Showing your previously saved column selection
                </p>
              </div>
              <button
                type="button"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 p-0.5"
                on:click={() => (columns_restored_from_cache = false)}
                title="Dismiss"
              >
                <svg
                  class="w-3.5 h-3.5"
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
          </div>
        {/if}

        {#if info_message}
          <div
            class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg"
          >
            <div class="flex items-start gap-2">
              <svg
                class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p class="text-xs text-blue-800 dark:text-blue-200">
                {info_message}
              </p>
            </div>
          </div>
        {/if}
      </div>

      <div class="flex flex-wrap gap-2 w-full sm:w-auto">
        <button
          type="button"
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
          type="button"
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
          type="button"
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

        {#if can_show_bulk_actions && !is_delete_disabled}
          <button
            type="button"
            class="btn btn-outline w-auto"
            on:click={handle_delete_multiple_entities}
            disabled={is_deleting}
          >
            Delete ({selected_entity_ids.size})
          </button>
        {/if}

        {#if enable_bulk_import && !is_create_disabled}
          <button
            type="button"
            class="btn w-auto bg-purple-600 hover:bg-purple-700 text-white"
            on:click={() => (show_bulk_import_modal = true)}
          >
            Bulk Import
          </button>
        {/if}

        {#if bulk_create_handler && !is_create_disabled}
          <button
            type="button"
            class="btn w-auto bg-purple-600 hover:bg-purple-700 text-white"
            on:click={bulk_create_handler}
          >
            Bulk Create
          </button>
        {/if}

        {#if show_actions && !is_create_disabled}
          <button
            type="button"
            class="btn {button_color_class} w-auto"
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
            type="button"
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
                  <SearchableSelectField
                    name="filter_{field.field_name}"
                    value={filter_values[field.field_name] ?? ""}
                    options={[
                      { value: "", label: "Any" },
                      ...(foreign_key_options[field.field_name] || []).map(
                        (option) => ({
                          value: option.id,
                          label: build_entity_display_label(option),
                        }),
                      ),
                    ]}
                    placeholder="Any"
                    on:change={(e) =>
                      (filter_values[field.field_name] = e.detail.value)}
                  />
                {:else if field.field_type === "enum" && field.enum_values}
                  <SearchableSelectField
                    name="filter_{field.field_name}"
                    value={filter_values[field.field_name] ?? ""}
                    options={[
                      { value: "", label: "Any" },
                      ...field.enum_values.map((option) => ({
                        value: option,
                        label: option.charAt(0).toUpperCase() + option.slice(1),
                      })),
                    ]}
                    placeholder="Any"
                    on:change={(e) =>
                      (filter_values[field.field_name] = e.detail.value)}
                  />
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
      <div
        class="border-2 border-primary-300 dark:border-primary-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
      >
        <div class="flex justify-between items-center mb-4">
          <h3
            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
          >
            {inline_form_entity.id ? "Edit" : "Add New"}
            {display_name}
          </h3>
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Close form"
            on:click={handle_inline_form_cancel}
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
        <DynamicEntityForm
          {entity_type}
          entity_data={inline_form_entity}
          {is_mobile_view}
          is_inline_mode={true}
          {crud_handlers}
          {sub_entity_filter}
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
          <button
            type="button"
            class="btn btn-outline"
            on:click={clear_all_filters}
          >
            Clear Filters
          </button>
        {:else if show_actions && !is_create_disabled}
          <button
            type="button"
            class="btn {button_color_class}"
            on:click={handle_create_new_entity}
          >
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
                <th
                  class="px-3 py-3 text-left sticky left-0 bg-gray-50 dark:bg-gray-800 z-10"
                >
                  <input
                    type="checkbox"
                    class="w-4 h-4 text-accent-600 dark:text-accent-400 border-gray-300 dark:border-gray-600 rounded focus:ring-accent-500 dark:focus:ring-accent-400"
                    checked={all_selected}
                    on:change={toggle_all_entity_selection}
                  />
                </th>
              {/if}

              {#each visible_column_list as field_name, column_index}
                <th
                  class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 {get_column_responsive_class(
                    column_index,
                  )}"
                  on:click={() => toggle_sort_by_column(field_name)}
                >
                  <div class="flex items-center gap-1">
                    <span>
                      {entity_metadata?.fields.find(
                        (f: { field_name: string; display_name: string }) =>
                          f.field_name === field_name,
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

              {#if show_actions && (!is_edit_disabled || !is_delete_disabled)}
                <th
                  class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-800 z-10"
                >
                  Actions
                </th>
              {/if}
            </tr>
          </thead>

          <tbody
            class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
          >
            {#each paginated_entities as entity}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                {#if show_actions}
                  <td
                    class="px-3 py-4 sticky left-0 bg-white dark:bg-gray-900 z-10"
                  >
                    <input
                      type="checkbox"
                      class="w-4 h-4 text-accent-600 dark:text-accent-400 border-gray-300 dark:border-gray-600 rounded focus:ring-accent-500 dark:focus:ring-accent-400"
                      checked={selected_entity_ids.has(entity.id)}
                      on:change={() =>
                        toggle_single_entity_selection(entity.id)}
                    />
                  </td>
                {/if}

                {#each visible_column_list as field_name, column_index}
                  <td
                    class="px-3 py-4 text-sm text-accent-900 dark:text-accent-100 {get_column_responsive_class(
                      column_index,
                    )}"
                  >
                    <div class="max-w-xs truncate">
                      {get_display_value_for_entity_field(
                        entity,
                        field_name,
                        foreign_key_options,
                        get_field_metadata_by_name(field_name),
                      )}
                    </div>
                  </td>
                {/each}

                {#if show_actions && (!is_edit_disabled || !is_delete_disabled)}
                  <td
                    class="px-3 py-4 text-right text-sm sticky right-0 bg-white dark:bg-gray-900 z-10"
                  >
                    <div class="flex flex-row gap-2 justify-end items-center">
                      {#if !is_edit_disabled}
                        <button
                          type="button"
                          class="btn btn-outline btn-sm"
                          on:click={() => handle_edit_entity(entity)}
                        >
                          Edit
                        </button>
                      {/if}
                      {#if !is_delete_disabled}
                        <button
                          type="button"
                          class="btn btn-outline btn-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          on:click={() => handle_delete_single_entity(entity)}
                        >
                          Delete
                        </button>
                      {/if}
                    </div>
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <Pagination
        {current_page}
        {total_pages}
        total_items={filtered_entities.length}
        {items_per_page}
        page_size_options={PAGE_SIZE_OPTIONS}
        on:page_change={(e) => (current_page = e.detail.page)}
        on:page_size_change={(e) => {
          items_per_page = e.detail.size;
          current_page = 1;
        }}
      />
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
            type="button"
            class="btn {button_color_class}"
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
              <button
                type="button"
                class="btn {button_color_class}"
                on:click={export_to_csv}
              >
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
              <button type="button" class="btn btn-outline" disabled>
                Export JSON
              </button>
            </div>
          </div>
        </div>

        <div
          class="flex justify-end pt-4 border-t border-accent-200 dark:border-accent-700"
        >
          <button
            type="button"
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
            type="button"
            class="btn btn-outline w-full sm:w-auto"
            on:click={cancel_deletion_action}
            disabled={is_deleting}
          >
            Cancel
          </button>
          <button
            type="button"
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

{#if enable_bulk_import}
  <BulkImportModal
    {entity_type}
    is_visible={show_bulk_import_modal}
    on:close={() => {
      show_bulk_import_modal = false;
      load_all_entities_for_display();
    }}
    on:import_complete={() => {
      load_all_entities_for_display();
    }}
  />
{/if}
