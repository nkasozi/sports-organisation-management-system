<script lang="ts">
  import type { Sport } from "$lib/core/entities/Sport";
  import InfoTooltip from "$lib/presentation/components/ui/InfoTooltip.svelte";

  export let sport: Sport;
  export let current_max_players: number = 0;
  export let current_min_players: number = 0;
  export let current_max_squad: number = 0;
  export let has_custom_limits: boolean = false;
  export let is_customizing_squad_limits: boolean = false;
  export let on_customize: () => void = () => {};
  export let on_reset: () => void = () => {};
  export let on_max_players_change: (value: number) => void = () => {};
  export let on_min_players_change: (value: number) => void = () => {};
  export let on_max_squad_change: (value: number) => void = () => {};
</script>

<div class="border-b border-accent-200 dark:border-accent-700 pb-6">
  <div class="flex items-center justify-between mb-2">
    <div
      class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100"
    >
      Squad Size Limits<InfoTooltip
        tooltip_text="Control how many players can be on the field and in the match-day squad"
        position="right"
      />
    </div>
    {#if has_custom_limits}<span
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
        >Max {current_max_players} / Min {current_min_players} / Squad {current_max_squad}</span
      >
    </div>
    <div class="text-accent-300 dark:text-accent-600">|</div>
    <div class="flex items-center gap-2">
      <span class="text-sm text-accent-500 dark:text-accent-400">Default:</span
      ><span class="text-sm text-accent-600 dark:text-accent-400"
        >Max {sport.max_players_on_field} / Min {sport.min_players_on_field} / Squad
        {sport.max_squad_size}</span
      >
    </div>
  </div>

  {#if !is_customizing_squad_limits}
    <button
      type="button"
      on:click={on_customize}
      class="text-sm text-primary-600 hover:text-primary-700 font-medium"
      >Customize</button
    >
  {:else}
    <div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label
          class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
          for="max_on_field_input"
          >Max on Field<InfoTooltip
            tooltip_text="Maximum players allowed on the field at the same time for one team during active play"
            position="right"
          /></label
        >
        <input
          id="max_on_field_input"
          type="number"
          value={current_max_players}
          on:change={(event) =>
            on_max_players_change(parseInt(event.currentTarget.value))}
          min={1}
          max={100}
          placeholder={sport.max_players_on_field.toString()}
          class="block w-full px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
        />
      </div>
      <div>
        <label
          class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
          for="min_on_field_input"
          >Min on Field<InfoTooltip
            tooltip_text="Minimum players required on the field for a team to continue playing. Game cannot proceed if a team has fewer players"
            position="right"
          /></label
        >
        <input
          id="min_on_field_input"
          type="number"
          value={current_min_players}
          on:change={(event) =>
            on_min_players_change(parseInt(event.currentTarget.value))}
          min={1}
          max={100}
          placeholder={sport.min_players_on_field.toString()}
          class="block w-full px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
        />
      </div>
      <div>
        <label
          class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
          for="max_squad_input"
          >Max Squad Size<InfoTooltip
            tooltip_text="Total players a team can register for a match including substitutes. Auto-lineup uses this to select players"
            position="left"
          /></label
        >
        <input
          id="max_squad_input"
          type="number"
          value={current_max_squad}
          on:change={(event) =>
            on_max_squad_change(parseInt(event.currentTarget.value))}
          min={1}
          max={200}
          placeholder={sport.max_squad_size.toString()}
          class="block w-full px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
        />
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
