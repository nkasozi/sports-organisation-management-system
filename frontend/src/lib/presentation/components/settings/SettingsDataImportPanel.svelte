<script lang="ts">
    import type { ActionReturn } from "svelte/action";

    import {
        STORAGE_BACKUP_IMPORT_NOTICE_TONE,
        STORAGE_BACKUP_IMPORT_VIEW_STATUS,
        type StorageBackupImportView,
    } from "$lib/presentation/components/settings/settingsDataImportView";

    export let import_view: StorageBackupImportView;
    export let on_confirm: () => void;
    export let on_cancel: () => void;
    export let on_dismiss: () => void;

    const VIEW_STATUS = STORAGE_BACKUP_IMPORT_VIEW_STATUS;
    const ERROR_NOTICE_CLASSES =
        "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200";
    const WARNING_NOTICE_CLASSES =
        "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100";

    const ESCAPE_KEY = "Escape";

    function format_backup_time(created_at: string): string {
        return new Date(created_at).toLocaleString();
    }

    function focus_on_mount(element: HTMLElement): ActionReturn {
        element.focus();
        return {};
    }

    function handle_confirmation_key_down(event: KeyboardEvent): boolean {
        if (event.key !== ESCAPE_KEY) return false;
        event.preventDefault();
        on_cancel();
        return true;
    }
</script>

{#if import_view.status === VIEW_STATUS.BUSY}
    <p
        class="rounded-md border border-accent-200 bg-accent-50 p-3 text-sm text-accent-700 dark:border-accent-700 dark:bg-accent-900 dark:text-accent-200"
        role="status"
    >
        {import_view.message}
    </p>
{:else if import_view.status === VIEW_STATUS.CONFIRMATION}
    <div
        class="space-y-3 rounded-md border border-accent-300 bg-white p-4 dark:border-accent-600 dark:bg-accent-900"
        role="alertdialog"
        aria-labelledby="settings-data-import-confirm-title"
        aria-describedby="settings-data-import-confirm-warning"
        tabindex="-1"
        on:keydown={handle_confirmation_key_down}
    >
        <h4
            id="settings-data-import-confirm-title"
            class="text-sm font-semibold text-accent-900 dark:text-white"
        >
            Replace local data with this backup?
        </h4>
        <dl class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div>
                <dt class="text-xs text-accent-500 dark:text-accent-400">
                    Created
                </dt>
                <dd class="font-medium text-accent-900 dark:text-white">
                    {format_backup_time(import_view.summary.created_at)}
                </dd>
            </div>
            <div>
                <dt class="text-xs text-accent-500 dark:text-accent-400">
                    Records
                </dt>
                <dd class="font-medium text-accent-900 dark:text-white">
                    {import_view.summary.total_records}
                </dd>
            </div>
            <div>
                <dt class="text-xs text-accent-500 dark:text-accent-400">
                    Tables with data
                </dt>
                <dd class="font-medium text-accent-900 dark:text-white">
                    {import_view.summary.tables_with_records} of {import_view
                        .summary.total_tables}
                </dd>
            </div>
        </dl>
        <p
            id="settings-data-import-confirm-warning"
            class="rounded-md border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200"
        >
            {import_view.warning_message}
        </p>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
                type="button"
                class="btn btn-outline"
                use:focus_on_mount
                on:click={on_cancel}
            >
                Cancel
            </button>
            <button
                type="button"
                class="btn border border-red-700 bg-red-700 text-white hover:bg-red-800"
                on:click={on_confirm}
            >
                Replace Local Data
            </button>
        </div>
    </div>
{:else if import_view.status === VIEW_STATUS.NOTICE}
    <div
        class={`space-y-2 rounded-md border p-3 text-sm ${import_view.tone === STORAGE_BACKUP_IMPORT_NOTICE_TONE.ERROR ? ERROR_NOTICE_CLASSES : WARNING_NOTICE_CLASSES}`}
        role="alert"
    >
        <p class="font-semibold">{import_view.title}</p>
        <p>{import_view.message}</p>
        <button
            type="button"
            class="btn btn-outline"
            use:focus_on_mount
            on:click={on_dismiss}
        >
            Dismiss
        </button>
    </div>
{/if}
