<script context="module" lang="ts">
  export interface SelectOption {
    value: string;
    label: string;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import SearchableSelectField from "./SearchableSelectField.svelte";

  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  export let label: string;
  export let name: string;
  export let value: string = "";
  export let options: SelectOption[] = [];
  export let placeholder: string = "Select an option...";
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string = "";
  export let is_loading: boolean = false;

  $: has_error = error && error.length > 0;
  $: select_id = `select-${name}`;

  function handle_change(event: Event): void {
    const target = event.target as HTMLSelectElement;
    dispatch("change", { value: target.value });
  }

  function forward_change(event: CustomEvent<{ value: string }>): void {
    dispatch("change", { value: event.detail.value });
  }
</script>

<SearchableSelectField
  {label}
  {name}
  {value}
  {options}
  {placeholder}
  {required}
  {disabled}
  {error}
  {is_loading}
  on:change={forward_change}
/>
