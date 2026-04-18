<script lang="ts">
  export let selected_file: File | undefined;
  export let on_file_selected: (event: Event) => void;
  export let on_start_import: () => Promise<void>;
  export let on_start_over: () => void;

  let file_input: HTMLInputElement;
</script>

<div class="space-y-6">
  <div
    class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
  >
    <h3 class="font-medium text-blue-900 dark:text-blue-100 mb-2">
      Step 2: Upload Your Filled CSV
    </h3>
    <p class="text-sm text-blue-700 dark:text-blue-300 mb-4">
      Select your completed CSV file to begin the import process.
    </p>

    <div
      class="border-2 border-dashed border-accent-300 dark:border-accent-600 rounded-lg p-8 text-center"
    >
      <input
        bind:this={file_input}
        type="file"
        accept=".csv"
        class="hidden"
        on:change={on_file_selected}
      />
      {#if selected_file}
        <div class="space-y-2">
          <p class="font-medium text-accent-900 dark:text-accent-100">
            {selected_file.name}
          </p>
          <button
            type="button"
            class="text-sm text-primary-600 hover:text-primary-700"
            on:click={() => file_input.click()}>Choose a different file</button
          >
        </div>
      {:else}
        <div class="space-y-2">
          <button
            type="button"
            class="btn btn-outline"
            on:click={() => file_input.click()}>Select CSV File</button
          >
          <p class="text-sm text-accent-500">or drag and drop</p>
        </div>
      {/if}
    </div>
  </div>

  <div class="flex gap-3">
    <button type="button" class="btn btn-outline" on:click={on_start_over}
      >Back</button
    >
    <button
      type="button"
      class="btn bg-purple-600 hover:bg-purple-700 text-white flex-1"
      disabled={!selected_file}
      on:click={on_start_import}>Start Import</button
    >
  </div>
</div>
