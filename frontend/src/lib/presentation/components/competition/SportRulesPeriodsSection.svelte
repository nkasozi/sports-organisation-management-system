<script lang="ts">
  import type { SportGamePeriod } from "$lib/core/entities/Sport";
  import type { ScalarInput } from "$lib/core/types/DomainScalars";
  import GamePeriodsEditor from "$lib/presentation/components/game/GamePeriodsEditor.svelte";
  import InfoTooltip from "$lib/presentation/components/ui/InfoTooltip.svelte";

  type EditableSportGamePeriod = ScalarInput<SportGamePeriod>;

  export let periods: EditableSportGamePeriod[] = [];
  export let current_summary: string = "";
  export let default_summary: string = "";
  export let has_custom_periods: boolean = false;
  export let is_customizing_periods: boolean = false;
  export let on_customize: () => void = () => {};
  export let on_periods_change: (periods: EditableSportGamePeriod[]) => void = () => {};
  export let on_reset: () => void = () => {};
</script>

<div class="border-b border-accent-200 dark:border-accent-700 pb-6">
  <div class="flex items-center justify-between mb-2">
    <div
      class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100"
    >
      Game Periods<InfoTooltip
        tooltip_text="Define how the game is divided into playing periods (halves, quarters, etc.) and break times between them"
        position="right"
      />
    </div>
    {#if has_custom_periods}<span
        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
        >Custom</span
      >{/if}
  </div>

  <div
    class="flex items-center gap-6 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md"
  >
    <div class="flex items-center gap-2">
      <span class="text-sm text-accent-500 dark:text-accent-400">Current:</span
      ><span class="text-lg font-semibold text-accent-900 dark:text-accent-100"
        >{current_summary}</span
      >
    </div>
    <div class="text-accent-300 dark:text-accent-600">|</div>
    <div class="flex items-center gap-2">
      <span class="text-sm text-accent-500 dark:text-accent-400">Default:</span
      ><span class="text-sm text-accent-600 dark:text-accent-400"
        >{default_summary}</span
      >
    </div>
  </div>

  {#if !is_customizing_periods}
    <button
      type="button"
      on:click={on_customize}
      class="text-sm text-primary-600 hover:text-primary-700 font-medium"
      >Customize</button
    >
  {:else}
    <div class="space-y-4 mt-4">
      <GamePeriodsEditor
        {periods}
        on:change={(event: CustomEvent) => on_periods_change(event.detail)}
      />
      <button
        type="button"
        on:click={on_reset}
        class="text-sm text-accent-600 hover:text-accent-700 underline"
        >Reset to Default</button
      >
    </div>
  {/if}
</div>
