<script context="module" lang="ts">
  export interface SelectOption {
    value: string;
    label: string;
    color_swatch?: string;
  }
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from "svelte";
  import {
    clamp_index,
    filter_select_options,
    find_select_option_by_value,
  } from "./searchable_select_logic";
  import type { SelectOption as SelectOptionType } from "./searchable_select_logic";

  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  export let label: string = "";
  export let name: string;
  export let value: string = "";
  export let options: SelectOptionType[] = [];
  export let placeholder: string = "Select an option...";
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string = "";
  export let is_loading: boolean = false;

  let container_element: HTMLDivElement | null = null;
  let input_element: HTMLInputElement | null = null;

  let is_open: boolean = false;
  let query: string = "";
  let highlighted_index: number = 0;

  $: has_error = error.length > 0;
  $: select_id = `searchable-select-${name}`;
  $: list_id = `${select_id}-list`;
  $: filtered_options = filter_select_options(options, query);
  $: selected_option = find_select_option_by_value(options, value);
  $: should_show_label = label.trim().length > 0;

  function open_dropdown(): Promise<boolean> {
    if (disabled || is_loading) return Promise.resolve(false);
    is_open = true;
    query = "";
    highlighted_index = selected_option
      ? clamp_index(
          filtered_options.findIndex((o) => o.value === selected_option?.value),
          0,
          Math.max(0, filtered_options.length - 1),
        )
      : 0;

    return tick().then(() => {
      input_element?.focus();
      return true;
    });
  }

  function close_dropdown(): boolean {
    is_open = false;
    query = "";
    highlighted_index = 0;
    return true;
  }

  function commit_value(selected_value: string): boolean {
    value = selected_value;
    dispatch("change", { value: selected_value });
    close_dropdown();
    return true;
  }

  function handle_input_focus(): void {
    void open_dropdown();
  }

  function handle_input(event: Event): void {
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target) return;
    query = target.value;
    is_open = true;
    highlighted_index = 0;
  }

  function handle_keydown(event: KeyboardEvent): void {
    if (disabled || is_loading) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close_dropdown();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!is_open) {
        void open_dropdown();
        return;
      }
      highlighted_index = clamp_index(
        highlighted_index + 1,
        0,
        Math.max(0, filtered_options.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!is_open) {
        void open_dropdown();
        return;
      }
      highlighted_index = clamp_index(
        highlighted_index - 1,
        0,
        Math.max(0, filtered_options.length - 1),
      );
      return;
    }

    if (event.key === "Enter") {
      if (!is_open) {
        void open_dropdown();
        return;
      }
      event.preventDefault();
      const option = filtered_options[highlighted_index];
      if (!option) return;
      commit_value(option.value);
    }
  }

  function handle_option_click(option_value: string): boolean {
    return commit_value(option_value);
  }

  function handle_global_pointer_down(event: MouseEvent): void {
    const target_node = event.target as Node | null;
    if (!target_node) return;
    if (!container_element) return;
    if (container_element.contains(target_node)) return;
    if (!is_open) return;
    close_dropdown();
  }

  onMount(() => {
    window.addEventListener("mousedown", handle_global_pointer_down);
  });

  onDestroy(() => {
    window.removeEventListener("mousedown", handle_global_pointer_down);
  });

  function get_display_input_value(): string {
    if (is_open) return query;
    if (selected_option) return selected_option.label;
    return "";
  }
</script>

<div bind:this={container_element} class="space-y-1">
  {#if should_show_label}
    <label
      for={select_id}
      class="block text-sm font-medium text-accent-700 dark:text-accent-300"
    >
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}

  <div class="relative">
    {#if selected_option?.color_swatch && !is_open}
      <span
        class="absolute left-3 top-1/2 -translate-y-1/2 inline-block w-5 h-5 rounded border border-accent-300 dark:border-accent-600 z-10"
        style="background-color: {selected_option.color_swatch};"
      ></span>
    {/if}
    <input
      bind:this={input_element}
      id={select_id}
      {name}
      type="text"
      value={get_display_input_value()}
      placeholder={selected_option ? selected_option.label : placeholder}
      autocomplete="off"
      aria-invalid={has_error}
      aria-expanded={is_open}
      aria-controls={list_id}
      role="combobox"
      on:focus={handle_input_focus}
      on:input={handle_input}
      on:keydown={handle_keydown}
      disabled={disabled || is_loading}
      class="w-full py-2 border rounded-lg text-sm
             bg-white dark:bg-accent-800
             text-accent-900 dark:text-accent-100
             focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none
             disabled:bg-accent-100 dark:disabled:bg-accent-700 disabled:cursor-not-allowed
             {selected_option?.color_swatch && !is_open ? 'pl-11 pr-3' : 'px-3'}
             {has_error
        ? 'border-red-500'
        : 'border-accent-300 dark:border-accent-600'}"
    />

    <div
      class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
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
            d="M19 9l-7 7-7-7"
          />
        </svg>
      {/if}
    </div>

    {#if is_open}
      <div
        id={list_id}
        class="absolute z-[9999] mt-2 w-full max-h-64 overflow-auto rounded-lg border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 shadow-lg"
        role="listbox"
      >
        {#if filtered_options.length === 0}
          <div class="px-3 py-2 text-sm text-accent-600 dark:text-accent-400">
            No matches
          </div>
        {:else}
          {#each filtered_options as option, index (option.value)}
            <button
              type="button"
              class="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2
                     {index === highlighted_index
                ? 'bg-accent-100 dark:bg-accent-700'
                : 'bg-transparent'}
                     {option.value === value
                ? 'font-semibold text-accent-900 dark:text-accent-100'
                : 'text-accent-800 dark:text-accent-200'}"
              role="option"
              aria-selected={option.value === value}
              on:mouseenter={() => (highlighted_index = index)}
              on:click={() => handle_option_click(option.value)}
            >
              {#if option.color_swatch}
                <span
                  class="inline-block w-5 h-5 rounded border border-accent-300 dark:border-accent-600 flex-shrink-0"
                  style="background-color: {option.color_swatch};"
                ></span>
              {/if}
              {option.label}
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  {#if has_error}
    <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
  {/if}
</div>
