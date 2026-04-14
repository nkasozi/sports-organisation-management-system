<script lang="ts">
  import type { SportGamePeriod } from "$lib/core/entities/Sport";
  import type { ScalarInput } from "$lib/core/types/DomainScalars";

  type EditableSportGamePeriod = ScalarInput<SportGamePeriod>;

  interface $$Props {
    index: number;
    period: EditableSportGamePeriod;
    readonly: boolean;
    is_first: boolean;
    is_last: boolean;
    on_duration_change: (period_id: string, duration_minutes: number) => void;
    on_move_down: (period_id: string) => void;
    on_move_up: (period_id: string) => void;
    on_name_change: (period_id: string, name: string) => void;
    on_remove: (period_id: string) => void;
  }

  export let index: number;
  export let period: EditableSportGamePeriod;
  export let readonly: boolean;
  export let is_first: boolean;
  export let is_last: boolean;
  export let on_duration_change: (
    period_id: string,
    duration_minutes: number,
  ) => void;
  export let on_move_down: (period_id: string) => void;
  export let on_move_up: (period_id: string) => void;
  export let on_name_change: (period_id: string, name: string) => void;
  export let on_remove: (period_id: string) => void;
</script>

<div
  class="flex items-center gap-3 p-3 rounded-lg border {period.is_break
    ? 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20'
    : 'border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-900'}"
>
  <div
    class="flex flex-col items-center justify-center w-8 h-8 rounded-full {period.is_break
      ? 'bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300'
      : 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'} text-sm font-medium"
  >
    {index + 1}
  </div>

  <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
      {#if readonly}
        <span class="text-sm font-medium text-accent-900 dark:text-accent-100">
          {period.name}
        </span>
      {:else}
        <input
          type="text"
          value={period.name}
          on:change={(event) =>
            on_name_change(period.id, event.currentTarget.value)}
          placeholder="Period name"
          class="w-full px-2 py-1 text-sm border border-accent-300 dark:border-accent-600 rounded-md bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
      {/if}
    </div>

    <div class="flex items-center gap-2">
      {#if readonly}
        <span class="text-sm text-accent-600 dark:text-accent-400">
          {period.duration_minutes} min
        </span>
      {:else}
        <input
          type="number"
          value={period.duration_minutes}
          on:change={(event) =>
            on_duration_change(
              period.id,
              parseInt(event.currentTarget.value) || 1,
            )}
          min={1}
          max={120}
          class="w-20 px-2 py-1 text-sm border border-accent-300 dark:border-accent-600 rounded-md bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
        <span class="text-sm text-accent-500 dark:text-accent-400">min</span>
      {/if}

      {#if period.is_break}
        <span
          class="text-xs px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300"
        >
          Break
        </span>
      {:else}
        <span
          class="text-xs px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
        >
          Playing
        </span>
      {/if}
    </div>
  </div>

  {#if !readonly}
    <div class="flex items-center gap-1">
      <button
        type="button"
        on:click={() => on_move_up(period.id)}
        disabled={is_first}
        class="p-1 rounded hover:bg-accent-100 dark:hover:bg-accent-700 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Move up"
      >
        <svg
          class="w-4 h-4 text-accent-600 dark:text-accent-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>
      <button
        type="button"
        on:click={() => on_move_down(period.id)}
        disabled={is_last}
        class="p-1 rounded hover:bg-accent-100 dark:hover:bg-accent-700 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Move down"
      >
        <svg
          class="w-4 h-4 text-accent-600 dark:text-accent-400"
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
      </button>
      <button
        type="button"
        on:click={() => on_remove(period.id)}
        class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
        title="Remove"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  {/if}
</div>
