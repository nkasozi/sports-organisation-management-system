<script lang="ts">
  export let show_back_button: boolean = false;
  export let page_title: string = "";
  export let current_view: "list" | "create" | "edit" = "list";
  export let total_entity_count: number = 0;
  export let info_message: string | null = null;
  export let on_back: () => void = () => {};
</script>

<div class="flex justify-center w-full">
  <div class="crud-header mb-4 sm:mb-6 w-full max-w-6xl px-4 sm:px-6">
    <div
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div class="flex items-center gap-4">
        {#if show_back_button}
          <button
            class="btn btn-outline"
            on:click={on_back}
            aria-label="Back to list">← Back</button
          >
        {/if}
        <div>
          <h1
            class="text-xl sm:text-2xl font-bold text-accent-900 dark:text-accent-100"
          >
            {page_title}
          </h1>
          {#if current_view === "list" && total_entity_count > 0}
            <p class="text-sm text-accent-600 dark:text-accent-400">
              {total_entity_count}
              {total_entity_count === 1 ? "item" : "items"} total
            </p>
          {/if}
        </div>
      </div>
    </div>

    {#if info_message}
      <div
        class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            /></svg
          >
          <p class="text-sm text-blue-800 dark:text-blue-200">{info_message}</p>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .crud-header {
    border-bottom: 1px solid rgb(229 231 235 / 1);
    padding-bottom: 1rem;
  }

  :global(.dark) .crud-header {
    border-bottom-color: rgb(75 85 99 / 1);
  }

  @media (max-width: 640px) {
    .crud-header {
      margin-bottom: 1rem;
    }
  }
</style>
