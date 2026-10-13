<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    import { browser } from "$app/environment";
    import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
    import type {
        EntityCrudHandlers,
        EntityViewCallbacks,
    } from "$lib/core/types/EntityHandlers";
    import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";

    import type { BaseEntity } from "../../core/entities/BaseEntity";
    import { fakeDataGenerator } from "../../infrastructure/utils/FakeDataGenerator";
    import {
        build_dynamic_entity_form_auth_derivations,
        build_dynamic_entity_form_initialization_key,
        build_dynamic_entity_form_sorted_fields,
    } from "../logic/dynamicEntityFormComponentDerivations";
    import {
        build_dynamic_entity_form_external_dependencies,
        create_initial_dynamic_entity_form_state,
        create_initial_dynamic_entity_form_ui_state,
        create_initial_dynamic_entity_form_warning_state,
    } from "../logic/dynamicEntityFormComponentSetup";
    import { create_dynamic_entity_form_controller } from "../logic/dynamicEntityFormControllerFactory";
    import {
        build_dynamic_entity_form_display_flags,
        build_dynamic_entity_form_title,
    } from "../logic/dynamicEntityFormDisplayFlags";
    import {
        build_dynamic_form_initial_data,
        create_sub_entity_crud_handlers,
    } from "../logic/dynamicEntityFormInitialization";
    import {
        build_dynamic_entity_form_metadata_props,
        find_dynamic_entity_form_metadata,
    } from "../logic/dynamicEntityFormMetadata";
    import { run_dynamic_entity_form_permission_check } from "../logic/dynamicEntityFormPermissionCheck";
    import type {
        DynamicEntityFormState,
        DynamicEntityFormUiState,
        DynamicEntityFormWarningState,
    } from "../logic/dynamicEntityFormState";
    import {
        determine_if_edit_mode,
        get_sub_entity_fields,
    } from "../logic/dynamicFormLogic";
    import { auth_store } from "../stores/auth";
    import DynamicEntityFormContent from "./dynamicForm/DynamicEntityFormContent.svelte";

    export let entity_type: string;
    export let entity_data: Partial<BaseEntity> | undefined = void 0;
    export let show_fake_data_button: boolean = true;
    export let is_mobile_view: boolean = true;
    export let is_inline_mode: boolean = false;
    export let crud_handlers: EntityCrudHandlers | undefined = void 0;
    export let view_callbacks: EntityViewCallbacks | undefined = void 0;
    export let sub_entity_filter: SubEntityFilter | undefined = void 0;
    export let button_color_class: string = "btn-primary-action";
    export let info_message: string = "";

    const dispatch = createEventDispatcher<{
        inline_save_success: { entity: BaseEntity };
        inline_cancel: void;
    }>();
    const external_dependencies =
        build_dynamic_entity_form_external_dependencies();
    let form_state: DynamicEntityFormState =
        create_initial_dynamic_entity_form_state();
    let ui_state: DynamicEntityFormUiState =
        create_initial_dynamic_entity_form_ui_state();
    let warning_state: DynamicEntityFormWarningState =
        create_initial_dynamic_entity_form_warning_state();
    let applied_initialization_key = "";

    $: auth_derivations = build_dynamic_entity_form_auth_derivations(
        $auth_store.current_profile,
    );
    $: metadata_option = find_dynamic_entity_form_metadata(entity_type);
    $: ({ entity_metadata } =
        build_dynamic_entity_form_metadata_props(metadata_option));
    $: is_edit_mode = determine_if_edit_mode(entity_data);
    $: form_title = build_dynamic_entity_form_title(
        entity_type,
        entity_metadata,
        is_edit_mode,
    );
    $: sub_entity_fields = get_sub_entity_fields(entity_metadata);
    $: authorization_preselect_values = auth_derivations.preselect_values;
    $: sorted_fields = build_dynamic_entity_form_sorted_fields(
        entity_metadata,
        is_edit_mode,
        form_state.form_data,
        sub_entity_filter,
    );
    $: display_flags = build_dynamic_entity_form_display_flags({
        entity_type,
        is_edit_mode,
        show_fake_data_button,
        is_signed_in: $is_signed_in,
        is_fake_data_generation_enabled:
            fakeDataGenerator.is_fake_data_generation_enabled(),
    });
    $: initialization_key = build_dynamic_entity_form_initialization_key(
        entity_type,
        entity_metadata,
        entity_data,
        authorization_preselect_values,
    );
    $: if (
        entity_metadata &&
        initialization_key !== applied_initialization_key
    ) {
        const form_data = build_dynamic_form_initial_data(
            entity_metadata,
            entity_data as never,
            authorization_preselect_values,
            entity_type,
        );
        applied_initialization_key = initialization_key;
        form_state = { ...form_state, form_data, validation_errors: {} };
        start_option_initialization(form_data);
    }

    function start_option_initialization(
        form_data: Record<string, unknown>,
    ): boolean {
        if (browser) void controller.initialize_options(form_data);
        return browser;
    }

    onMount(async () => {
        const permission_state = await run_dynamic_entity_form_permission_check(
            entity_type,
            is_edit_mode,
            entity_metadata?.display_name || entity_type,
        );
        ui_state = { ...ui_state, ...permission_state };
    });

    const controller = create_dynamic_entity_form_controller({
        entity_type,
        crud_handlers,
        is_inline_mode,
        ...external_dependencies,
        get_entity_metadata: () => entity_metadata,
        get_locked_field_names: () => auth_derivations.restricted_fields,
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
    });
</script>

<div class="w-full">
    <DynamicEntityFormContent
        {ui_state}
        {metadata_option}
        {entity_type}
        {is_mobile_view}
        {form_title}
        {info_message}
        {sorted_fields}
        form_data={form_state.form_data}
        validation_errors={form_state.validation_errors}
        authorization_restricted_fields={auth_derivations.restricted_fields}
        {is_edit_mode}
        {sub_entity_filter}
        foreign_key_options={form_state.foreign_key_options}
        filtered_fields_loading={form_state.filtered_fields_loading}
        current_auth_role_state={auth_derivations.role_state}
        callbacks={controller.callbacks}
        {sub_entity_fields}
        {entity_data}
        build_sub_entity_handlers={create_sub_entity_crud_handlers}
        {warning_state}
        show_transfer_notice={display_flags.show_transfer_notice}
        should_show_fake_data_button={display_flags.can_show_fake_data_button}
        {button_color_class}
        on_submit={controller.handle_submit}
        on_generate_fake_data={controller.handle_generate_fake_data}
        on_cancel={controller.handle_cancel}
    />
</div>
