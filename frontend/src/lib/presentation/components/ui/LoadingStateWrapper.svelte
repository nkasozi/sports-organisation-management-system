<script context="module" lang="ts">
  export type LoadingState = "idle" | "loading" | "success" | "error";
</script>

<script lang="ts">
  export let state: LoadingState = "idle";
  export let error_message: string = "";
  export let loading_text: string = "Loading...";
  export let show_content_while_loading: boolean = false;

  $: is_loading = state === "loading";
  $: is_error = state === "error";
  $: should_show_content =
    state === "success" || (show_content_while_loading && is_loading);
</script>

<div class="relative">
  {#if is_loading && !show_content_while_loading}
    <div class="flex flex-col items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600 mb-4"
      ></div>
      <p class="text-accent-600 dark:text-accent-400 text-sm">{loading_text}</p>
    </div>
  {:else if is_error}
    <div
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-red-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            Error
          </h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">
            {error_message || "An unexpected error occurred"}
          </p>
        </div>
      </div>
    </div>
  {:else if should_show_content}
    <div class="relative">
      {#if is_loading && show_content_while_loading}
        <div
          class="absolute inset-0 bg-white/50 dark:bg-accent-900/50 flex items-center justify-center z-10 rounded-lg"
        >
          <div
            class="flex items-center space-x-2 bg-white dark:bg-accent-800 px-4 py-2 rounded-lg shadow"
          >
            <div
              class="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-primary-600"
            ></div>
            <span class="text-sm text-accent-600 dark:text-accent-400"
              >{loading_text}</span
            >
          </div>
        </div>
      {/if}
      <slot />
    </div>
  {:else}
    <slot name="empty">
      <div class="text-center py-12">
        <p class="text-accent-500 dark:text-accent-400">No data available</p>
      </div>
    </slot>
  {/if}
</div>
