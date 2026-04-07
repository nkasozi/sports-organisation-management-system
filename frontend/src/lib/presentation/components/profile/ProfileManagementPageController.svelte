<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import type { BaseEntity } from "$lib/core/entities/BaseEntity";
    import type { UserScopeProfile } from "$lib/core/interfaces/ports";
    import type { EntityViewCallbacks } from "$lib/core/types/EntityHandlers";
    import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import { load_profile_management_page_data } from "$lib/presentation/logic/profileManagementPageData";
    import {
        build_profile_management_authorization_filter,
        build_profile_management_permissions,
        build_profile_management_rows,
        type ProfileManagementConfiguration,
        type ProfileManagementEntity,
        type ProfileManagementOption,
        type ProfileManagementPermissions,
        type ProfileManagementViewMode,
    } from "$lib/presentation/logic/profileManagementPageState";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";

    import ProfileManagementPageContent from "./ProfileManagementPageContent.svelte";
    const PROFILE_MANAGEMENT_PAGE_MESSAGES = {
        NO_USER_PROFILE: "No user profile found",
        LOAD_FAILED: "Failed to load profiles",
        DELETE_FAILED: "Failed to delete profile",
        HOME_ROUTE: "/",
        READ_ACTION: "read",
    } as const;

    export let configuration: ProfileManagementConfiguration;

    let current_view: ProfileManagementViewMode = "list",
        profiles: ProfileManagementEntity[] = [],
        selected_profile: ProfileManagementEntity | null = null,
        is_loading = true,
        error_message = "",
        related_entity_options: ProfileManagementOption[] = [],
        permissions: ProfileManagementPermissions =
            build_profile_management_permissions(
                undefined,
                configuration.normalized_entity_type,
            );

    $: rows = build_profile_management_rows(
        profiles,
        related_entity_options,
        configuration.get_profile_related_entity_id,
    );
    $: form_title =
        current_view === "create"
            ? configuration.create_title
            : configuration.edit_title;
    $: preview_path = selected_profile
        ? configuration.get_profile_preview_path(selected_profile)
        : null;

    const form_view_callbacks: EntityViewCallbacks = {
        on_save_completed: handle_form_save,
        on_cancel: handle_form_cancel,
    };

    function build_authorization_filter(): Record<string, string> {
        return build_profile_management_authorization_filter(
            get(auth_store).current_profile as UserScopeProfile | null,
            configuration.authorization_filter_fields,
        );
    }

    async function load_profiles(): Promise<boolean> {
        is_loading = true;
        error_message = "";
        const result = await load_profile_management_page_data(
            configuration,
            build_authorization_filter(),
            PROFILE_MANAGEMENT_PAGE_MESSAGES.LOAD_FAILED,
        );
        if (!result.success) {
            error_message = result.error_message;
            is_loading = false;
            return false;
        }
        profiles = result.profiles;
        related_entity_options = result.related_entity_options;
        is_loading = false;
        return true;
    }

    function handle_create_click(): void {
        if (!permissions.can_create) {
            error_message = configuration.create_denied_message;
            return;
        }
        selected_profile = null;
        current_view = "create";
    }

    function handle_edit_click(entity: ProfileManagementEntity): void {
        if (!permissions.can_edit) {
            error_message = configuration.edit_denied_message;
            return;
        }
        selected_profile = entity;
        current_view = "edit";
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
            error_message = configuration.delete_denied_message;
            return;
        }
        if (!confirm(configuration.delete_confirmation_message)) return;
        const result = await configuration.profile_use_cases.delete(entity.id);
        if (!result.success) {
            error_message =
                result.error || PROFILE_MANAGEMENT_PAGE_MESSAGES.DELETE_FAILED;
            return;
        }
        await load_profiles();
    }

    function handle_form_save(entity: BaseEntity, is_new: boolean): void {
        current_view = "list";
        selected_profile = null;
        void entity;
        void is_new;
        void load_profiles();
    }

    function handle_form_cancel(): void {
        current_view = "list";
        selected_profile = null;
    }

    onMount(async () => {
        if (!browser) return;
        const ensure_result = await ensure_auth_profile();
        if (!ensure_result.success) {
            error_message = ensure_result.error_message;
            is_loading = false;
            return;
        }
        const auth_state = get(auth_store);
        if (!auth_state.current_token || !auth_state.current_profile) {
            error_message = PROFILE_MANAGEMENT_PAGE_MESSAGES.NO_USER_PROFILE;
            is_loading = false;
            return;
        }
        permissions = build_profile_management_permissions(
            auth_state.current_profile.role,
            configuration.normalized_entity_type,
        );
        if (!permissions.can_read) {
            await get_authorization_adapter().check_entity_authorized(
                auth_state.current_token.raw_token,
                configuration.normalized_entity_type,
                PROFILE_MANAGEMENT_PAGE_MESSAGES.READ_ACTION,
            );
            access_denial_store.set_denial(
                configuration.access_denial_path,
                configuration.access_denial_message,
            );
            void goto(PROFILE_MANAGEMENT_PAGE_MESSAGES.HOME_ROUTE);
            return;
        }
        await load_profiles();
    });
</script>

<svelte:head>
    <title>{configuration.page_head_title}</title>
</svelte:head>

<ProfileManagementPageContent
    {configuration}
    {current_view}
    {form_title}
    {preview_path}
    {selected_profile}
    {rows}
    {is_loading}
    {error_message}
    {form_view_callbacks}
    on_create_requested={handle_create_click}
    on_preview_requested={handle_preview_click}
    on_edit_requested={handle_edit_click}
    on_delete_requested={handle_delete_click}
/>
