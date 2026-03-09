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

  const type_config = {
    success: {
      bg: "bg-white dark:bg-accent-800",
      border: "border-accent-200 dark:border-accent-700",
      accent: "bg-emerald-500",
      text: "text-accent-800 dark:text-accent-100",
      icon_bg: "bg-emerald-50 dark:bg-emerald-900/30",
      icon_color: "text-emerald-500",
      dismiss_color:
        "text-accent-400 hover:text-accent-600 dark:hover:text-accent-200",
    },
    error: {
      bg: "bg-white dark:bg-accent-800",
      border: "border-accent-200 dark:border-accent-700",
      accent: "bg-secondary-500",
      text: "text-accent-800 dark:text-accent-100",
      icon_bg: "bg-secondary-50 dark:bg-secondary-900/30",
      icon_color: "text-secondary-500",
      dismiss_color:
        "text-accent-400 hover:text-accent-600 dark:hover:text-accent-200",
    },
    warning: {
      bg: "bg-white dark:bg-accent-800",
      border: "border-accent-200 dark:border-accent-700",
      accent: "bg-primary-500",
      text: "text-accent-800 dark:text-accent-100",
      icon_bg: "bg-primary-50 dark:bg-primary-900/30",
      icon_color: "text-primary-500",
      dismiss_color:
        "text-accent-400 hover:text-accent-600 dark:hover:text-accent-200",
    },
    info: {
      bg: "bg-white dark:bg-accent-800",
      border: "border-accent-200 dark:border-accent-700",
      accent: "bg-blue-500",
      text: "text-accent-800 dark:text-accent-100",
      icon_bg: "bg-blue-50 dark:bg-blue-900/30",
      icon_color: "text-blue-500",
      dismiss_color:
        "text-accent-400 hover:text-accent-600 dark:hover:text-accent-200",
    },
  };

  $: config = type_config[type];
</script>

{#if is_visible}
  <div
    class="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[400px] z-50 {config.bg} {config.border} border rounded-xl shadow-xl overflow-hidden animate-slide-up"
    role="alert"
  >
    <div class="flex">
      <div class="w-1.5 flex-shrink-0 {config.accent}"></div>

      <div class="flex-1 p-4">
        <div class="flex items-start gap-3">
          <div
            class="flex-shrink-0 w-9 h-9 rounded-full {config.icon_bg} flex items-center justify-center"
          >
            {#if type === "success"}
              <svg
                class="h-5 w-5 {config.icon_color}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            {:else if type === "error"}
              <svg
                class="h-5 w-5 {config.icon_color}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            {:else if type === "warning"}
              <svg
                class="h-5 w-5 {config.icon_color}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            {:else}
              <svg
                class="h-5 w-5 {config.icon_color}"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
            {/if}
          </div>

          <div class="flex-1 min-w-0 pt-0.5">
            <p class="{config.text} text-sm font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <button
            type="button"
            class="flex-shrink-0 p-1 rounded-md {config.dismiss_color} transition-colors"
            on:click={handle_dismiss}
            aria-label="Dismiss"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    {#if auto_dismiss}
      <div class="h-0.5 bg-accent-100 dark:bg-accent-700">
        <div
          class="h-full {config.accent} animate-progress-shrink"
          style="animation-duration: {dismiss_delay_ms}ms"
        ></div>
      </div>
    {/if}
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

  @keyframes progress-shrink {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }

  .animate-progress-shrink {
    animation: progress-shrink linear forwards;
  }
</style>
