<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import SearchableSelectField from "./SearchableSelectField.svelte";

  const dispatch = createEventDispatcher<{ change: { value: string } }>();

  export let label: string;
  export let name: string;
  export let value: string = "";
  export let options: { value: string; label: string }[] = [];
  export let placeholder: string = "Select an option...";
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string = "";

  function forward_change(event: CustomEvent<{ value: string }>): void {
    value = event.detail.value;
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
  on:change={forward_change}
/>
