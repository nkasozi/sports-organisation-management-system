<script lang="ts">
  import type { BaseEntity } from "$lib/core/entities/BaseEntity";
  import type {
    CrudFunctionality,
    EntityCrudHandlers,
    EntityViewCallbacks,
  } from "$lib/core/types/EntityHandlers";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";

  import DynamicEntityListController from "./DynamicEntityListController.svelte";

  export let bulk_create_handler: (() => void) | undefined = void 0;
  export let button_color_class = "btn-primary-action";
  export let crud_handlers: EntityCrudHandlers | undefined = void 0;
  export let disabled_functionalities: CrudFunctionality[] = [];
  export let enable_bulk_import = false;
  export let entity_type: string;
  export let info_message = "";
  export let is_mobile_view = true;
  export let on_entities_batch_deleted:
    | ((entities: BaseEntity[]) => void)
    | undefined = void 0;
  export let on_selection_changed:
    | ((selected: BaseEntity[]) => void)
    | undefined = void 0;
  export let on_total_count_changed: ((count: number) => void) | undefined =
    void 0;
  export let show_actions = true;
  export let sub_entity_filter: SubEntityFilter | undefined = void 0;
  export let view_callbacks: EntityViewCallbacks | undefined = void 0;

  let controller_component: DynamicEntityListController | undefined = undefined;

  export function get_current_selected_entities(): BaseEntity[] {
    return controller_component?.get_current_selected_entities() ?? [];
  }

  export function clear_all_selections(): void {
    controller_component?.clear_all_selections();
  }

  export function get_selected_entity_count(): number {
    return controller_component?.get_selected_entity_count() ?? 0;
  }
</script>

<DynamicEntityListController
  bind:this={controller_component}
  {bulk_create_handler}
  {button_color_class}
  {crud_handlers}
  {disabled_functionalities}
  {enable_bulk_import}
  {entity_type}
  {info_message}
  {is_mobile_view}
  {on_entities_batch_deleted}
  {on_selection_changed}
  {on_total_count_changed}
  {show_actions}
  {sub_entity_filter}
  {view_callbacks}
/>
