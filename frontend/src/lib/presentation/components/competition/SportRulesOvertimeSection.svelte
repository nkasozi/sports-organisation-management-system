<script lang="ts">
  import InfoTooltip from "$lib/presentation/components/ui/InfoTooltip.svelte";

  export let current_overtime_enabled: boolean = false;
  export let default_overtime_enabled: boolean = false;
  export let default_overtime_type: string | undefined = undefined;
  export let has_custom_overtime: boolean = false;
  export let is_customizing_overtime: boolean = false;
  export let on_customize: () => void = () => {};
  export let on_reset: () => void = () => {};
  export let on_overtime_enabled_change: (value: boolean) => void = () => {};
</script>

<div>
  <div class="flex items-center justify-between mb-2">
    <div
      class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100"
    >
      Overtime Rules<InfoTooltip
        tooltip_text="Configure whether extra time is played when matches end in a draw, and how that overtime period works"
        position="right"
      />
    </div>
    {#if has_custom_overtime}<span
      class="inline-flex items-center px-2 py-0.5 rounded-[0.175rem] text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
        >Custom</span
      >{/if}
  </div>

  <div
    class="flex flex-wrap items-center gap-4 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md"
  >
    <div class="flex items-center gap-2">
      <span class="text-sm text-accent-500 dark:text-accent-400">Current:</span
      ><span class="text-lg font-semibold text-accent-900 dark:text-accent-100"
        >{current_overtime_enabled ? "Enabled" : "Disabled"}</span
      >
    </div>
    <div class="text-accent-300 dark:text-accent-600">|</div>
    <div class="flex items-center gap-2">
      <span class="text-sm text-accent-500 dark:text-accent-400">Default:</span
      ><span class="text-sm text-accent-600 dark:text-accent-400"
        >{default_overtime_enabled ? "Enabled" : "Disabled"} ({default_overtime_type})</span
      >
    </div>
  </div>

  {#if !is_customizing_overtime}
    <button
      type="button"
      on:click={on_customize}
      class="text-sm text-primary-600 hover:text-primary-700 font-medium"
      >Customize</button
    >
  {:else}
    <div class="space-y-3 mt-3">
      <label class="flex items-center gap-3 cursor-pointer"
        ><input
          type="checkbox"
          checked={current_overtime_enabled}
          on:change={(event) =>
            on_overtime_enabled_change(event.currentTarget.checked)}
          class="w-4 h-4 text-primary-600 rounded border-accent-300"
        /><span
          class="flex items-center gap-1 text-sm text-accent-700 dark:text-accent-300"
          >Enable overtime<InfoTooltip
            tooltip_text="When enabled, extra time will be played if the match ends in a draw during knockout stages"
            position="top"
          /></span
        ></label
      >
    </div>
    <button
      type="button"
      on:click={on_reset}
      class="text-sm text-accent-600 hover:text-accent-700 underline mt-3"
      >Reset to Default</button
    >
  {/if}
</div>
