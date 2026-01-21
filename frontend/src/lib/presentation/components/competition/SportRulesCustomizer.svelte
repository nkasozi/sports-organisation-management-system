<script lang="ts">
  import type { Sport } from "$lib/core/entities/Sport";
  import type { CompetitionRuleOverrides } from "$lib/core/entities/Competition";
  import FormField from "$lib/presentation/components/ui/FormField.svelte";

  export let sport: Sport | null = null;
  export let rule_overrides: CompetitionRuleOverrides = {};

  let is_customizing_duration: boolean = false;
  let is_customizing_squad_limits: boolean = false;
  let is_customizing_substitutions: boolean = false;
  let is_customizing_overtime: boolean = false;

  function get_game_duration(): number {
    return (
      rule_overrides.game_duration_minutes ??
      sport?.standard_game_duration_minutes ??
      90
    );
  }

  function get_max_players_on_field(): number {
    return (
      rule_overrides.max_players_on_field ?? sport?.max_players_on_field ?? 11
    );
  }

  function get_min_players_on_field(): number {
    return (
      rule_overrides.min_players_on_field ?? sport?.min_players_on_field ?? 7
    );
  }

  function get_max_squad_size(): number {
    return rule_overrides.max_squad_size ?? sport?.max_squad_size ?? 20;
  }

  function get_max_substitutions(): number {
    return (
      rule_overrides.substitution_rules?.max_substitutions_per_game ??
      sport?.substitution_rules.max_substitutions_per_game ??
      5
    );
  }

  function get_rolling_substitutions(): boolean {
    return (
      rule_overrides.substitution_rules?.rolling_substitutions_allowed ??
      sport?.substitution_rules.rolling_substitutions_allowed ??
      false
    );
  }

  function get_return_after_substitution(): boolean {
    return (
      rule_overrides.substitution_rules?.return_after_substitution_allowed ??
      sport?.substitution_rules.return_after_substitution_allowed ??
      false
    );
  }

  function get_overtime_enabled(): boolean {
    return (
      rule_overrides.overtime_rules?.is_enabled ??
      sport?.overtime_rules.is_enabled ??
      true
    );
  }

  function update_game_duration(value: number): void {
    rule_overrides.game_duration_minutes = value;
  }

  function update_max_players(value: number): void {
    rule_overrides.max_players_on_field = value;
  }

  function update_min_players(value: number): void {
    rule_overrides.min_players_on_field = value;
  }

  function update_max_squad(value: number): void {
    rule_overrides.max_squad_size = value;
  }

  function update_max_substitutions(value: number): void {
    if (!rule_overrides.substitution_rules) {
      rule_overrides.substitution_rules = {};
    }
    rule_overrides.substitution_rules.max_substitutions_per_game = value;
  }

  function update_rolling_substitutions(value: boolean): void {
    if (!rule_overrides.substitution_rules) {
      rule_overrides.substitution_rules = {};
    }
    rule_overrides.substitution_rules.rolling_substitutions_allowed = value;
  }

  function update_return_after_substitution(value: boolean): void {
    if (!rule_overrides.substitution_rules) {
      rule_overrides.substitution_rules = {};
    }
    rule_overrides.substitution_rules.return_after_substitution_allowed = value;
  }

  function update_overtime_enabled(value: boolean): void {
    if (!rule_overrides.overtime_rules) {
      rule_overrides.overtime_rules = {};
    }
    rule_overrides.overtime_rules.is_enabled = value;
  }

  function reset_game_duration(): void {
    rule_overrides.game_duration_minutes = undefined;
    is_customizing_duration = false;
  }

  function reset_squad_limits(): void {
    rule_overrides.max_players_on_field = undefined;
    rule_overrides.min_players_on_field = undefined;
    rule_overrides.max_squad_size = undefined;
    is_customizing_squad_limits = false;
  }

  function reset_substitutions(): void {
    rule_overrides.substitution_rules = undefined;
    is_customizing_substitutions = false;
  }

  function reset_overtime(): void {
    rule_overrides.overtime_rules = undefined;
    is_customizing_overtime = false;
  }
</script>

<div class="space-y-6">
  {#if !sport}
    <div
      class="flex items-start gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-blue-900"
    >
      <svg
        class="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        ><path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clip-rule="evenodd"
        /></svg
      >
      <div>
        <p class="text-sm font-medium">Select a sport to customize rules</p>
        <p class="text-sm text-blue-800">
          Choose a sport above to see and customize its rules for this
          competition.
        </p>
      </div>
    </div>
  {:else}
    <div class="border border-accent-200 dark:border-accent-700 rounded-lg p-6">
      <h3
        class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-6"
      >
        Customize Sport Rules <span class="text-primary-600">{sport.name}</span>
      </h3>

      <div class="space-y-6">
        <div class="border-b border-accent-200 dark:border-accent-700 pb-6">
          <div class="flex items-center justify-between mb-2">
            <div
              class="text-sm font-medium text-accent-900 dark:text-accent-100"
            >
              Game Duration
            </div>
            {#if rule_overrides.game_duration_minutes !== undefined}
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                Custom
              </span>
            {/if}
          </div>

          <div class="flex items-center gap-6 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md">
            <div class="flex items-center gap-2">
              <span class="text-sm text-accent-500 dark:text-accent-400">Current:</span>
              <span class="text-lg font-semibold text-accent-900 dark:text-accent-100">
                {get_game_duration()} min
              </span>
            </div>
            <div class="text-accent-300 dark:text-accent-600">|</div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-accent-500 dark:text-accent-400">Default:</span>
              <span class="text-sm text-accent-600 dark:text-accent-400">
                {sport?.standard_game_duration_minutes || 90} min
              </span>
            </div>
          </div>

          {#if !is_customizing_duration}
            <button
              type="button"
              on:click={() => (is_customizing_duration = true)}
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Customize
            </button>
          {:else}
            <div class="space-y-3 mt-3">
              <div>
                <label
                  class="block text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                  for="game_duration_input"
                >
                  Game Duration (minutes)
                </label>
                <input
                  id="game_duration_input"
                  type="number"
                  value={get_game_duration()}
                  on:change={(e) =>
                    update_game_duration(parseInt(e.currentTarget.value))}
                  min={1}
                  max={300}
                  class="block w-full px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                />
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  on:click={reset_game_duration}
                  class="text-sm text-accent-600 hover:text-accent-700 underline"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          {/if}
        </div>

        <div class="border-b border-accent-200 dark:border-accent-700 pb-6">
          <div class="flex items-center justify-between mb-2">
            <div
              class="text-sm font-medium text-accent-900 dark:text-accent-100"
            >
              Squad Size Limits
            </div>
            {#if rule_overrides.max_players_on_field !== undefined || rule_overrides.min_players_on_field !== undefined || rule_overrides.max_squad_size !== undefined}
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                Custom
              </span>
            {/if}
          </div>

          <div class="flex flex-wrap items-center gap-4 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md">
            <div class="flex items-center gap-2">
              <span class="text-sm text-accent-500 dark:text-accent-400">Current:</span>
              <span class="text-lg font-semibold text-accent-900 dark:text-accent-100">
                Max {get_max_players_on_field()} / Min {get_min_players_on_field()} / Squad {get_max_squad_size()}
              </span>
            </div>
            <div class="text-accent-300 dark:text-accent-600">|</div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-accent-500 dark:text-accent-400">Default:</span>
              <span class="text-sm text-accent-600 dark:text-accent-400">
                Max {sport?.max_players_on_field} / Min {sport?.min_players_on_field} / Squad {sport?.max_squad_size}
              </span>
            </div>
          </div>

          {#if !is_customizing_squad_limits}
            <button
              type="button"
              on:click={() => (is_customizing_squad_limits = true)}
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Customize
            </button>
          {:else}
            <div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  class="block text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                  for="max_on_field_input"
                >
                  Max on Field
                </label>
                <input
                  id="max_on_field_input"
                  type="number"
                  value={get_max_players_on_field()}
                  on:change={(e) =>
                    update_max_players(parseInt(e.currentTarget.value))}
                  min={1}
                  max={100}
                  placeholder={sport?.max_players_on_field.toString()}
                  class="block w-full px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                  for="min_on_field_input"
                >
                  Min on Field
                </label>
                <input
                  id="min_on_field_input"
                  type="number"
                  value={get_min_players_on_field()}
                  on:change={(e) =>
                    update_min_players(parseInt(e.currentTarget.value))}
                  min={1}
                  max={100}
                  placeholder={sport?.min_players_on_field.toString()}
                  class="block w-full px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                  for="max_squad_input"
                >
                  Max Squad Size
                </label>
                <input
                  id="max_squad_input"
                  type="number"
                  value={get_max_squad_size()}
                  on:change={(e) =>
                    update_max_squad(parseInt(e.currentTarget.value))}
                  min={1}
                  max={200}
                  placeholder={sport?.max_squad_size.toString()}
                  class="block w-full px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                />
              </div>
            </div>
            <button
              type="button"
              on:click={reset_squad_limits}
              class="text-sm text-accent-600 hover:text-accent-700 underline mt-3"
            >
              Reset to Default
            </button>
          {/if}
        </div>

        <div class="border-b border-accent-200 dark:border-accent-700 pb-6">
          <div class="flex items-center justify-between mb-2">
            <div
              class="text-sm font-medium text-accent-900 dark:text-accent-100"
            >
              Substitution Rules
            </div>
            {#if rule_overrides.substitution_rules}
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                Custom
              </span>
            {/if}
          </div>

          <div class="flex flex-wrap items-center gap-4 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="text-sm text-accent-500 dark:text-accent-400">Current:</span>
                <span class="text-lg font-semibold text-accent-900 dark:text-accent-100">
                  {get_max_substitutions()} subs
                </span>
                {#if get_rolling_substitutions()}
                  <span class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Rolling</span>
                {/if}
                {#if get_return_after_substitution()}
                  <span class="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Re-entry</span>
                {/if}
              </div>
            </div>
            <div class="text-accent-300 dark:text-accent-600">|</div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-accent-500 dark:text-accent-400">Default:</span>
              <span class="text-sm text-accent-600 dark:text-accent-400">
                {sport?.substitution_rules.max_substitutions_per_game} subs
              </span>
            </div>
          </div>

          {#if !is_customizing_substitutions}
            <button
              type="button"
              on:click={() => (is_customizing_substitutions = true)}
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Customize
            </button>
          {:else}
            <div class="space-y-3 mt-3">
              <div>
                <label
                  class="block text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                  for="max_subs_input"
                >
                  Max Substitutions Per Game
                </label>
                <input
                  id="max_subs_input"
                  type="number"
                  value={get_max_substitutions()}
                  on:change={(e) =>
                    update_max_substitutions(parseInt(e.currentTarget.value))}
                  min={1}
                  max={20}
                  placeholder={sport?.substitution_rules.max_substitutions_per_game.toString()}
                  class="block w-full px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                />
              </div>

              <div class="space-y-2">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={get_rolling_substitutions()}
                    on:change={(e) =>
                      update_rolling_substitutions(e.currentTarget.checked)}
                    class="w-4 h-4 text-primary-600 rounded border-accent-300"
                  />
                  <span class="text-sm text-accent-700 dark:text-accent-300">
                    Rolling substitutions allowed
                  </span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={get_return_after_substitution()}
                    on:change={(e) =>
                      update_return_after_substitution(e.currentTarget.checked)}
                    class="w-4 h-4 text-primary-600 rounded border-accent-300"
                  />
                  <span class="text-sm text-accent-700 dark:text-accent-300">
                    Allow returning to field after substitution
                  </span>
                </label>
              </div>
            </div>
            <button
              type="button"
              on:click={reset_substitutions}
              class="text-sm text-accent-600 hover:text-accent-700 underline mt-3"
            >
              Reset to Default
            </button>
          {/if}
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <div
              class="text-sm font-medium text-accent-900 dark:text-accent-100"
            >
              Overtime Rules
            </div>
            {#if rule_overrides.overtime_rules}
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                Custom
              </span>
            {/if}
          </div>

          <div class="flex flex-wrap items-center gap-4 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md">
            <div class="flex items-center gap-2">
              <span class="text-sm text-accent-500 dark:text-accent-400">Current:</span>
              <span class="text-lg font-semibold text-accent-900 dark:text-accent-100">
                {get_overtime_enabled() ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div class="text-accent-300 dark:text-accent-600">|</div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-accent-500 dark:text-accent-400">Default:</span>
              <span class="text-sm text-accent-600 dark:text-accent-400">
                {sport?.overtime_rules.is_enabled ? "Enabled" : "Disabled"} ({sport?.overtime_rules.overtime_type})
              </span>
            </div>
          </div>

          {#if !is_customizing_overtime}
            <button
              type="button"
              on:click={() => (is_customizing_overtime = true)}
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Customize
            </button>
          {:else}
            <div class="space-y-3 mt-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={get_overtime_enabled()}
                  on:change={(e) =>
                    update_overtime_enabled(e.currentTarget.checked)}
                  class="w-4 h-4 text-primary-600 rounded border-accent-300"
                />
                <span class="text-sm text-accent-700 dark:text-accent-300">
                  Enable overtime
                </span>
              </label>
            </div>
            <button
              type="button"
              on:click={reset_overtime}
              class="text-sm text-accent-600 hover:text-accent-700 underline mt-3"
            >
              Reset to Default
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
