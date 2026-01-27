<script lang="ts">
  import { fade } from "svelte/transition";

  export let status_message: string = "Loading...";
  export let progress_percentage: number = 0;
</script>

<div
  class="fixed inset-0 z-[9999] flex items-center justify-center bg-accent-900/95 dark:bg-accent-950/98"
  transition:fade={{ duration: 300 }}
>
  <div class="text-center space-y-8 px-6 max-w-md">
    <div class="flex justify-center">
      <div class="relative">
        <div
          class="w-20 h-20 rounded-full border-4 border-theme-primary-200/30 dark:border-theme-primary-800/30"
        ></div>
        <div
          class="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-theme-primary-500 animate-spin"
        ></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <svg
            class="w-8 h-8 text-theme-primary-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <h2 class="text-xl font-semibold text-white">Sports Management System</h2>
      <p class="text-theme-primary-400 font-medium animate-pulse">
        {status_message}
      </p>
    </div>

    {#if progress_percentage > 0}
      <div class="w-full max-w-xs mx-auto">
        <div class="h-2 bg-accent-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-theme-primary-500 rounded-full transition-all duration-500 ease-out"
            style="width: {progress_percentage}%"
          ></div>
        </div>
        <p class="text-xs text-accent-400 mt-2">
          {progress_percentage}% complete
        </p>
      </div>
    {/if}

    <div class="text-xs text-accent-500 space-y-1">
      <p>Preparing your sports management environment</p>
      <p class="text-accent-600">This only happens on first launch</p>
    </div>
  </div>
</div>
