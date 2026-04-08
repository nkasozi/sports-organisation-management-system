<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  import { browser } from "$app/environment";
  import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
  import {
    get_authorization_preselect_values,
    get_authorization_restricted_fields,
    type UserRole,
    type UserScopeProfile,
  } from "$lib/core/interfaces/ports";
  import type {
    EntityCrudHandlers,
    EntityViewCallbacks,
  } from "$lib/core/types/EntityHandlers";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import {
    get_fixture_use_cases,
    get_official_associated_team_use_cases,
    get_player_team_membership_use_cases,
    get_team_use_cases,
  } from "$lib/infrastructure/registry/useCaseFactories";

  import type {
    BaseEntity,
    EntityMetadata,
  } from "../../core/entities/BaseEntity";
  import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
  import { fakeDataGenerator } from "../../infrastructure/utils/FakeDataGenerator";
  import { create_dynamic_entity_form_controller } from "../logic/dynamicEntityFormControllerFactory";
  import { get_dynamic_form_sorted_fields_for_display } from "../logic/dynamicEntityFormFieldState";
  import {
    build_dynamic_form_initial_data,
    create_sub_entity_crud_handlers,
    get_dynamic_entity_metadata_for_type,
  } from "../logic/dynamicEntityFormInitialization";
  import { run_dynamic_entity_form_permission_check } from "../logic/dynamicEntityFormPermissionCheck";
  import type {
    DynamicEntityFormState,
    DynamicEntityFormUiState,
    DynamicEntityFormWarningState,
  } from "../logic/dynamicEntityFormState";
  import type { DynamicFormFieldCallbacks } from "../logic/dynamicFormComponentTypes";
  import {
    build_form_title,
    determine_if_edit_mode,
    format_entity_display_name,
    get_sub_entity_fields,
  } from "../logic/dynamicFormLogic";
  import { auth_store } from "../stores/auth";
  import DynamicEntityFormContent from "./dynamicForm/DynamicEntityFormContent.svelte";

  export let entity_type: string;
  export let entity_data: Partial<BaseEntity> | null = null;
  export let show_fake_data_button: boolean = true;
  export let is_mobile_view: boolean = true;
  export let is_inline_mode: boolean = false;
  export let crud_handlers: EntityCrudHandlers | null = null;
  export let view_callbacks: EntityViewCallbacks | null = null;
  export let sub_entity_filter: SubEntityFilter | null = null;
  export let button_color_class: string = "btn-primary-action";
  export let info_message: string | null = null;

  const dispatch = createEventDispatcher<{
    inline_save_success: { entity: BaseEntity };
    inline_cancel: void;
  }>();
  const fixture_use_cases = get_fixture_use_cases();
  const team_use_cases = get_team_use_cases();
  const official_associated_team_use_cases = get_official_associated_team_use_cases();
  const official_use_cases_result = get_use_cases_for_entity_type("official");
  const player_use_cases_result = get_use_cases_for_entity_type("player");
  const gender_use_cases_result = get_use_cases_for_entity_type("gender");
  let form_state: DynamicEntityFormState = { form_data: {} as Record<string, any>, validation_errors: {} as Record<string, string>, foreign_key_options: {} as Record<string, BaseEntity[]>, filtered_fields_loading: {} as Record<string, boolean>, all_competition_teams_cache: [] as BaseEntity[] };
  let ui_state: DynamicEntityFormUiState = { is_loading: false, is_save_in_progress: false, auth_profile_missing: false, auth_error_message: "", permission_denied: false, permission_denied_message: "", save_error_message: "" };
  let warning_state: DynamicEntityFormWarningState = { color_clash_warnings: [] as string[], official_team_conflict_warnings: [] as string[], gender_mismatch_warnings: [] as string[], fixture_team_gender_mismatch_warnings: [] as string[] };

  $: current_auth_profile = $auth_store.current_profile;
  $: entity_metadata = get_dynamic_entity_metadata_for_type(entity_type);
  $: is_edit_mode = determine_if_edit_mode(entity_data);
  $: form_title = build_form_title(
    entity_metadata?.display_name || format_entity_display_name(entity_type),
    is_edit_mode,
  );
  $: sub_entity_fields = get_sub_entity_fields(entity_metadata);
  $: authorization_restricted_fields = get_authorization_restricted_fields(
    current_auth_profile as UserScopeProfile | null,
  );
  $: sorted_fields = entity_metadata
    ? get_dynamic_form_sorted_fields_for_display(
        entity_metadata.fields,
        is_edit_mode,
        form_state.form_data,
        sub_entity_filter,
      )
    : [];
  $: can_show_fake_data_button =
    show_fake_data_button &&
    !is_edit_mode &&
    !$is_signed_in &&
    fakeDataGenerator.is_fake_data_generation_enabled();
  $: show_transfer_notice =
    entity_type.toLowerCase() === "playerteamtransferhistory" && !is_edit_mode;
  $: if (entity_metadata && current_auth_profile) {
    const form_data = build_dynamic_form_initial_data(entity_metadata, entity_data, get_authorization_preselect_values(current_auth_profile as UserScopeProfile | null), entity_type);
    form_state = { ...form_state, form_data, validation_errors: {} };
    if (browser) void controller.initialize_options(form_data);
  }

  onMount(async () => {
    ui_state = {
      ...ui_state,
      ...(await run_dynamic_entity_form_permission_check(
        entity_type,
        is_edit_mode,
        entity_metadata?.display_name || entity_type,
      )),
    };
  });

  const controller = create_dynamic_entity_form_controller({
    entity_type,
    crud_handlers,
    is_inline_mode,
    player_team_membership_use_cases: get_player_team_membership_use_cases(),
    get_entity_metadata: () => entity_metadata,
    get_is_edit_mode: () => is_edit_mode,
    get_entity_data: () => entity_data,
    get_form_state: () => form_state,
    set_form_state: (next_state: DynamicEntityFormState) =>
      (form_state = next_state),
    get_ui_state: () => ui_state,
    set_ui_state: (next_state: DynamicEntityFormUiState) =>
      (ui_state = next_state),
    get_warning_state: () => warning_state,
    set_warning_state: (next_state: DynamicEntityFormWarningState) =>
      (warning_state = next_state),
    on_inline_save_success: (entity: BaseEntity) =>
      dispatch("inline_save_success", { entity }),
    on_save_completed: (entity: BaseEntity, was_new_entity: boolean) =>
      view_callbacks?.on_save_completed?.(entity, was_new_entity),
    on_inline_cancel: () => dispatch("inline_cancel"),
    on_cancel: () => view_callbacks?.on_cancel?.(),
    conflict_dependencies: {
      fixture_use_cases,
      team_use_cases,
      official_use_cases: official_use_cases_result.success
        ? official_use_cases_result.data
        : null,
      official_associated_team_use_cases,
    },
    gender_dependencies: {
      team_use_cases,
      player_use_cases_result,
      gender_use_cases_result,
    },
  });
  const callbacks: DynamicFormFieldCallbacks = controller.callbacks;
</script>

<div class="w-full">
  <DynamicEntityFormContent
    {ui_state}
    entity_metadata={entity_metadata as EntityMetadata | null}
    {entity_type}
    {is_mobile_view}
    {form_title}
    {info_message}
    {sorted_fields}
    form_data={form_state.form_data}
    validation_errors={form_state.validation_errors}
    {authorization_restricted_fields}
    {is_edit_mode}
    {sub_entity_filter}
    foreign_key_options={form_state.foreign_key_options}
    filtered_fields_loading={form_state.filtered_fields_loading}
    current_auth_role={(current_auth_profile?.role as UserRole | null) ?? null}
    {callbacks}
    {sub_entity_fields}
    {entity_data}
    build_sub_entity_handlers={create_sub_entity_crud_handlers}
    {warning_state}
    {show_transfer_notice}
    should_show_fake_data_button={can_show_fake_data_button}
    {button_color_class}
    on_submit={controller.handle_submit}
    on_generate_fake_data={controller.handle_generate_fake_data}
    on_cancel={controller.handle_cancel}
  />
</div>
