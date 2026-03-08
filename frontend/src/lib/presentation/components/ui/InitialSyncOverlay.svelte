<script lang="ts">
  import { fade } from "svelte/transition";

  export let status_message: string = "Syncing...";
  export let progress_percentage: number = 0;
</script>

<div
  class="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/95 dark:bg-gray-950/98"
  transition:fade={{ duration: 300 }}
>
  <div class="text-center space-y-8 px-6 max-w-md">
    <div class="flex justify-center">
      <div class="relative">
        <div
          class="w-20 h-20 rounded-full border-4 border-blue-200/30 dark:border-blue-800/30"
        ></div>
        <div
          class="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"
        ></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <svg
            class="w-8 h-8 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <h2 class="text-xl font-semibold text-white">
        Setting up your workspace
      </h2>
      <p class="text-blue-400 font-medium animate-pulse">
        {status_message}
      </p>
    </div>

    {#if progress_percentage > 0}
      <div class="w-full max-w-xs mx-auto">
        <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style="width: {progress_percentage}%"
          ></div>
        </div>
        <p class="text-xs text-gray-400 mt-2">
          {progress_percentage}% complete
        </p>
      </div>
    {/if}

    <p class="text-xs text-gray-500">Pulling latest data from the server</p>
  </div>
</div>
