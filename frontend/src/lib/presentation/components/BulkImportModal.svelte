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
  import type {
    BulkImportResult,
    BulkImportStep,
  } from "$lib/presentation/logic/bulkImportTypes";

  export let entity_type: string;
  export let is_visible = false;

  const dispatch = createEventDispatcher<{
    close: void;
    import_complete: { failure_count: number; success_count: number };
  }>();

  let current_step: BulkImportStep = "download";
  let failure_count = 0;
  let import_results: BulkImportResult[] = [];
  let selected_file: File | null = null;
  let success_count = 0;

  $: entity_metadata = entityMetadataRegistry.get_entity_metadata(
    entity_type.toLowerCase(),
  );
  $: display_name = entity_metadata?.display_name || entity_type;
  $: importable_fields = get_bulk_import_fields(entity_metadata?.fields || []);
  $: foreign_key_fields = get_bulk_import_foreign_key_fields(importable_fields);
  $: enum_fields = get_bulk_import_enum_fields(importable_fields);

  function reset_bulk_import_state(next_step: BulkImportStep): void {
    current_step = next_step;
    failure_count = 0;
    import_results = [];
    selected_file = null;
    success_count = 0;
  }

  function handle_download_template(): void {
    download_bulk_import_csv(
      generate_bulk_import_csv_template(importable_fields),
      `${entity_type.toLowerCase()}_import_template.csv`,
    );
    current_step = "upload";
  }

  function handle_file_selected(event: Event): void {
    const file_input = event.target as HTMLInputElement;
    selected_file =
      file_input.files && file_input.files.length > 0
        ? file_input.files[0]
        : null;
  }

  async function handle_start_import(): Promise<void> {
    if (!selected_file) return;
    current_step = "processing";
    const import_result = await execute_bulk_import({
      entity_type,
      file_content: await selected_file.text(),
      foreign_key_fields,
      importable_fields,
    });
    failure_count = import_result.failure_count;
    import_results = import_result.import_results;
    success_count = import_result.success_count;
    current_step = "results";
    dispatch("import_complete", { failure_count, success_count });
  }

  function handle_download_failure_report(): void {
    download_bulk_import_csv(
      generate_bulk_import_failure_report(import_results, importable_fields),
      `${entity_type.toLowerCase()}_import_failures.csv`,
    );
  }

  function handle_close(): void {
    reset_bulk_import_state("download");
    dispatch("close");
  }

  function handle_start_over(): void {
    reset_bulk_import_state("download");
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
          class="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700"
          on:click={handle_close}
          aria-label="Close">×</button
        >
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        {#if current_step === "download"}
          <BulkImportDownloadStep
            {display_name}
            {enum_fields}
            {foreign_key_fields}
            get_related_entity_display_name={get_bulk_import_related_entity_display_name}
            {importable_fields}
            on_download_template={handle_download_template}
            on_skip_upload={() => (current_step = "upload")}
          />
        {:else if current_step === "upload"}
          <BulkImportUploadStep
            {selected_file}
            on_file_selected={handle_file_selected}
            on_start_import={handle_start_import}
            on_start_over={handle_start_over}
          />
        {:else if current_step === "processing"}
          <BulkImportProcessingStep />
        {:else if current_step === "results"}
          <BulkImportResultsStep
            {failure_count}
            {import_results}
            {success_count}
            on_close={handle_close}
            on_download_failure_report={handle_download_failure_report}
            on_start_over={handle_start_over}
          />
        {/if}
      </div>
    </div>
  </div>
{/if}
