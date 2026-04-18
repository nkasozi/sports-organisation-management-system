<script lang="ts">
  import type { Sport } from "$lib/core/entities/Sport";
  import InfoTooltip from "$lib/presentation/components/ui/InfoTooltip.svelte";

  export let sport: Sport;
  export let current_max_substitutions: number = 0;
  export let current_rolling_substitutions: boolean = false;
  export let current_return_after_substitution: boolean = false;
  export let has_custom_substitutions: boolean = false;
  export let is_customizing_substitutions: boolean = false;
  export let on_customize: () => void = () => {};
  export let on_reset: () => void = () => {};
  export let on_max_substitutions_change: (value: number) => void = () => {};
  export let on_rolling_substitutions_change: (
    value: boolean,
  ) => void = () => {};
  export let on_return_after_substitution_change: (
    value: boolean,
  ) => void = () => {};
</script>

<div class="border-b border-accent-200 dark:border-accent-700 pb-6">
  <div class="flex items-center justify-between mb-2">
    <div
      class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100"
    >
      Substitution Rules<InfoTooltip
        tooltip_text="Configure how player substitutions work during matches - limits, timing, and whether substituted players can return"
        position="right"
      />
    </div>
    {#if has_custom_substitutions}<span
      class="inline-flex items-center px-2 py-0.5 rounded-[0.175rem] text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
        >Custom</span
      >{/if}
  </div>

  <div
    class="flex flex-wrap items-center gap-4 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md"
  >
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2">
        <span class="text-sm text-accent-500 dark:text-accent-400"
          >Current:</span
        >
        <span class="text-lg font-semibold text-accent-900 dark:text-accent-100"
          >{current_max_substitutions} subs</span
        >
        {#if current_rolling_substitutions}<span
            class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            >Rolling</span
          >{/if}
        {#if current_return_after_substitution}<span
            class="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
            >Re-entry</span
          >{/if}
      </div>
    </div>
    <div class="text-accent-300 dark:text-accent-600">|</div>
    <div class="flex items-center gap-2">
      <span class="text-sm text-accent-500 dark:text-accent-400">Default:</span
      ><span class="text-sm text-accent-600 dark:text-accent-400"
        >{sport.substitution_rules.max_substitutions_per_game} subs</span
      >
    </div>
  </div>

  {#if !is_customizing_substitutions}
    <button
      type="button"
      on:click={on_customize}
      class="text-sm text-primary-600 hover:text-primary-700 font-medium"
      >Customize</button
    >
  {:else}
    <div class="space-y-3 mt-3">
      <div>
        <label
          class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
          for="max_subs_input"
          >Max Substitutions Per Game<InfoTooltip
            tooltip_text="Maximum number of player substitutions each team can make during a match"
            position="top"
          /></label
        >
        <input
          id="max_subs_input"
          type="number"
          value={current_max_substitutions}
          on:change={(event) =>
            on_max_substitutions_change(parseInt(event.currentTarget.value))}
          min={1}
          max={20}
          placeholder={sport.substitution_rules.max_substitutions_per_game.toString()}
          class="block w-full px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
        />
      </div>
      <div class="space-y-2">
        <label class="flex items-center gap-3 cursor-pointer"
          ><input
            type="checkbox"
            checked={current_rolling_substitutions}
            on:change={(event) =>
              on_rolling_substitutions_change(event.currentTarget.checked)}
            class="w-4 h-4 text-primary-600 rounded border-accent-300"
          /><span
            class="flex items-center gap-1 text-sm text-accent-700 dark:text-accent-300"
            >Rolling substitutions allowed<InfoTooltip
              tooltip_text="Players can be substituted freely at any stoppage without using official substitution breaks"
              position="top"
            /></span
          ></label
        >
        <label class="flex items-center gap-3 cursor-pointer"
          ><input
            type="checkbox"
            checked={current_return_after_substitution}
            on:change={(event) =>
              on_return_after_substitution_change(event.currentTarget.checked)}
            class="w-4 h-4 text-primary-600 rounded border-accent-300"
          /><span
            class="flex items-center gap-1 text-sm text-accent-700 dark:text-accent-300"
            >Allow returning to field after substitution<InfoTooltip
              tooltip_text="A player who has been substituted out can come back onto the field later in the match"
              position="top"
            /></span
          ></label
        >
      </div>
    </div>
    <button
      type="button"
      on:click={on_reset}
      class="text-sm text-accent-600 hover:text-accent-700 underline mt-3"
      >Reset to Default</button
    >
  {/if}
</div>
