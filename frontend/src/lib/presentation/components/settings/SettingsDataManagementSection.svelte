<script lang="ts">
    import { create_idle_storage_backup_restore_state } from "$lib/infrastructure/backup/storageBackupRestoreMachine";
    import { type StorageBackupRestoreState } from "$lib/infrastructure/backup/storageBackupRestoreTypes";
    import { get_storage_backup_coordinator } from "$lib/infrastructure/backup/storageBackupRuntime";
    import SettingsDataImportPanel from "$lib/presentation/components/settings/SettingsDataImportPanel.svelte";
    import {
        build_storage_backup_import_view,
        is_storage_backup_import_in_progress,
    } from "$lib/presentation/components/settings/settingsDataImportView";
    import {
        begin_storage_backup_import,
        cancel_storage_backup_import,
        confirm_storage_backup_import,
        dismiss_storage_backup_import,
        export_storage_backup_json,
        get_storage_backup_support_message,
    } from "$lib/presentation/components/settings/settingsDataManagementLogic";
    import type { ShowToast } from "$lib/presentation/components/settings/settingsDataManagementMessages";
    import SettingsSectionCard from "$lib/presentation/components/settings/SettingsSectionCard.svelte";

    export let show_toast: ShowToast;

    const BACKUP_FILE_MIME_TYPE = "application/json";
    const OBJECT_URL_REVOKE_DELAY_MS = 60000;
    const storage_backup_coordinator = get_storage_backup_coordinator();
    const storage_backup_support_message = get_storage_backup_support_message(
        storage_backup_coordinator.get_device_backup_capability(),
    );

    let is_exporting = false;
    let import_state = create_idle_storage_backup_restore_state();
    let import_file_input: HTMLInputElement;

    $: import_view = build_storage_backup_import_view(import_state);
    $: is_import_in_progress =
        is_storage_backup_import_in_progress(import_state);
    $: is_working = is_exporting || is_import_in_progress;

    function download_backup_file(
        file_name: string,
        serialized_backup: string,
    ): boolean {
        const backup_blob = new Blob([serialized_backup], {
            type: BACKUP_FILE_MIME_TYPE,
        });
        const backup_url = URL.createObjectURL(backup_blob);
        const download_link = document.createElement("a");
        download_link.href = backup_url;
        download_link.download = file_name;
        download_link.click();
        setTimeout(
            () => URL.revokeObjectURL(backup_url),
            OBJECT_URL_REVOKE_DELAY_MS,
        );
        return true;
    }

    function publish_import_state(
        next_state: StorageBackupRestoreState,
    ): boolean {
        import_state = next_state;
        return true;
    }

    function open_import_file_picker(): boolean {
        if (is_working) return false;
        import_file_input.click();
        return true;
    }

    async function handle_export_all_data(): Promise<boolean> {
        if (is_working) {
            return false;
        }

        is_exporting = true;
        const export_succeeded = await export_storage_backup_json({
            create_manual_backup_json: () =>
                storage_backup_coordinator.create_manual_backup_json(),
            download_file: download_backup_file,
            show_toast,
        });
        is_exporting = false;
        return export_succeeded;
    }

    async function handle_import_change(event: Event): Promise<boolean> {
        const current_target = event.currentTarget as HTMLInputElement;
        const [backup_file] = Array.from(current_target.files ?? []);
        current_target.value = "";

        if (!backup_file || is_working) {
            return false;
        }

        await begin_storage_backup_import({
            current_state: import_state,
            publish_state: publish_import_state,
            load_serialized_backup: () => backup_file.text(),
            prepare_backup_restore: (serialized_backup: string) =>
                storage_backup_coordinator.prepare_backup_restore(
                    serialized_backup,
                ),
        });
        return true;
    }

    async function handle_import_confirmed(): Promise<boolean> {
        await confirm_storage_backup_import({
            current_state: import_state,
            publish_state: publish_import_state,
            restore_prepared_backup: (prepared_restore) =>
                storage_backup_coordinator.restore_prepared_backup(
                    prepared_restore,
                ),
            show_toast,
            refresh_page: () => window.location.reload(),
        });
        return true;
    }
</script>

<SettingsSectionCard
    title="Data Management"
    description="Export and manage your organization data"
    content_class_name="space-y-4"
>
    <div class="flex flex-col sm:flex-row gap-3">
        <button
            type="button"
            class="btn btn-outline"
            disabled={is_working}
            on:click={handle_export_all_data}
        >
            <svg
                class="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                /></svg
            >
            Export All Data
        </button>
        <button
            type="button"
            class="btn btn-outline"
            disabled={is_working}
            aria-controls="settings-data-import-input"
            on:click={open_import_file_picker}
        >
            <svg
                class="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                /></svg
            >
            Import Data
        </button>
        <input
            bind:this={import_file_input}
            id="settings-data-import-input"
            type="file"
            accept="application/json,.json"
            class="hidden"
            tabindex="-1"
            aria-hidden="true"
            disabled={is_working}
            on:change={handle_import_change}
        />
    </div>

    <SettingsDataImportPanel
        {import_view}
        on_confirm={handle_import_confirmed}
        on_cancel={() =>
            (import_state = cancel_storage_backup_import(import_state))}
        on_dismiss={() =>
            (import_state = dismiss_storage_backup_import(import_state))}
    />

    <p class="text-xs text-accent-500 dark:text-accent-400">
        {storage_backup_support_message}
    </p>
</SettingsSectionCard>
