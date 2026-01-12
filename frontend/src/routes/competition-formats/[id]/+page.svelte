<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type {
    CompetitionFormat,
    UpdateCompetitionFormatInput,
  } from "$lib/domain/entities/CompetitionFormat";
  import {
    create_default_group_stage_config,
    create_default_knockout_stage_config,
    create_default_league_config,
    FORMAT_TYPE_OPTIONS,
    TIE_BREAKER_OPTIONS,
  } from "$lib/domain/entities/CompetitionFormat";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_competition_format_use_cases } from "$lib/usecases/CompetitionFormatUseCases";
  import FormField from "$lib/components/ui/FormField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const use_cases = get_competition_format_use_cases();

  let format: CompetitionFormat | null = null;
  let form_data: UpdateCompetitionFormatInput = {};
  let loading_state: LoadingState = "loading";
  let error_message: string = "";
  let is_submitting: boolean = false;
  let validation_errors: Map<string, string> = new Map();

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  $: format_id = $page.params.id;

  const status_options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const format_type_options = FORMAT_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  $: requires_group_config = form_data.format_type
    ? ["groups_knockout", "groups_playoffs"].includes(form_data.format_type)
    : false;
  $: requires_knockout_config = form_data.format_type
    ? ["groups_knockout", "straight_knockout", "double_elimination"].includes(
        form_data.format_type
      )
    : false;
  $: requires_league_config = form_data.format_type
    ? ["league", "round_robin"].includes(form_data.format_type)
    : false;

  onMount(async () => {
    await load_format();
  });

  async function load_format(): Promise<void> {
    if (!format_id) {
      error_message = "Format ID is required";
      loading_state = "error";
      return;
    }

    loading_state = "loading";

    const result = await use_cases.get_by_id(format_id);

    if (!result.success) {
      loading_state = "error";
      error_message = result.error_message || "Failed to load format";
      return;
    }

    if (!result.data) {
      loading_state = "error";
      error_message = "Format not found";
      return;
    }

    format = result.data;
    form_data = {
      name: format.name,
      code: format.code,
      description: format.description,
      format_type: format.format_type,
      tie_breakers: [...format.tie_breakers],
      group_stage_config: format.group_stage_config
        ? { ...format.group_stage_config }
        : null,
      knockout_stage_config: format.knockout_stage_config
        ? { ...format.knockout_stage_config }
        : null,
      league_config: format.league_config ? { ...format.league_config } : null,
      min_teams_required: format.min_teams_required,
      max_teams_allowed: format.max_teams_allowed,
      status: format.status,
    };
    loading_state = "success";
  }

  function handle_format_type_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.format_type = event.detail
      .value as CompetitionFormat["format_type"];

    if (requires_group_config && !form_data.group_stage_config) {
      form_data.group_stage_config = create_default_group_stage_config();
    }
    if (requires_knockout_config && !form_data.knockout_stage_config) {
      form_data.knockout_stage_config = create_default_knockout_stage_config();
    }
    if (requires_league_config && !form_data.league_config) {
      form_data.league_config = create_default_league_config();
    }
  }

  function toggle_tie_breaker(tie_breaker: string): void {
    if (!form_data.tie_breakers) form_data.tie_breakers = [];
    const index = form_data.tie_breakers.indexOf(tie_breaker as any);
    if (index > -1) {
      form_data.tie_breakers = form_data.tie_breakers.filter(
        (_, i) => i !== index
      );
    } else {
      form_data.tie_breakers = [...form_data.tie_breakers, tie_breaker as any];
    }
  }

  async function handle_submit(): Promise<void> {
    validation_errors = new Map();

    if (!form_data.name?.trim()) {
      validation_errors.set("name", "Format name is required");
    }
    if (!form_data.code?.trim()) {
      validation_errors.set("code", "Format code is required");
    }

    if (validation_errors.size > 0) {
      validation_errors = new Map(validation_errors);
      return;
    }

    if (!format_id) {
      show_toast("Format ID is required", "error");
      return;
    }

    if (!requires_group_config) form_data.group_stage_config = null;
    if (!requires_knockout_config) form_data.knockout_stage_config = null;
    if (!requires_league_config) form_data.league_config = null;

    is_submitting = true;

    const result = await use_cases.update(format_id, form_data);

    if (!result.success) {
      is_submitting = false;
      show_toast(result.error_message || "Failed to update format", "error");
      return;
    }

    show_toast("Competition format updated successfully", "success");
    setTimeout(() => goto("/competition-formats"), 1500);
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function navigate_back(): void {
    goto("/competition-formats");
  }

  function handle_status_change(event: CustomEvent<{ value: string }>): void {
    form_data.status = event.detail.value as CompetitionFormat["status"];
  }
</script>

<svelte:head>
  <title>Edit Competition Format - Sports Management</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="p-2 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-700"
      aria-label="Go back"
      on:click={navigate_back}
    >
      <svg
        class="h-5 w-5 text-accent-600 dark:text-accent-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
    </button>
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Edit Competition Format
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Modify tournament structure settings
      </p>
    </div>
  </div>

  <LoadingStateWrapper
    state={loading_state}
    loading_text="Loading format..."
    {error_message}
  >
    {#if format}
      <form
        class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 space-y-6"
        on:submit|preventDefault={handle_submit}
      >
        <div class="space-y-6">
          <h3
            class="text-lg font-semibold text-accent-900 dark:text-accent-100 border-b border-accent-200 dark:border-accent-700 pb-2"
          >
            Basic Information
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Format Name"
              name="name"
              bind:value={form_data.name}
              placeholder="e.g., Premier League Style"
              required={true}
              error={validation_errors.get("name")}
            />

            <FormField
              label="Format Code"
              name="code"
              bind:value={form_data.code}
              placeholder="e.g., premier_league_style"
              required={true}
              error={validation_errors.get("code")}
            />

            <div class="md:col-span-2">
              <FormField
                label="Description"
                name="description"
                type="textarea"
                bind:value={form_data.description}
                placeholder="Describe this competition format"
                rows={2}
              />
            </div>

            <EnumSelectField
              label="Format Type"
              name="format_type"
              value={form_data.format_type || "league"}
              options={format_type_options}
              required={true}
              on:change={handle_format_type_change}
            />

            <EnumSelectField
              label="Status"
              name="status"
              value={form_data.status || "active"}
              options={status_options}
              required={true}
              on:change={handle_status_change}
            />
          </div>
        </div>

        <div class="space-y-6">
          <h3
            class="text-lg font-semibold text-accent-900 dark:text-accent-100 border-b border-accent-200 dark:border-accent-700 pb-2"
          >
            Team Requirements
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Minimum Teams"
              name="min_teams_required"
              type="number"
              bind:value={form_data.min_teams_required}
              min={2}
              required={true}
            />

            <FormField
              label="Maximum Teams"
              name="max_teams_allowed"
              type="number"
              bind:value={form_data.max_teams_allowed}
              min={2}
              required={true}
            />
          </div>
        </div>

        <div class="space-y-4">
          <h3
            class="text-lg font-semibold text-accent-900 dark:text-accent-100 border-b border-accent-200 dark:border-accent-700 pb-2"
          >
            Tie Breakers (in order of priority)
          </h3>

          <div class="flex flex-wrap gap-2">
            {#each TIE_BREAKER_OPTIONS as option}
              <button
                type="button"
                class="px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all {(
                  form_data.tie_breakers || []
                ).includes(option.value)
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-accent-300 dark:border-accent-600 text-accent-700 dark:text-accent-300 hover:border-accent-400'}"
                on:click={() => toggle_tie_breaker(option.value)}
              >
                {option.label}
                {#if (form_data.tie_breakers || []).includes(option.value)}
                  <span class="ml-1 text-xs"
                    >({(form_data.tie_breakers || []).indexOf(option.value) +
                      1})</span
                  >
                {/if}
              </button>
            {/each}
          </div>
        </div>

        {#if requires_league_config && form_data.league_config}
          <div class="space-y-4">
            <h3
              class="text-lg font-semibold text-accent-900 dark:text-accent-100 border-b border-accent-200 dark:border-accent-700 pb-2"
            >
              League Configuration
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Number of Rounds"
                name="number_of_rounds"
                type="number"
                bind:value={form_data.league_config.number_of_rounds}
                min={1}
                max={4}
              />

              <FormField
                label="Points for Win"
                name="points_for_win"
                type="number"
                bind:value={form_data.league_config.points_for_win}
                min={0}
              />

              <FormField
                label="Points for Draw"
                name="points_for_draw"
                type="number"
                bind:value={form_data.league_config.points_for_draw}
                min={0}
              />

              <FormField
                label="Points for Loss"
                name="points_for_loss"
                type="number"
                bind:value={form_data.league_config.points_for_loss}
                min={0}
              />

              <FormField
                label="Promotion Spots"
                name="promotion_spots"
                type="number"
                bind:value={form_data.league_config.promotion_spots}
                min={0}
              />

              <FormField
                label="Relegation Spots"
                name="relegation_spots"
                type="number"
                bind:value={form_data.league_config.relegation_spots}
                min={0}
              />
            </div>
          </div>
        {/if}

        {#if requires_group_config && form_data.group_stage_config}
          <div class="space-y-4">
            <h3
              class="text-lg font-semibold text-accent-900 dark:text-accent-100 border-b border-accent-200 dark:border-accent-700 pb-2"
            >
              Group Stage Configuration
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Number of Groups"
                name="number_of_groups"
                type="number"
                bind:value={form_data.group_stage_config.number_of_groups}
                min={2}
                max={16}
              />

              <FormField
                label="Teams per Group"
                name="teams_per_group"
                type="number"
                bind:value={form_data.group_stage_config.teams_per_group}
                min={2}
                max={8}
              />

              <FormField
                label="Teams Advancing per Group"
                name="teams_advancing_per_group"
                type="number"
                bind:value={
                  form_data.group_stage_config.teams_advancing_per_group
                }
                min={1}
              />

              <FormField
                label="Matches per Round"
                name="matches_per_round"
                type="number"
                bind:value={form_data.group_stage_config.matches_per_round}
                min={1}
                max={2}
              />
            </div>
          </div>
        {/if}

        {#if requires_knockout_config && form_data.knockout_stage_config}
          <div class="space-y-4">
            <h3
              class="text-lg font-semibold text-accent-900 dark:text-accent-100 border-b border-accent-200 dark:border-accent-700 pb-2"
            >
              Knockout Stage Configuration
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Number of Rounds"
                name="knockout_rounds"
                type="number"
                bind:value={form_data.knockout_stage_config.number_of_rounds}
                min={1}
                max={7}
              />

              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="third_place_match"
                    bind:checked={
                      form_data.knockout_stage_config.third_place_match
                    }
                    class="w-4 h-4 text-primary-600 rounded border-accent-300"
                  />
                  <label
                    for="third_place_match"
                    class="text-sm text-accent-700 dark:text-accent-300"
                  >
                    Third Place Match
                  </label>
                </div>

                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="two_legged_ties"
                    bind:checked={
                      form_data.knockout_stage_config.two_legged_ties
                    }
                    class="w-4 h-4 text-primary-600 rounded border-accent-300"
                  />
                  <label
                    for="two_legged_ties"
                    class="text-sm text-accent-700 dark:text-accent-300"
                  >
                    Two-Legged Ties (Home & Away)
                  </label>
                </div>

                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="away_goals_rule"
                    bind:checked={
                      form_data.knockout_stage_config.away_goals_rule
                    }
                    class="w-4 h-4 text-primary-600 rounded border-accent-300"
                  />
                  <label
                    for="away_goals_rule"
                    class="text-sm text-accent-700 dark:text-accent-300"
                  >
                    Away Goals Rule
                  </label>
                </div>

                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="extra_time_enabled"
                    bind:checked={
                      form_data.knockout_stage_config.extra_time_enabled
                    }
                    class="w-4 h-4 text-primary-600 rounded border-accent-300"
                  />
                  <label
                    for="extra_time_enabled"
                    class="text-sm text-accent-700 dark:text-accent-300"
                  >
                    Extra Time
                  </label>
                </div>

                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="penalty_shootout_enabled"
                    bind:checked={
                      form_data.knockout_stage_config.penalty_shootout_enabled
                    }
                    class="w-4 h-4 text-primary-600 rounded border-accent-300"
                  />
                  <label
                    for="penalty_shootout_enabled"
                    class="text-sm text-accent-700 dark:text-accent-300"
                  >
                    Penalty Shootout
                  </label>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <div
          class="flex justify-end gap-3 pt-4 border-t border-accent-200 dark:border-accent-700"
        >
          <button
            type="button"
            class="btn btn-outline"
            disabled={is_submitting}
            on:click={navigate_back}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={is_submitting}
          >
            {#if is_submitting}
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            {:else}
              Save Changes
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </LoadingStateWrapper>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
