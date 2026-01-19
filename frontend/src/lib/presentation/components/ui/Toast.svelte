<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let message: string = "";
  export let type: "success" | "error" | "warning" | "info" = "info";
  export let is_visible: boolean = false;
  export let auto_dismiss: boolean = true;
  export let dismiss_delay_ms: number = 5000;

  const dispatch = createEventDispatcher<{ dismiss: void }>();

  let timeout_id: ReturnType<typeof setTimeout> | null = null;

  $: if (is_visible && auto_dismiss) {
    clear_existing_timeout();
    timeout_id = setTimeout(() => {
      is_visible = false;
      dispatch("dismiss");
    }, dismiss_delay_ms);
  }

  function clear_existing_timeout(): void {
    if (timeout_id) {
      clearTimeout(timeout_id);
      timeout_id = null;
    }
  }

  function handle_dismiss(): void {
    clear_existing_timeout();
    is_visible = false;
    dispatch("dismiss");
  }

  const type_styles = {
    success: {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-800 dark:text-green-200",
      icon_color: "text-green-500",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-200",
      icon_color: "text-red-500",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-800 dark:text-yellow-200",
      icon_color: "text-yellow-500",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
      icon_color: "text-blue-500",
    },
  };

  $: styles = type_styles[type];
</script>

{#if is_visible}
  <div
    class="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 {styles.bg} {styles.border} border rounded-lg shadow-lg p-4 animate-slide-up"
    role="alert"
  >
    <div class="flex items-start">
      <div class="flex-shrink-0 {styles.icon_color}">
        {#if type === "success"}
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        {:else if type === "error"}
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        {:else if type === "warning"}
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        {:else}
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
        {/if}
      </div>

      <div class="ml-3 flex-1">
        <p class="{styles.text} text-sm font-medium">{message}</p>
      </div>

      <button
        type="button"
        class="ml-3 flex-shrink-0 {styles.text} hover:opacity-75"
        on:click={handle_dismiss}
        aria-label="Dismiss"
      >
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
</style>
