<script lang="ts">
    import { createEventDispatcher } from "svelte";

    import { entityMetadataRegistry } from "$lib/infrastructure/registry/EntityMetadataRegistry";
    import BulkImportDownloadStep from "$lib/presentation/components/bulkImport/BulkImportDownloadStep.svelte";
    import BulkImportProcessingStep from "$lib/presentation/components/bulkImport/BulkImportProcessingStep.svelte";
    import BulkImportResultsStep from "$lib/presentation/components/bulkImport/BulkImportResultsStep.svelte";
    import BulkImportUploadStep from "$lib/presentation/components/bulkImport/BulkImportUploadStep.svelte";
    import {
        download_bulk_import_csv,
        generate_bulk_import_csv_template,
        generate_bulk_import_failure_report,
    } from "$lib/presentation/logic/bulkImportCsv";
    import { execute_bulk_import } from "$lib/presentation/logic/bulkImportExecution";
    import {
        get_bulk_import_enum_fields,
        get_bulk_import_fields,
        get_bulk_import_foreign_key_fields,
        get_bulk_import_related_entity_display_name,
    } from "$lib/presentation/logic/bulkImportFields";
    import type { BulkImportResult } from "$lib/presentation/logic/bulkImportTypes";

    import {
        build_bulk_import_results_state,
        BULK_IMPORT_FILE_NAME_SUFFIX,
        BULK_IMPORT_FILE_SELECTION_STATUS,
        BULK_IMPORT_MESSAGES,
        BULK_IMPORT_MODAL_STEP,
        type BulkImportModalState,
        EMPTY_UPLOAD_STATE,
        INITIAL_BULK_IMPORT_MODAL_STATE,
        read_bulk_import_file,
        select_bulk_import_file,
    } from "./bulkImport/bulkImportModalState";
    import ErrorDisplay from "./ui/ErrorDisplay.svelte";

    export let entity_type: string;
    export let is_visible = false;

    const dispatch = createEventDispatcher<{
        close: void;
        import_complete: { failure_count: number; success_count: number };
    }>();

    let modal_state: BulkImportModalState = INITIAL_BULK_IMPORT_MODAL_STATE;

    $: entity_metadata = entityMetadataRegistry.get_entity_metadata(
        entity_type.toLowerCase(),
    );
    $: display_name = entity_metadata
        ? entity_metadata.display_name
        : entity_type;
    $: importable_fields = get_bulk_import_fields(
        entity_metadata ? entity_metadata.fields : [],
    );
    $: foreign_key_fields =
        get_bulk_import_foreign_key_fields(importable_fields);
    $: enum_fields = get_bulk_import_enum_fields(importable_fields);

    function handle_download_template(): void {
        download_bulk_import_csv(
            generate_bulk_import_csv_template(importable_fields),
            `${entity_type.toLowerCase()}${BULK_IMPORT_FILE_NAME_SUFFIX.TEMPLATE}`,
        );
        modal_state = EMPTY_UPLOAD_STATE;
    }

    function handle_file_selected(event: Event): void {
        const file_input = event.target as HTMLInputElement;
        modal_state = select_bulk_import_file(file_input.files ?? []);
    }

    async function run_bulk_import(file: File): Promise<BulkImportModalState> {
        const file_content_result = await read_bulk_import_file(file);
        if (!file_content_result.success)
            return {
                step: BULK_IMPORT_MODAL_STEP.FAILED,
                message: file_content_result.error,
            };
        const import_summary = await execute_bulk_import({
            entity_type,
            file_content: file_content_result.data,
            foreign_key_fields,
            importable_fields,
        });
        dispatch("import_complete", {
            failure_count: import_summary.failure_count,
            success_count: import_summary.success_count,
        });
        return build_bulk_import_results_state(import_summary);
    }

    async function handle_start_import(): Promise<void> {
        if (modal_state.step !== BULK_IMPORT_MODAL_STEP.UPLOAD) return;
        if (
            modal_state.selection.status ===
            BULK_IMPORT_FILE_SELECTION_STATUS.EMPTY
        )
            return;
        const file = modal_state.selection.file;
        modal_state = { step: BULK_IMPORT_MODAL_STEP.PROCESSING };
        modal_state = await run_bulk_import(file);
    }

    function handle_download_failure_report(
        import_results: BulkImportResult[],
    ): void {
        download_bulk_import_csv(
            generate_bulk_import_failure_report(
                import_results,
                importable_fields,
            ),
            `${entity_type.toLowerCase()}${BULK_IMPORT_FILE_NAME_SUFFIX.FAILURES}`,
        );
    }

    function handle_close(): void {
        modal_state = INITIAL_BULK_IMPORT_MODAL_STATE;
        dispatch("close");
    }

    function handle_start_over(): void {
        modal_state = INITIAL_BULK_IMPORT_MODAL_STATE;
    }
</script>

{#if is_visible}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-import-title"
    >
        <div
            class="bg-white dark:bg-accent-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        >
            <div
                class="px-6 py-4 border-b border-accent-200 dark:border-accent-700 flex items-center justify-between"
            >
                <h2
                    id="bulk-import-title"
                    class="text-xl font-semibold text-accent-900 dark:text-accent-100"
                >
                    Bulk Import {display_name}s
                </h2>
                <button
                    type="button"
                    class="p-2 rounded-[0.175rem] text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700"
                    on:click={handle_close}
                    aria-label="Close">×</button
                >
            </div>

            <div class="flex-1 overflow-y-auto p-6">
                {#if modal_state.step === BULK_IMPORT_MODAL_STEP.DOWNLOAD}
                    <BulkImportDownloadStep
                        {display_name}
                        {enum_fields}
                        {foreign_key_fields}
                        get_related_entity_display_name={get_bulk_import_related_entity_display_name}
                        {importable_fields}
                        on_download_template={handle_download_template}
                        on_skip_upload={() =>
                            (modal_state = EMPTY_UPLOAD_STATE)}
                    />
                {:else if modal_state.step === BULK_IMPORT_MODAL_STEP.UPLOAD}
                    <BulkImportUploadStep
                        selection={modal_state.selection}
                        on_file_selected={handle_file_selected}
                        on_start_import={handle_start_import}
                        on_start_over={handle_start_over}
                    />
                {:else if modal_state.step === BULK_IMPORT_MODAL_STEP.PROCESSING}
                    <BulkImportProcessingStep />
                {:else if modal_state.step === BULK_IMPORT_MODAL_STEP.RESULTS}
                    {@const import_results = modal_state.import_results}
                    <BulkImportResultsStep
                        failure_count={modal_state.failure_count}
                        {import_results}
                        success_count={modal_state.success_count}
                        on_close={handle_close}
                        on_download_failure_report={() =>
                            handle_download_failure_report(import_results)}
                        on_start_over={handle_start_over}
                    />
                {:else}
                    <ErrorDisplay
                        title={BULK_IMPORT_MESSAGES.FAILED_TITLE}
                        message={modal_state.message}
                        severity="error"
                        retry_label={BULK_IMPORT_MESSAGES.START_OVER}
                        on_retry={handle_start_over}
                    />
                {/if}
            </div>
        </div>
    </div>
{/if}
