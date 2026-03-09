<script context="module" lang="ts">
  export type LoadingState = "idle" | "loading" | "success" | "error";
</script>

<script lang="ts">
  import ErrorDisplay from "./ErrorDisplay.svelte";

  export let state: LoadingState = "idle";
  export let error_message: string = "";
  export let error_title: string = "Something went wrong";
  export let loading_text: string = "Loading...";
  export let show_content_while_loading: boolean = false;
  export let on_retry: (() => void) | null = null;

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
    <ErrorDisplay
      title={error_title}
      message={error_message || "An unexpected error occurred"}
      {on_retry}
    />
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
