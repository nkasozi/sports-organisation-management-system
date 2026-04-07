<script lang="ts">
  import type { SelectOption } from "./searchable_select_logic";

  export let label: string = "";
  export let required: boolean = false;
  export let should_show_label: boolean = false;
  export let select_id: string;
  export let name: string;
  export let selected_option: SelectOption | null = null;
  export let placeholder: string = "";
  export let has_error: boolean = false;
  export let is_open: boolean = false;
  export let disabled: boolean = false;
  export let is_loading: boolean = false;
  export let list_id: string;
  export let input_value: string = "";
  export let input_element: HTMLInputElement | null = null;
  export let on_input_mousedown: (event: MouseEvent) => void;
  export let on_input_focus: () => void;
  export let on_input: (event: Event) => void;
  export let on_keydown: (event: KeyboardEvent) => void;
</script>

{#if should_show_label}
  <label
    for={select_id}
    class="block text-sm font-medium text-accent-700 dark:text-accent-300"
  >
    {label}
    {#if required}<span class="text-red-500">*</span>{/if}
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
    name="{name}_searchable_select"
    type="text"
    value={input_value}
    placeholder={selected_option ? selected_option.label : placeholder}
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    data-form-type="other"
    data-lpignore="true"
    data-1p-ignore="true"
    aria-invalid={has_error}
    aria-expanded={is_open}
    aria-controls={list_id}
    role="combobox"
    on:mousedown={on_input_mousedown}
    on:focus={on_input_focus}
    on:input={on_input}
    on:keydown={on_keydown}
    disabled={disabled || is_loading}
    class="w-full py-2 border rounded-lg text-sm cursor-pointer bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-accent-100 dark:disabled:bg-accent-700 disabled:cursor-not-allowed {selected_option?.color_swatch &&
    !is_open
      ? 'pl-11 pr-3'
      : 'px-3'} {has_error
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
</div>
