<script lang="ts">
  import type { BaseEntity } from "../../core/entities/BaseEntity";
  import type {
    CrudFunctionality,
    EntityCrudHandlers,
    EntityViewCallbacks,
  } from "../../core/types/EntityHandlers";
  import DynamicEntityForm from "./DynamicEntityForm.svelte";
  import DynamicEntityList from "./DynamicEntityList.svelte";

  export let current_view: "list" | "create" | "edit" = "list";
  export let entity_type: string;
  export let show_list_actions: boolean = true;
  export let is_mobile_view: boolean = true;
  export let crud_handlers: EntityCrudHandlers | undefined = undefined;
  export let list_view_callbacks: EntityViewCallbacks;
  export let form_view_callbacks: EntityViewCallbacks;
  export let bulk_create_handler: (() => void) | undefined = undefined;
  export let enable_bulk_import: boolean = false;
  export let button_color_class: string = "btn-primary-action";
  export let disabled_functionalities: CrudFunctionality[] = [];
  export let initial_create_data: Record<string, unknown> | undefined = undefined;
  export let current_entity_for_editing: BaseEntity | undefined = undefined;
  export let on_total_count_changed: (count: number) => void = () => {};
  export let on_selection_changed: (selected: BaseEntity[]) => void = () => {};
  export let on_entities_batch_deleted: (
    entities: BaseEntity[],
  ) => void = () => {};
  let entity_list_component: DynamicEntityList | undefined = undefined;

  export function refresh_entity_list(): void {
    entity_list_component?.refresh_entity_list();
  }

  export function get_current_selected_entities(): BaseEntity[] {
    if (!entity_list_component || current_view !== "list") return [];
    return entity_list_component.get_current_selected_entities();
  }

  export function get_selected_entity_count(): number {
    if (!entity_list_component || current_view !== "list") return 0;
    return entity_list_component.get_selected_entity_count();
  }
</script>

<div class="flex justify-center w-full">
  <div class="crud-content w-full max-w-6xl sm:px-6">
    {#if current_view === "list"}
      <DynamicEntityList
        bind:this={entity_list_component}
        {entity_type}
        show_actions={show_list_actions}
        {is_mobile_view}
        {crud_handlers}
        view_callbacks={list_view_callbacks}
        {bulk_create_handler}
        {enable_bulk_import}
        {button_color_class}
        {disabled_functionalities}
        {on_total_count_changed}
        {on_selection_changed}
        {on_entities_batch_deleted}
      />
    {:else if current_view === "create"}
      <DynamicEntityForm
        {entity_type}
        entity_data={initial_create_data}
        {is_mobile_view}
        {crud_handlers}
        sub_entity_filter={void 0}
        view_callbacks={form_view_callbacks}
        {button_color_class}
      />
    {:else if current_view === "edit"}
      <DynamicEntityForm
        {entity_type}
        entity_data={current_entity_for_editing}
        {is_mobile_view}
        {crud_handlers}
        sub_entity_filter={void 0}
        view_callbacks={form_view_callbacks}
        {button_color_class}
      />
    {/if}
  </div>
</div>

<style>
  .crud-content {
    flex: 1;
  }
</style>
