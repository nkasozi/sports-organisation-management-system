<script lang="ts">
  import type {
    BaseEntity,
    EntityMetadata,
    FieldMetadata,
  } from "$lib/core/entities/BaseEntity";
  import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import type { DynamicFormFieldCallbacks } from "$lib/presentation/logic/dynamicFormComponentTypes";
  import type { UserRoleState } from "$lib/presentation/logic/systemUserFormLogic";

  import DynamicFormActions from "./DynamicFormActions.svelte";
  import DynamicFormFieldGrid from "./DynamicFormFieldGrid.svelte";
  import DynamicFormHeader from "./DynamicFormHeader.svelte";
  import DynamicFormSubEntitySections from "./DynamicFormSubEntitySections.svelte";
  import DynamicFormTopBanners from "./DynamicFormTopBanners.svelte";
  import DynamicFormWarningPanels from "./DynamicFormWarningPanels.svelte";

  export let is_mobile_view: boolean = true;
  export let form_title: string = "";
  export let is_loading: boolean = false;
  export let permission_denied: boolean = false;
  export let permission_denied_message: string = "";
  export let save_error_message: string = "";
  export let info_message: string = "";
  export let sorted_fields: FieldMetadata[] = [];
  export let entity_type: string;
  export let form_data: Record<string, any> = {};
  export let validation_errors: Record<string, string> = {};
  export let authorization_restricted_fields: Set<string> = new Set();
  export let is_edit_mode: boolean = false;
  export let sub_entity_filter: SubEntityFilter | undefined = undefined;
  export let foreign_key_options: Record<string, any[]> = {};
  export let filtered_fields_loading: Record<string, boolean> = {};
  export let current_auth_role_state: UserRoleState = { status: "missing" };
  export let callbacks: DynamicFormFieldCallbacks;
  export let sub_entity_fields: FieldMetadata[] = [];
  export let entity_data: Partial<BaseEntity> | undefined = undefined;
  export let build_sub_entity_handlers: (
    child_entity_type: string,
    sub_filter: SubEntityFilter,
  ) => EntityCrudHandlers;
  export let color_clash_warnings: string[] = [];
  export let official_team_conflict_warnings: string[] = [];
  export let gender_mismatch_warnings: string[] = [];
  export let fixture_team_gender_mismatch_warnings: string[] = [];
  export let show_transfer_notice: boolean = false;
  export let should_show_fake_data_button: boolean = false;
  export let is_save_in_progress: boolean = false;
  export let entity_metadata: EntityMetadata;
  export let button_color_class: string = "btn-primary-action";
  export let on_submit: () => Promise<void>;
  export let on_generate_fake_data: () => void;
  export let on_cancel: () => void;
</script>

<div
  class={is_mobile_view
    ? "bg-white dark:bg-accent-800 shadow-sm border-y border-accent-200 dark:border-accent-700 -mx-4 px-4 pt-4 pb-6 space-y-4 sm:mx-0 sm:px-6 sm:border sm:rounded-lg"
    : "card p-4 sm:p-6 space-y-6"}
>
  <DynamicFormHeader {form_title} {is_loading} />
  <DynamicFormTopBanners
    {permission_denied}
    {permission_denied_message}
    {save_error_message}
    {info_message}
  />
  <form
    on:submit|preventDefault={on_submit}
    class={is_mobile_view ? "space-y-4" : "space-y-6"}
  >
    <DynamicFormFieldGrid
      {sorted_fields}
      {entity_type}
      {form_data}
      {validation_errors}
      {authorization_restricted_fields}
      {is_edit_mode}
      {sub_entity_filter}
      {foreign_key_options}
      {filtered_fields_loading}
      {is_loading}
      {current_auth_role_state}
      {callbacks}
    />
    <DynamicFormSubEntitySections
      {sub_entity_fields}
      {is_edit_mode}
      {entity_data}
      {build_sub_entity_handlers}
    />
    <DynamicFormWarningPanels
      {color_clash_warnings}
      {official_team_conflict_warnings}
      {gender_mismatch_warnings}
      {fixture_team_gender_mismatch_warnings}
      {save_error_message}
      {show_transfer_notice}
    />
    <DynamicFormActions
      {should_show_fake_data_button}
      {is_save_in_progress}
      {permission_denied}
      {is_loading}
      {is_edit_mode}
      entity_display_name={entity_metadata.display_name}
      {button_color_class}
      {on_generate_fake_data}
      {on_cancel}
    />
  </form>
</div>
