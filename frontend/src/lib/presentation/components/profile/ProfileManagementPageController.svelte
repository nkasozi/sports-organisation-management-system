<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import type { EntityViewCallbacks } from "$lib/core/types/EntityHandlers";
    import { PROFILE_MANAGEMENT_ACCESS_STATUS } from "$lib/presentation/logic/profileManagementPageConstants";
    import { create_profile_management_access_dependencies } from "$lib/presentation/logic/profileManagementPageControllerDependencies";
    import {
        build_profile_management_controller_authorization_filter,
        PROFILE_MANAGEMENT_PAGE_MESSAGES,
        resolve_profile_management_access,
    } from "$lib/presentation/logic/profileManagementPageControllerLogic";
    import { load_profile_management_page_data } from "$lib/presentation/logic/profileManagementPageData";
    import {
        build_profile_management_permissions,
        build_profile_management_rows,
        type ProfileManagementConfiguration,
        type ProfileManagementEntity,
        type ProfileManagementOption,
        type ProfileManagementPermissions,
    } from "$lib/presentation/logic/profileManagementPageState";
    import { auth_store } from "$lib/presentation/stores/auth";

    import { PROFILE_MANAGEMENT_LOG_EVENTS } from "./profileManagementMessages";
    import ProfileManagementPageContent from "./ProfileManagementPageContent.svelte";
    import {
        create_profile_management_create_state,
        create_profile_management_edit_state,
        create_profile_management_list_state,
        get_profile_management_list_notice,
        PROFILE_MANAGEMENT_LOAD_STATUS,
        type ProfileManagementEditorState,
        type ProfileManagementLoadState,
    } from "./profileManagementPageStatus";

    export let configuration: ProfileManagementConfiguration;

    let editor_state: ProfileManagementEditorState =
            create_profile_management_list_state(),
        load_state: ProfileManagementLoadState = {
            status: PROFILE_MANAGEMENT_LOAD_STATUS.LOADING,
        },
        action_notice = "",
        profiles: ProfileManagementEntity[] = [],
        related_entity_options: ProfileManagementOption[] = [],
        permissions: ProfileManagementPermissions =
            build_profile_management_permissions(
                void 0,
                configuration.normalized_entity_type,
            );

    $: rows = build_profile_management_rows(
        profiles,
        related_entity_options,
        configuration.get_profile_related_entity_id,
    );
    $: list_notice = get_profile_management_list_notice(
        load_state,
        action_notice,
    );
    const form_view_callbacks: EntityViewCallbacks = {
        on_save_completed: handle_form_save,
        on_cancel: handle_form_cancel,
    };

    function build_authorization_filter(): Record<string, string> {
        return build_profile_management_controller_authorization_filter(
            get(auth_store),
            configuration,
        );
    }

    async function load_profiles(): Promise<void> {
        load_state = { status: PROFILE_MANAGEMENT_LOAD_STATUS.LOADING };
        action_notice = "";
        const result = await load_profile_management_page_data(
            configuration,
            build_authorization_filter(),
            PROFILE_MANAGEMENT_PAGE_MESSAGES.LOAD_FAILED,
        );
        if (!result.success) {
            load_state = {
                status: PROFILE_MANAGEMENT_LOAD_STATUS.FAILED,
                message: result.error_message,
            };
            return;
        }
        profiles = result.profiles;
        related_entity_options = result.related_entity_options;
        load_state = { status: PROFILE_MANAGEMENT_LOAD_STATUS.READY };
    }

    function handle_create_click(): void {
        if (!permissions.can_create) {
            action_notice = configuration.create_denied_message;
            return;
        }
        editor_state = create_profile_management_create_state();
    }

    function handle_edit_click(entity: ProfileManagementEntity): void {
        if (!permissions.can_edit) {
            action_notice = configuration.edit_denied_message;
            return;
        }
        editor_state = create_profile_management_edit_state(entity);
    }

    function handle_preview_click(entity: ProfileManagementEntity): void {
        const current_preview_path =
            configuration.get_profile_preview_path(entity);
        if (!browser || !current_preview_path) return;
        window.open(current_preview_path, "_blank");
    }

    async function handle_delete_click(
        entity: ProfileManagementEntity,
    ): Promise<void> {
        if (!permissions.can_delete) {
            action_notice = configuration.delete_denied_message;
            return;
        }
        if (!confirm(configuration.delete_confirmation_message)) return;
        const result = await configuration.profile_use_cases.delete(entity.id);
        if (!result.success) {
            console.error("[ProfileManagement] Profile delete failed", {
                event: PROFILE_MANAGEMENT_LOG_EVENTS.DELETE_FAILED,
                entity_type: configuration.normalized_entity_type,
                profile_id: entity.id,
                error: result.error,
            });
            action_notice = PROFILE_MANAGEMENT_PAGE_MESSAGES.DELETE_FAILED;
            return;
        }
        await load_profiles();
    }

    function handle_form_save(): void {
        editor_state = create_profile_management_list_state();
        void load_profiles();
    }

    function handle_form_cancel(): void {
        editor_state = create_profile_management_list_state();
    }

    onMount(async () => {
        if (!browser) return;
        const access_outcome = await resolve_profile_management_access(
            configuration,
            create_profile_management_access_dependencies(),
        );
        switch (access_outcome.status) {
            case PROFILE_MANAGEMENT_ACCESS_STATUS.FAILED:
                load_state = {
                    status: PROFILE_MANAGEMENT_LOAD_STATUS.FAILED,
                    message: access_outcome.error_message,
                };
                return;
            case PROFILE_MANAGEMENT_ACCESS_STATUS.DENIED:
                return;
            case PROFILE_MANAGEMENT_ACCESS_STATUS.GRANTED:
                permissions = access_outcome.permissions;
                await load_profiles();
        }
    });
</script>

<svelte:head>
    <title>{configuration.page_head_title}</title>
</svelte:head>

<ProfileManagementPageContent
    {configuration}
    {editor_state}
    {rows}
    is_loading={load_state.status === PROFILE_MANAGEMENT_LOAD_STATUS.LOADING}
    {list_notice}
    {form_view_callbacks}
    on_create_requested={handle_create_click}
    on_preview_requested={handle_preview_click}
    on_edit_requested={handle_edit_click}
    on_delete_requested={handle_delete_click}
/>
