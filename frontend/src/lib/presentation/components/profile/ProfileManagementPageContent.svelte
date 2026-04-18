<script lang="ts">
    import type { EntityViewCallbacks } from "$lib/core/types/EntityHandlers";
    import ProfileManagementFormPanel from "$lib/presentation/components/profile/ProfileManagementFormPanel.svelte";
    import ProfileManagementList from "$lib/presentation/components/profile/ProfileManagementList.svelte";
    import type {
        ProfileManagementConfiguration,
        ProfileManagementEntity,
        ProfileManagementRow,
        ProfileManagementViewMode,
    } from "$lib/presentation/logic/profileManagementPageState";

    export let configuration: ProfileManagementConfiguration;
    export let current_view: ProfileManagementViewMode;
    export let form_title: string;
    export let preview_path: string;
    export let selected_profile: ProfileManagementEntity | undefined;
    export let rows: ProfileManagementRow[];
    export let is_loading: boolean;
    export let error_message: string;
    export let form_view_callbacks: EntityViewCallbacks;
    export let on_create_requested: () => void;
    export let on_preview_requested: (entity: ProfileManagementEntity) => void;
    export let on_edit_requested: (entity: ProfileManagementEntity) => void;
    export let on_delete_requested: (
        entity: ProfileManagementEntity,
    ) => Promise<void>;
</script>

{#if current_view === "list"}
    <ProfileManagementList
        subject_column_label={configuration.subject_column_label}
        list_title={configuration.list_title}
        create_button_label={configuration.create_button_label}
        preview_button_label={configuration.preview_button_label}
        empty_title={configuration.empty_title}
        empty_message={configuration.empty_message}
        {is_loading}
        {error_message}
        {rows}
        {on_create_requested}
        on_preview_requested={(row) => on_preview_requested(row.entity)}
        on_edit_requested={(row) => on_edit_requested(row.entity)}
        on_delete_requested={(row) => on_delete_requested(row.entity)}
    />
{:else}
    <ProfileManagementFormPanel
        title={form_title}
        entity_type={configuration.entity_type}
        entity_data={selected_profile}
        back_button_label={configuration.back_button_label}
        preview_panel_label={configuration.preview_panel_label}
        preview_panel_action_label={configuration.preview_panel_action_label}
        {preview_path}
        show_preview_panel={configuration.show_edit_preview &&
            current_view === "edit"}
        on_back_requested={() => form_view_callbacks.on_cancel?.()}
        view_callbacks={form_view_callbacks}
    />
{/if}
