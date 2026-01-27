<script lang="ts">
  import type { SportGamePeriod } from "$lib/core/entities/Sport";
  import { createEventDispatcher } from "svelte";

  export let periods: SportGamePeriod[] = [];
  export let readonly: boolean = false;
  export let show_totals: boolean = true;

  const dispatch = createEventDispatcher<{
    change: SportGamePeriod[];
  }>();

  function generate_period_id(): string {
    return `period_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  function add_period(): void {
    const new_order =
      periods.length > 0 ? Math.max(...periods.map((p) => p.order)) + 1 : 1;
    const new_period: SportGamePeriod = {
      id: generate_period_id(),
      name: `Period ${new_order}`,
      duration_minutes: 15,
      is_break: false,
      order: new_order,
    };
    periods = [...periods, new_period];
    dispatch("change", periods);
  }

  function add_break(): void {
    const new_order =
      periods.length > 0 ? Math.max(...periods.map((p) => p.order)) + 1 : 1;
    const new_break: SportGamePeriod = {
      id: generate_period_id(),
      name: "Break",
      duration_minutes: 10,
      is_break: true,
      order: new_order,
    };
    periods = [...periods, new_break];
    dispatch("change", periods);
  }

  function remove_period(period_id: string): void {
    periods = periods.filter((p) => p.id !== period_id);
    reorder_periods();
    dispatch("change", periods);
  }

  function reorder_periods(): void {
    periods = periods
      .sort((a, b) => a.order - b.order)
      .map((p, index) => ({ ...p, order: index + 1 }));
  }

  function move_period_up(period_id: string): void {
    const current_index = periods.findIndex((p) => p.id === period_id);
    if (current_index <= 0) return;

    const temp = periods[current_index - 1].order;
    periods[current_index - 1].order = periods[current_index].order;
    periods[current_index].order = temp;
    reorder_periods();
    dispatch("change", periods);
  }

  function move_period_down(period_id: string): void {
    const current_index = periods.findIndex((p) => p.id === period_id);
    if (current_index < 0 || current_index >= periods.length - 1) return;

    const temp = periods[current_index + 1].order;
    periods[current_index + 1].order = periods[current_index].order;
    periods[current_index].order = temp;
    reorder_periods();
    dispatch("change", periods);
  }

  function update_period_name(period_id: string, name: string): void {
    periods = periods.map((p) => (p.id === period_id ? { ...p, name } : p));
    dispatch("change", periods);
  }

  function update_period_duration(
    period_id: string,
    duration_minutes: number,
  ): void {
    periods = periods.map((p) =>
      p.id === period_id ? { ...p, duration_minutes } : p,
    );
    dispatch("change", periods);
  }

  function get_total_playing_time(): number {
    return periods
      .filter((p) => !p.is_break)
      .reduce((sum, p) => sum + p.duration_minutes, 0);
  }

  function get_total_break_time(): number {
    return periods
      .filter((p) => p.is_break)
      .reduce((sum, p) => sum + p.duration_minutes, 0);
  }

  function get_sorted_periods(): SportGamePeriod[] {
    return [...periods].sort((a, b) => a.order - b.order);
  }

  function apply_preset(preset: "halves" | "quarters" | "thirds"): void {
    switch (preset) {
      case "halves":
        periods = [
          {
            id: "first_half",
            name: "First Half",
            duration_minutes: 45,
            is_break: false,
            order: 1,
          },
          {
            id: "half_time",
            name: "Half Time",
            duration_minutes: 15,
            is_break: true,
            order: 2,
          },
          {
            id: "second_half",
            name: "Second Half",
            duration_minutes: 45,
            is_break: false,
            order: 3,
          },
        ];
        break;
      case "quarters":
        periods = [
          {
            id: "first_quarter",
            name: "1st Quarter",
            duration_minutes: 12,
            is_break: false,
            order: 1,
          },
          {
            id: "break_1",
            name: "Break",
            duration_minutes: 2,
            is_break: true,
            order: 2,
          },
          {
            id: "second_quarter",
            name: "2nd Quarter",
            duration_minutes: 12,
            is_break: false,
            order: 3,
          },
          {
            id: "half_time",
            name: "Half Time",
            duration_minutes: 15,
            is_break: true,
            order: 4,
          },
          {
            id: "third_quarter",
            name: "3rd Quarter",
            duration_minutes: 12,
            is_break: false,
            order: 5,
          },
          {
            id: "break_2",
            name: "Break",
            duration_minutes: 2,
            is_break: true,
            order: 6,
          },
          {
            id: "fourth_quarter",
            name: "4th Quarter",
            duration_minutes: 12,
            is_break: false,
            order: 7,
          },
        ];
        break;
      case "thirds":
        periods = [
          {
            id: "first_period",
            name: "1st Period",
            duration_minutes: 20,
            is_break: false,
            order: 1,
          },
          {
            id: "break_1",
            name: "Intermission",
            duration_minutes: 15,
            is_break: true,
            order: 2,
          },
          {
            id: "second_period",
            name: "2nd Period",
            duration_minutes: 20,
            is_break: false,
            order: 3,
          },
          {
            id: "break_2",
            name: "Intermission",
            duration_minutes: 15,
            is_break: true,
            order: 4,
          },
          {
            id: "third_period",
            name: "3rd Period",
            duration_minutes: 20,
            is_break: false,
            order: 5,
          },
        ];
        break;
    }
    dispatch("change", periods);
  }

  $: sorted_periods = get_sorted_periods();
  $: total_playing_time = get_total_playing_time();
  $: total_break_time = get_total_break_time();
  $: total_time = total_playing_time + total_break_time;
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
        class="px-3 py-1 text-sm rounded-md bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-200 dark:hover:bg-accent-600 transition-colors"
      >
        2 Halves (90 min)
      </button>
      <button
        type="button"
        on:click={() => apply_preset("quarters")}
        class="px-3 py-1 text-sm rounded-md bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-200 dark:hover:bg-accent-600 transition-colors"
      >
        4 Quarters (48 min)
      </button>
      <button
        type="button"
        on:click={() => apply_preset("thirds")}
        class="px-3 py-1 text-sm rounded-md bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-200 dark:hover:bg-accent-600 transition-colors"
      >
        3 Periods (60 min)
      </button>
    </div>
  {/if}

  <div class="space-y-2">
    {#each sorted_periods as period, index (period.id)}
      <div
        class="flex items-center gap-3 p-3 rounded-lg border {period.is_break
          ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
          : 'border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-900'}"
      >
        <div
          class="flex flex-col items-center justify-center w-8 h-8 rounded-full {period.is_break
            ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
            : 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'} text-sm font-medium"
        >
          {index + 1}
        </div>

        <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            {#if readonly}
              <span
                class="text-sm font-medium text-accent-900 dark:text-accent-100"
              >
                {period.name}
              </span>
            {:else}
              <input
                type="text"
                value={period.name}
                on:change={(e) =>
                  update_period_name(period.id, e.currentTarget.value)}
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
                on:change={(e) =>
                  update_period_duration(
                    period.id,
                    parseInt(e.currentTarget.value) || 1,
                  )}
                min={1}
                max={120}
                class="w-20 px-2 py-1 text-sm border border-accent-300 dark:border-accent-600 rounded-md bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              <span class="text-sm text-accent-500 dark:text-accent-400"
                >min</span
              >
            {/if}

            {#if period.is_break}
              <span
                class="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
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
              on:click={() => move_period_up(period.id)}
              disabled={index === 0}
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
              on:click={() => move_period_down(period.id)}
              disabled={index === sorted_periods.length - 1}
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
              on:click={() => remove_period(period.id)}
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
    {/each}
  </div>

  {#if !readonly}
    <div class="flex gap-2">
      <button
        type="button"
        on:click={add_period}
        class="flex items-center gap-1 px-3 py-2 text-sm rounded-md bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
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
        on:click={add_break}
        class="flex items-center gap-1 px-3 py-2 text-sm rounded-md bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
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
