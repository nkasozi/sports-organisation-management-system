<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import { goto } from "$app/navigation";
  import EntityCrudWrapperContent from "$lib/presentation/components/EntityCrudWrapperContent.svelte";
  import EntityCrudWrapperHeader from "$lib/presentation/components/EntityCrudWrapperHeader.svelte";
  import {
    build_crud_handlers_for_entity_type,
    build_form_view_callbacks,
    build_list_view_callbacks,
    build_page_title_for_current_view,
    compute_effective_disabled_functionalities,
    get_disabled_crud_actions_for_profile,
    normalize_entity_type,
  } from "$lib/presentation/logic/entityCrudWrapperLogic";
  import { create_entity_crud_wrapper_runtime } from "$lib/presentation/logic/entityCrudWrapperRuntime";

  import type { BaseEntity } from "../../core/entities/BaseEntity";
  import type { CrudFunctionality } from "../../core/types/EntityHandlers";
  import { auth_store } from "../../presentation/stores/auth";

  export let entity_type: string;
  export let initial_view: "list" | "create" | "edit" = "list";
  export let initial_create_data: Record<string, unknown> | undefined = undefined;
  export let locked_filter: Record<string, unknown> = {};
  export let is_mobile_view: boolean = true;
  export let show_list_actions: boolean = true;
  export let bulk_create_handler: (() => void) | undefined = undefined;
  export let enable_bulk_import: boolean = false;
  export let button_color_class: string = "btn-primary-action";
  export let after_save_redirect_url: string = "";
  export let info_message: string = "";
  export let disabled_functionalities: CrudFunctionality[] = [];
  export let skip_authorization_check: boolean = false;

  const dispatch = createEventDispatcher<{
    entity_created: { entity: BaseEntity };
    entity_updated: { entity: BaseEntity };
    entity_deleted: { entity: BaseEntity };
    entities_deleted: { entities: BaseEntity[] };
    view_changed: { current_view: string; entity?: BaseEntity };
    selection_changed: { selected_entities: BaseEntity[] };
  }>();

  let current_view: "list" | "create" | "edit" = initial_view;
  let current_entity_for_editing: BaseEntity | undefined = undefined;
  let total_entity_count: number = 0;
  let crud_content_component: EntityCrudWrapperContent | undefined = undefined;

  $: page_title = build_page_title_for_current_view(current_view, entity_type);
  $: show_back_button = current_view !== "list";
  $: normalized_entity_type = normalize_entity_type(entity_type);
  $: current_auth_profile = $auth_store.current_profile;
  $: authorization_disabled_actions = skip_authorization_check
    ? []
    : get_disabled_crud_actions_for_profile(
        normalized_entity_type,
        current_auth_profile,
      );
  $: effective_disabled_functionalities =
    compute_effective_disabled_functionalities(
      disabled_functionalities,
      authorization_disabled_actions as CrudFunctionality[],
      normalized_entity_type,
    );
  $: crud_handlers = build_crud_handlers_for_entity_type(
    normalized_entity_type,
    locked_filter,
  );
  const runtime = create_entity_crud_wrapper_runtime({
    after_save_redirect_url,
    dispatch: (event_name: string, detail: Record<string, unknown>) =>
      dispatch(event_name as never, detail as never),
    entity_type,
    get_current_view: () => current_view,
    goto,
    normalized_entity_type,
    set_current_entity_for_editing: (entity: BaseEntity | undefined) =>
      (current_entity_for_editing = entity),
    set_current_view: (view: "list" | "create" | "edit") =>
      (current_view = view),
    set_total_entity_count: (count: number) => (total_entity_count = count),
  });
  $: list_view_callbacks = build_list_view_callbacks(
    effective_disabled_functionalities,
    entity_type,
    {
      handle_create_requested: runtime.handle_create_requested,
      handle_edit_requested: runtime.handle_edit_requested,
      handle_entity_deleted: runtime.handle_entity_deleted,
    },
  );
  $: form_view_callbacks = build_form_view_callbacks({
    handle_save_completed: runtime.handle_save_completed,
    handle_form_cancelled: runtime.handle_form_cancelled,
  });

  export function refresh_entity_data(): void {
    if (crud_content_component && current_view === "list")
      crud_content_component.refresh_entity_list();
  }

  export function get_current_view_info(): {
    view: string;
    entity_count: number;
    editing_entity: BaseEntity | undefined;
  } {
    return {
      view: current_view,
      entity_count: total_entity_count,
      editing_entity: current_entity_for_editing,
    };
  }

  export function get_selected_entities_from_list(): BaseEntity[] {
    if (!crud_content_component || current_view !== "list") return [];
    return crud_content_component.get_current_selected_entities();
  }

  export function get_selected_entity_count(): number {
    if (!crud_content_component || current_view !== "list") return 0;
    return crud_content_component.get_selected_entity_count();
  }
</script>

<div class="crud-wrapper w-full">
  <EntityCrudWrapperHeader
    {show_back_button}
    {page_title}
    {current_view}
    {total_entity_count}
    {info_message}
    on_back={runtime.navigate_back_to_list}
  />
  <EntityCrudWrapperContent
    bind:this={crud_content_component}
    {current_view}
    {entity_type}
    {show_list_actions}
    {is_mobile_view}
    {crud_handlers}
    {list_view_callbacks}
    {form_view_callbacks}
    {bulk_create_handler}
    {enable_bulk_import}
    {button_color_class}
    disabled_functionalities={effective_disabled_functionalities}
    {initial_create_data}
    {current_entity_for_editing}
    on_total_count_changed={runtime.handle_list_count_updated}
    on_selection_changed={runtime.handle_selection_changed}
    on_entities_batch_deleted={runtime.handle_entities_batch_deleted}
  />
</div>

<style>
  .crud-wrapper {
    min-height: 100%;
  }

  @media (max-width: 640px) {
    .crud-wrapper {
      padding: 0.5rem;
    }
  }
</style>
