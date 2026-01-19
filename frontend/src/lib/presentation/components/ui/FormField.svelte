<script lang="ts">
  export let label: string;
  export let name: string;
  export let value: string | number | null | undefined = "";
  export let type:
    | "text"
    | "email"
    | "tel"
    | "url"
    | "number"
    | "date"
    | "time"
    | "textarea" = "text";
  export let placeholder: string = "";
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string | undefined = "";
  export let hint: string = "";
  export let min: number | string | undefined = undefined;
  export let max: number | string | undefined = undefined;
  export let rows: number = 3;

  $: has_error = error && error.length > 0;
  $: input_id = `input-${name}`;
  $: display_value = value ?? "";
</script>

<div class="space-y-1">
  <label
    for={input_id}
    class="block text-sm font-medium text-accent-700 dark:text-accent-300"
  >
    {label}
    {#if required}
      <span class="text-red-500">*</span>
    {/if}
  </label>

  {#if type === "textarea"}
    <textarea
      id={input_id}
      {name}
      bind:value
      {placeholder}
      {required}
      {disabled}
      {rows}
      class="w-full px-3 py-2 border rounded-lg text-sm
             bg-white dark:bg-accent-800
             text-accent-900 dark:text-accent-100
             placeholder-accent-400 dark:placeholder-accent-500
             focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none
             disabled:bg-accent-100 dark:disabled:bg-accent-700 disabled:cursor-not-allowed
             {has_error
        ? 'border-red-500'
        : 'border-accent-300 dark:border-accent-600'}"
    ></textarea>
  {:else}
    <input
      id={input_id}
      {type}
      {name}
      bind:value
      {placeholder}
      {required}
      {disabled}
      {min}
      {max}
      class="w-full px-3 py-2 border rounded-lg text-sm
             bg-white dark:bg-accent-800
             text-accent-900 dark:text-accent-100
             placeholder-accent-400 dark:placeholder-accent-500
             focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none
             disabled:bg-accent-100 dark:disabled:bg-accent-700 disabled:cursor-not-allowed
             {has_error
        ? 'border-red-500'
        : 'border-accent-300 dark:border-accent-600'}"
    />
  {/if}

  {#if has_error}
    <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
  {:else if hint}
    <p class="text-sm text-accent-500 dark:text-accent-400">{hint}</p>
  {/if}
</div>
