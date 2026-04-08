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
    build_grouped_options,
    filter_select_options,
    find_select_option_by_value,
    focus_input_cursor_to_end,
    get_display_input_value,
    get_highlighted_index_for_selected_value,
    get_next_highlighted_index,
    type SelectOption as SelectOptionType,
    should_close_dropdown_from_pointer,
  } from "./searchable_select_logic";
  import SearchableSelectDropdown from "./SearchableSelectDropdown.svelte";
  import SearchableSelectInput from "./SearchableSelectInput.svelte";
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
  $: grouped_filtered_options = build_grouped_options(filtered_options);
  $: selected_option = find_select_option_by_value(options, value);
  $: should_show_label = label.trim().length > 0;

  $: if (input_element && !is_open) {
    input_element.value = selected_option ? selected_option.label : "";
  }
  function open_dropdown(): Promise<boolean> {
    if (disabled || is_loading) return Promise.resolve(false);
    is_open = true;
    query = "";
    highlighted_index = get_highlighted_index_for_selected_value(filtered_options, selected_option?.value ?? "");
    return tick().then(() => true);
  }
  function close_dropdown(): boolean {
    is_open = false;
    query = "";
    highlighted_index = 0;
    input_element?.blur();
    return true;
  }

  function commit_value(selected_value: string): boolean {
    value = selected_value;
    dispatch("change", { value: selected_value });
    close_dropdown();
    const chosen_option = find_select_option_by_value(options, selected_value);
    if (input_element) {
      input_element.value = chosen_option ? chosen_option.label : "";
    }
    return true;
  }
  function handle_input_mousedown(event: MouseEvent): void {
    if (disabled || is_loading) return;
    if (!is_open) {
      event.preventDefault();
      void open_dropdown();
      return;
    }
    void tick().then(() => focus_input_cursor_to_end(input_element));
  }
  function handle_input_focus(): void {
    if (!is_open) void open_dropdown();
    void tick().then(() => focus_input_cursor_to_end(input_element));
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
      highlighted_index = get_next_highlighted_index(
        highlighted_index,
        1,
        filtered_options.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!is_open) {
        void open_dropdown();
        return;
      }
      highlighted_index = get_next_highlighted_index(
        highlighted_index,
        -1,
        filtered_options.length,
      );
      return;
    }

    if (event.key === "Tab") {
      if (is_open) close_dropdown();
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
  function handle_global_pointer_down(event: MouseEvent): void {
    if (
      should_close_dropdown_from_pointer(
        container_element,
        event.target as Node | null,
        is_open,
      )
    )
      close_dropdown();
  }
  onMount(() => window.addEventListener("mousedown", handle_global_pointer_down));
  onDestroy(() => window.removeEventListener("mousedown", handle_global_pointer_down));
</script>

<div bind:this={container_element} class="space-y-1">
  <SearchableSelectInput
    bind:input_element
    {label}
    {required}
    {should_show_label}
    {select_id}
    {name}
    {selected_option}
    {placeholder}
    {has_error}
    {is_open}
    {disabled}
    {is_loading}
    {list_id}
    input_value={get_display_input_value(is_open, query, selected_option)}
    on_input_mousedown={handle_input_mousedown}
    on_input_focus={handle_input_focus}
    on_input={handle_input}
    on_keydown={handle_keydown}
  />

  <SearchableSelectDropdown
    {is_open}
    {list_id}
    filtered_options_length={filtered_options.length}
    {grouped_filtered_options}
    {highlighted_index}
    {value}
    on_highlight={(index: number) => (highlighted_index = index)}
    on_select={commit_value}
  />

  {#if has_error}
    <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
  {/if}
</div>
