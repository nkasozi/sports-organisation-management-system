<script lang="ts">
  import type { BulkImportResult } from "$lib/presentation/logic/bulkImportTypes";

  export let failure_count: number;
  export let import_results: BulkImportResult[];
  export let success_count: number;
  export let on_close: () => void;
  export let on_download_failure_report: () => void;
  export let on_start_over: () => void;
</script>

<div class="space-y-6">
  <div
    class={`rounded-lg p-4 ${failure_count === 0 ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : success_count === 0 ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" : "bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"}`}
  >
    <h3
      class={`font-medium mb-2 ${failure_count === 0 ? "text-green-900 dark:text-green-100" : success_count === 0 ? "text-red-900 dark:text-red-100" : "text-violet-900 dark:text-violet-100"}`}
    >
      Import Complete
    </h3>
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-green-500"></span><span
          class="text-accent-700 dark:text-accent-300"
          >{success_count} record{success_count !== 1 ? "s" : ""} imported successfully</span
        >
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-red-500"></span><span
          class="text-accent-700 dark:text-accent-300"
          >{failure_count} record{failure_count !== 1 ? "s" : ""} failed</span
        >
      </div>
    </div>
  </div>

  {#if failure_count > 0}
    <div class="border border-accent-200 dark:border-accent-700 rounded-lg p-4">
      <h4 class="font-medium text-accent-900 dark:text-accent-100 mb-3">
        Failed Records
      </h4>
      <div class="max-h-48 overflow-y-auto space-y-2">
        {#each import_results.filter((result: BulkImportResult) => !result.success) as result}
          <div class="bg-red-50 dark:bg-red-900/10 rounded p-2 text-sm">
            <p class="font-medium text-red-800 dark:text-red-200">
              Row {result.row_number}: {result.error_message}
            </p>
          </div>
        {/each}
      </div>
      <button
        type="button"
        class="mt-4 btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
        on:click={on_download_failure_report}>Download Failure Report</button
      >
    </div>
  {/if}

  <div class="flex gap-3">
    <button type="button" class="btn btn-outline" on:click={on_start_over}
      >Import More</button
    >
    <button
      type="button"
      class="btn btn-primary-action flex-1"
      on:click={on_close}>Done</button
    >
  </div>
</div>
