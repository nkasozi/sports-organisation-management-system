<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { SportGamePeriod } from "$lib/core/entities/Sport";
  import type { ScalarInput } from "$lib/core/types/DomainScalars";
  import {
    append_game_break,
    append_game_period,
    build_game_period_editor_summary,
    build_game_period_preset,
    move_game_period_down,
    move_game_period_up,
    type PeriodPreset,
    remove_game_period,
    rename_game_period,
    set_game_period_duration,
  } from "$lib/presentation/logic/gamePeriodsEditorState";

  import GamePeriodsEditorRow from "./GamePeriodsEditorRow.svelte";

  type EditableSportGamePeriod = ScalarInput<SportGamePeriod>;

  export let periods: EditableSportGamePeriod[] = [];
  export let readonly: boolean = false;
  export let show_totals: boolean = true;

  const dispatch = createEventDispatcher<{
    change: EditableSportGamePeriod[];
  }>();

  function apply_change(next_periods: EditableSportGamePeriod[]): void {
    periods = next_periods;
    dispatch("change", periods);
  }

  function apply_preset(preset: PeriodPreset): void {
    apply_change(build_game_period_preset(preset));
  }
  $: summary = build_game_period_editor_summary(periods);
  $: sorted_periods = summary.sorted_periods;
  $: total_playing_time = summary.total_playing_time;
  $: total_break_time = summary.total_break_time;
  $: total_time = summary.total_time;
</script>

<div class="space-y-4">
  {#if show_totals}
    <div
      class="flex flex-wrap items-center gap-4 p-3 bg-accent-50 dark:bg-accent-800 rounded-lg"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm text-accent-500 dark:text-accent-400"
          >Playing Time:</span
        >
        <span class="font-semibold text-accent-900 dark:text-accent-100">
          {total_playing_time} min
        </span>
      </div>
      <div class="text-accent-300 dark:text-accent-600">|</div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-accent-500 dark:text-accent-400"
          >Break Time:</span
        >
        <span class="text-sm text-accent-600 dark:text-accent-400">
          {total_break_time} min
        </span>
      </div>
      <div class="text-accent-300 dark:text-accent-600">|</div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-accent-500 dark:text-accent-400">Total:</span>
        <span class="font-semibold text-accent-900 dark:text-accent-100">
          {total_time} min
        </span>
      </div>
    </div>
  {/if}

  {#if !readonly}
    <div class="flex flex-wrap gap-2">
      <span class="text-sm text-accent-500 dark:text-accent-400 self-center"
        >Quick Setup:</span
      >
      <button
        type="button"
        on:click={() => apply_preset("halves")}
        class="px-3 py-1 text-sm rounded-[0.175rem] bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-200 dark:hover:bg-accent-600 transition-colors"
      >
        2 Halves (90 min)
      </button>
      <button
        type="button"
        on:click={() => apply_preset("quarters")}
        class="px-3 py-1 text-sm rounded-[0.175rem] bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-200 dark:hover:bg-accent-600 transition-colors"
      >
        4 Quarters (48 min)
      </button>
      <button
        type="button"
        on:click={() => apply_preset("thirds")}
        class="px-3 py-1 text-sm rounded-[0.175rem] bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-200 dark:hover:bg-accent-600 transition-colors"
      >
        3 Periods (60 min)
      </button>
    </div>
  {/if}

  <div class="space-y-2">
    {#each sorted_periods as period, index (period.id)}
      <GamePeriodsEditorRow
        {index}
        {period}
        {readonly}
        is_first={index === 0}
        is_last={index === sorted_periods.length - 1}
        on_name_change={(period_id: string, name: string) =>
          apply_change(rename_game_period(periods, period_id, name))}
        on_duration_change={(period_id: string, duration_minutes: number) =>
          apply_change(
            set_game_period_duration(periods, period_id, duration_minutes),
          )}
        on_move_up={(period_id: string) =>
          apply_change(move_game_period_up(periods, period_id))}
        on_move_down={(period_id: string) =>
          apply_change(move_game_period_down(periods, period_id))}
        on_remove={(period_id: string) =>
          apply_change(remove_game_period(periods, period_id))}
      />
    {/each}
  </div>

  {#if !readonly}
    <div class="flex gap-2">
      <button
        type="button"
        on:click={() => apply_change(append_game_period(periods))}
        class="flex items-center gap-1 px-3 py-2 text-sm rounded-[0.175rem] bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Period
      </button>
      <button
        type="button"
        on:click={() => apply_change(append_game_break(periods))}
        class="flex items-center gap-1 px-3 py-2 text-sm rounded-[0.175rem] bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800 transition-colors"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Break
      </button>
    </div>
  {/if}

  {#if periods.length === 0}
    <div
      class="text-center py-6 text-accent-500 dark:text-accent-400 border-2 border-dashed border-accent-200 dark:border-accent-700 rounded-lg"
    >
      <svg
        class="w-8 h-8 mx-auto mb-2 text-accent-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p class="text-sm">No periods defined</p>
      {#if !readonly}
        <p class="text-xs mt-1">
          Use the quick setup buttons or add periods manually
        </p>
      {/if}
    </div>
  {/if}
</div>
