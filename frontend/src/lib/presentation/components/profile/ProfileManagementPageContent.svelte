<script lang="ts">
    import type { EntityViewCallbacks } from "$lib/core/types/EntityHandlers";
    import ProfileManagementFormPanel from "$lib/presentation/components/profile/ProfileManagementFormPanel.svelte";
    import ProfileManagementList from "$lib/presentation/components/profile/ProfileManagementList.svelte";
    import type {
        ProfileManagementConfiguration,
        ProfileManagementEntity,
        ProfileManagementRow,
    } from "$lib/presentation/logic/profileManagementPageState";

    import {
        get_profile_management_editor_entity,
        PROFILE_MANAGEMENT_VIEW,
        type ProfileManagementEditorState,
    } from "./profileManagementPageStatus";

    export let configuration: ProfileManagementConfiguration;
    export let editor_state: ProfileManagementEditorState;
    export let rows: ProfileManagementRow[];
    export let is_loading: boolean;
    export let list_notice: string;
    export let form_view_callbacks: EntityViewCallbacks;
    export let on_create_requested: () => void;
    export let on_preview_requested: (entity: ProfileManagementEntity) => void;
    export let on_edit_requested: (entity: ProfileManagementEntity) => void;
    export let on_delete_requested: (
        entity: ProfileManagementEntity,
    ) => Promise<void>;

    function get_preview_path(state: ProfileManagementEditorState): string {
        switch (state.view) {
            case PROFILE_MANAGEMENT_VIEW.EDIT:
                return configuration.get_profile_preview_path(state.profile);
            case PROFILE_MANAGEMENT_VIEW.CREATE:
            case PROFILE_MANAGEMENT_VIEW.LIST:
                return "";
        }
    }

    function get_form_title(state: ProfileManagementEditorState): string {
        return state.view === PROFILE_MANAGEMENT_VIEW.CREATE
            ? configuration.create_title
            : configuration.edit_title;
    }
</script>

{#if editor_state.view === PROFILE_MANAGEMENT_VIEW.LIST}
    <ProfileManagementList
        subject_column_label={configuration.subject_column_label}
        list_title={configuration.list_title}
        create_button_label={configuration.create_button_label}
        preview_button_label={configuration.preview_button_label}
        empty_title={configuration.empty_title}
        empty_message={configuration.empty_message}
        {is_loading}
        error_message={list_notice}
        {rows}
        {on_create_requested}
        on_preview_requested={(row) => on_preview_requested(row.entity)}
        on_edit_requested={(row) => on_edit_requested(row.entity)}
        on_delete_requested={(row) => void on_delete_requested(row.entity)}
    />
{:else}
    <ProfileManagementFormPanel
        title={get_form_title(editor_state)}
        entity_type={configuration.entity_type}
        entity_option={get_profile_management_editor_entity(editor_state)}
        back_button_label={configuration.back_button_label}
        preview_panel_label={configuration.preview_panel_label}
        preview_panel_action_label={configuration.preview_panel_action_label}
        preview_path={get_preview_path(editor_state)}
        show_preview_panel={configuration.show_edit_preview &&
            editor_state.view === PROFILE_MANAGEMENT_VIEW.EDIT}
        on_back_requested={() => form_view_callbacks.on_cancel?.()}
        view_callbacks={form_view_callbacks}
    />
{/if}
