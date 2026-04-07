<script lang="ts">
  import type {
    BaseEntity,
    EntityMetadata,
    FieldMetadata,
  } from "$lib/core/entities/BaseEntity";
  import type { UserRole } from "$lib/core/interfaces/ports";
  import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import type { DynamicFormFieldCallbacks } from "$lib/presentation/logic/dynamicFormComponentTypes";

  import DynamicFormLayout from "./DynamicFormLayout.svelte";
  import DynamicFormTopState from "./DynamicFormTopState.svelte";

  export let ui_state: {
    auth_profile_missing: boolean;
    auth_error_message: string;
    is_loading: boolean;
    permission_denied: boolean;
    permission_denied_message: string;
    save_error_message: string;
    is_save_in_progress: boolean;
  };
  export let entity_metadata: EntityMetadata | null = null;
  export let entity_type: string;
  export let is_mobile_view: boolean = true;
  export let form_title: string = "";
  export let info_message: string | null = null;
  export let sorted_fields: FieldMetadata[] = [];
  export let form_data: Record<string, any> = {};
  export let validation_errors: Record<string, string> = {};
  export let authorization_restricted_fields: Set<string> = new Set();
  export let is_edit_mode: boolean = false;
  export let sub_entity_filter: SubEntityFilter | null = null;
  export let foreign_key_options: Record<string, any[]> = {};
  export let filtered_fields_loading: Record<string, boolean> = {};
  export let current_auth_role: UserRole | null = null;
  export let callbacks: DynamicFormFieldCallbacks;
  export let sub_entity_fields: FieldMetadata[] = [];
  export let entity_data: Partial<BaseEntity> | null = null;
  export let build_sub_entity_handlers: (
    child_entity_type: string,
    sub_filter: SubEntityFilter,
  ) => EntityCrudHandlers;
  export let warning_state: {
    color_clash_warnings: string[];
    official_team_conflict_warnings: string[];
    gender_mismatch_warnings: string[];
    fixture_team_gender_mismatch_warnings: string[];
  };
  export let show_transfer_notice: boolean = false;
  export let should_show_fake_data_button: boolean = false;
  export let button_color_class: string = "btn-primary-action";
  export let on_submit: () => Promise<void>;
  export let on_generate_fake_data: () => void;
  export let on_cancel: () => void;
</script>

{#if ui_state.auth_profile_missing || !entity_metadata}
  <DynamicFormTopState
    auth_profile_missing={ui_state.auth_profile_missing}
    auth_error_message={ui_state.auth_error_message}
    has_entity_metadata={!!entity_metadata}
    {entity_type}
  />
{:else}
  <DynamicFormLayout
    {is_mobile_view}
    {form_title}
    is_loading={ui_state.is_loading}
    permission_denied={ui_state.permission_denied}
    permission_denied_message={ui_state.permission_denied_message}
    save_error_message={ui_state.save_error_message}
    {info_message}
    {sorted_fields}
    {entity_type}
    {form_data}
    {validation_errors}
    {authorization_restricted_fields}
    {is_edit_mode}
    {sub_entity_filter}
    {foreign_key_options}
    {filtered_fields_loading}
    {current_auth_role}
    {callbacks}
    {sub_entity_fields}
    {entity_data}
    {build_sub_entity_handlers}
    color_clash_warnings={warning_state.color_clash_warnings}
    official_team_conflict_warnings={warning_state.official_team_conflict_warnings}
    gender_mismatch_warnings={warning_state.gender_mismatch_warnings}
    fixture_team_gender_mismatch_warnings={warning_state.fixture_team_gender_mismatch_warnings}
    {show_transfer_notice}
    {should_show_fake_data_button}
    is_save_in_progress={ui_state.is_save_in_progress}
    {entity_metadata}
    {button_color_class}
    {on_submit}
    {on_generate_fake_data}
    {on_cancel}
  />
{/if}
