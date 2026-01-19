<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let placeholder: string = "Search...";
  export let value: string = "";
  export let debounce_ms: number = 300;
  export let is_loading: boolean = false;

  const dispatch = createEventDispatcher<{
    search: { query: string };
    clear: void;
  }>();

  let timeout_id: ReturnType<typeof setTimeout> | null = null;

  function handle_input(event: Event): void {
    const input = event.target as HTMLInputElement;
    value = input.value;

    if (timeout_id) {
      clearTimeout(timeout_id);
    }

    timeout_id = setTimeout(() => {
      dispatch("search", { query: value });
    }, debounce_ms);
  }

  function handle_clear(): void {
    value = "";
    dispatch("clear");
    dispatch("search", { query: "" });
  }

  function handle_key_down(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      handle_clear();
    }
  }
</script>

<div class="relative">
  <div
    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
  >
    {#if is_loading}
      <div
        class="animate-spin rounded-full h-4 w-4 border-2 border-accent-200 border-t-accent-600"
      ></div>
    {:else}
      <svg
        class="h-4 w-4 text-accent-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    {/if}
  </div>

  <input
    type="text"
    class="w-full pl-10 pr-10 py-2 border border-accent-300 dark:border-accent-600 rounded-lg
           bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100
           placeholder-accent-400 dark:placeholder-accent-500
           focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none
           text-sm"
    {placeholder}
    {value}
    on:input={handle_input}
    on:keydown={handle_key_down}
  />

  {#if value}
    <button
      type="button"
      class="absolute inset-y-0 right-0 pr-3 flex items-center text-accent-400 hover:text-accent-600"
      on:click={handle_clear}
      aria-label="Clear search"
    >
      <svg
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  {/if}
</div>
