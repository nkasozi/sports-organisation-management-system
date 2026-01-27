<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Organization } from "$lib/core/entities/Organization";
  import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
  import type { Team } from "$lib/core/entities/Team";
  import type { Sport } from "$lib/core/entities/Sport";
  import type { CreateCompetitionInput } from "$lib/core/entities/Competition";
  import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
  import { create_empty_competition_input } from "$lib/core/entities/Competition";
  import { create_empty_competition_team_input } from "$lib/core/entities/CompetitionTeam";
  import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
  import { get_competition_team_use_cases } from "$lib/core/usecases/CompetitionTeamUseCases";
  import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
  import { get_competition_format_use_cases } from "$lib/core/usecases/CompetitionFormatUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_sport_by_id } from "$lib/adapters/services/sportService";
  import FormField from "$lib/presentation/components/ui/FormField.svelte";
  import SelectField from "$lib/presentation/components/ui/SelectField.svelte";
  import EnumSelectField from "$lib/presentation/components/ui/EnumSelectField.svelte";
  import Toast from "$lib/presentation/components/ui/Toast.svelte";
  import SportRulesCustomizer from "$lib/presentation/components/competition/SportRulesCustomizer.svelte";

  const competition_use_cases = get_competition_use_cases();
  const competition_team_use_cases = get_competition_team_use_cases();
  const organization_use_cases = get_organization_use_cases();
  const competition_format_use_cases = get_competition_format_use_cases();
  const team_use_cases = get_team_use_cases();

  let form_data: CreateCompetitionInput = create_empty_competition_input();
  let organizations: Organization[] = [];
  let competition_formats: CompetitionFormat[] = [];
  let all_teams: Team[] = [];
  let organization_options: SelectOption[] = [];
  let competition_format_options: SelectOption[] = [];
  let team_options: SelectOption[] = [];
  let selected_team_ids: Set<string> = new Set();
  let selected_format: CompetitionFormat | null = null;
  let selected_sport: Sport | null = null;
  let is_loading_organizations: boolean = true;
  let is_loading_formats: boolean = true;
  let is_loading_teams: boolean = true;
  let is_saving: boolean = false;
  let errors: Record<string, string> = {};
  let active_tab: "details" | "rules" = "details";

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  const status_options = [
    { value: "upcoming", label: "Upcoming" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  $: {
    form_data.team_ids = Array.from(selected_team_ids);
  }

  $: format_team_requirements = selected_format
    ? `Requires ${selected_format.min_teams_required} to ${selected_format.max_teams_allowed} teams`
    : "";

  $: is_team_count_valid =
    !selected_format ||
    (selected_team_ids.size >= selected_format.min_teams_required &&
      selected_team_ids.size <= selected_format.max_teams_allowed);

  onMount(async () => {
    await Promise.all([
      load_organizations(),
      load_competition_formats(),
      load_teams(),
    ]);
  });

  async function load_organizations(): Promise<void> {
    is_loading_organizations = true;
    const result = await organization_use_cases.list(undefined, {
      page_number: 1,
      page_size: 100,
    });

    if (result.success) {
      organizations = result.data;
      organization_options = organizations.map((org) => ({
        value: org.id,
        label: org.name,
      }));
    }
    is_loading_organizations = false;
  }

  async function load_competition_formats(): Promise<void> {
    is_loading_formats = true;
    const result = await competition_format_use_cases.list(undefined, {
      page_number: 1,
      page_size: 100,
    });

    if (result.success) {
      competition_formats = result.data.filter(
        (format: CompetitionFormat) => format.status === "active",
      );
      competition_format_options = competition_formats.map((format) => ({
        value: format.id,
        label: format.name,
      }));
    }
    is_loading_formats = false;
  }

  async function load_teams(): Promise<void> {
    is_loading_teams = true;
    const result = await team_use_cases.list(undefined, {
      page_number: 1,
      page_size: 200,
    });

    if (result.success) {
      all_teams = result.data;
      update_team_options();
    }
    is_loading_teams = false;
  }

  function update_team_options(): void {
    team_options = all_teams
      .filter((team) =>
        form_data.organization_id
          ? team.organization_id === form_data.organization_id
          : true,
      )
      .map((team) => ({
        value: team.id,
        label: team.name,
      }));
  }

  async function handle_organization_change(
    event: CustomEvent<{ value: string }>,
  ): Promise<void> {
    form_data.organization_id = event.detail.value;
    selected_team_ids.clear();
    update_team_options();

    form_data.rule_overrides = {};
    selected_sport = null;

    const selected_organization = organizations.find(
      (org) => org.id === form_data.organization_id,
    );

    if (selected_organization && selected_organization.sport_id) {
      const sport_result = await get_sport_by_id(
        selected_organization.sport_id,
      );
      if (sport_result.success && sport_result.data) {
        selected_sport = sport_result.data;
      }
    }
  }

  function handle_format_change(event: CustomEvent<{ value: string }>): void {
    form_data.competition_format_id = event.detail.value;
    selected_format =
      competition_formats.find(
        (format) => format.id === form_data.competition_format_id,
      ) || null;
  }

  function handle_team_toggle(team_id: string): boolean {
    const new_set = new Set(selected_team_ids);

    if (new_set.has(team_id)) {
      new_set.delete(team_id);
    } else {
      new_set.add(team_id);
    }

    selected_team_ids = new_set;
    return true;
  }

  async function create_competition_team_records(
    competition_id: string,
    team_ids: string[],
  ): Promise<boolean> {
    const registration_date = new Date().toISOString().split("T")[0];

    for (const team_id of team_ids) {
      const competition_team_input = create_empty_competition_team_input(
        competition_id,
        team_id,
      );
      competition_team_input.registration_date = registration_date;

      const result = await competition_team_use_cases.create(
        competition_team_input,
      );
      if (!result.success) {
        console.error(
          `[CompetitionCreate] Failed to create CompetitionTeam for team ${team_id}: ${result.error_message}`,
        );
        return false;
      }
    }
    return true;
  }

  async function handle_submit(): Promise<void> {
    errors = {};

    if (!is_team_count_valid) {
      show_toast(
        `Please select between ${selected_format?.min_teams_required} and ${selected_format?.max_teams_allowed} teams`,
        "error",
      );
      return;
    }

    is_saving = true;

    const result = await competition_use_cases.create(form_data);

    if (!result.success || !result.data) {
      is_saving = false;
      show_toast(
        result.error_message || "Failed to create competition",
        "error",
      );
      return;
    }

    const created_competition = result.data;

    const teams_created = await create_competition_team_records(
      created_competition.id,
      form_data.team_ids,
    );

    if (!teams_created) {
      is_saving = false;
      show_toast(
        "Competition created but failed to register some teams. Please add teams manually.",
        "error",
      );
      return;
    }

    is_saving = false;
    show_toast("Competition created successfully!", "success");

    setTimeout(() => {
      goto("/competitions");
    }, 1500);
  }

  function handle_cancel(): void {
    goto("/competitions");
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info",
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }
</script>

<svelte:head>
  <title>Create Competition - Sports Management</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700"
      on:click={handle_cancel}
      aria-label="Go back"
    >
      <svg
        class="h-5 w-5"
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
    <div class="flex-1">
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Create Competition
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Set up a new tournament, league, or championship
      </p>
    </div>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="border-b border-accent-200 dark:border-accent-700">
      <nav class="flex -mb-px overflow-x-auto" aria-label="Tabs">
        <button
          type="button"
          class="px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap {active_tab ===
          'details'
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300 dark:text-accent-400 dark:hover:text-accent-200'}"
          on:click={() => (active_tab = "details")}
        >
          Details
        </button>
        <button
          type="button"
          class="px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap {active_tab ===
          'rules'
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300 dark:text-accent-400 dark:hover:text-accent-200'}"
          on:click={() => (active_tab = "rules")}
        >
          Rules
        </button>
      </nav>
    </div>

    <form class="p-6 space-y-6" on:submit|preventDefault={handle_submit}>
      {#if active_tab === "details"}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <FormField
              label="Competition Name"
              name="name"
              bind:value={form_data.name}
              placeholder="Enter competition name"
              required={true}
              error={errors.name || ""}
            />
          </div>

          <SelectField
            label="Organization"
            name="organization_id"
            value={form_data.organization_id}
            options={organization_options}
            placeholder="Select an organization..."
            required={true}
            is_loading={is_loading_organizations}
            error={errors.organization_id || ""}
            disabled={organization_options.length === 0}
            on:change={handle_organization_change}
          />

          {#if !is_loading_organizations && organization_options.length === 0}
            <div
              class="md:col-span-2 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900"
            >
              <svg
                class="h-5 w-5 flex-shrink-0 text-yellow-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                ><path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.336-.213 3.005-1.742 3.005H3.48c-1.53 0-2.492-1.669-1.743-3.005L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                /></svg
              >
              <div>
                <p class="text-sm font-medium">No organizations found.</p>
                <p class="text-sm text-yellow-800">
                  Create an organization to continue creating a competition.
                </p>
              </div>
            </div>
          {/if}

          <SelectField
            label="Competition Format"
            name="competition_format_id"
            value={form_data.competition_format_id}
            options={competition_format_options}
            placeholder="Select a format..."
            required={true}
            is_loading={is_loading_formats}
            error={errors.competition_format_id || ""}
            disabled={competition_format_options.length === 0}
            on:change={handle_format_change}
          />

          {#if !is_loading_formats && competition_format_options.length === 0}
            <div
              class="md:col-span-2 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900"
            >
              <svg
                class="h-5 w-5 flex-shrink-0 text-yellow-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                ><path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.336-.213 3.005-1.742 3.005H3.48c-1.53 0-2.492-1.669-1.743-3.005L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                /></svg
              >
              <div>
                <p class="text-sm font-medium">
                  No competition formats available.
                </p>
                <p class="text-sm text-yellow-800">
                  Activate or create a competition format to proceed.
                </p>
              </div>
            </div>
          {/if}

          <EnumSelectField
            label="Status"
            name="status"
            bind:value={form_data.status}
            options={status_options}
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Start Date"
            name="start_date"
            type="date"
            bind:value={form_data.start_date}
            required={true}
          />

          <FormField
            label="End Date"
            name="end_date"
            type="date"
            bind:value={form_data.end_date}
            required={true}
          />

          <FormField
            label="Registration Deadline"
            name="registration_deadline"
            type="date"
            bind:value={form_data.registration_deadline}
          />

          <FormField
            label="Max Teams"
            name="max_teams"
            type="number"
            bind:value={form_data.max_teams}
            min={2}
            required={true}
          />
        </div>

        <div class="border-t border-accent-200 dark:border-accent-700 pt-6">
          <h3
            class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4"
          >
            Select Teams
          </h3>
          {#if format_team_requirements}
            <p
              class="text-sm text-accent-600 dark:text-accent-400 mb-4"
              class:text-red-600={!is_team_count_valid}
              class:dark:text-red-400={!is_team_count_valid}
            >
              {format_team_requirements} •
              {selected_team_ids.size} selected
            </p>
          {/if}

          {#if is_loading_teams}
            <div class="text-center py-8 text-accent-500">Loading teams...</div>
          {:else if team_options.length === 0}
            <div
              class="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900"
            >
              <svg
                class="h-5 w-5 flex-shrink-0 text-yellow-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                ><path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.336-.213 3.005-1.742 3.005H3.48c-1.53 0-2.492-1.669-1.743-3.005L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                /></svg
              >
              <div>
                <p class="text-sm font-medium">
                  No teams available for the selected organization.
                </p>
                <p class="text-sm text-yellow-800">
                  Create teams under the organization to add them here.
                </p>
              </div>
            </div>
          {:else}
            <div
              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-accent-50 dark:bg-accent-900/30 rounded-lg"
            >
              {#each team_options as team_option}
                <label
                  class="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent-100 dark:hover:bg-accent-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected_team_ids.has(team_option.value)}
                    on:change={() => handle_team_toggle(team_option.value)}
                    class="w-4 h-4 text-primary-600 rounded border-accent-300"
                  />
                  <span class="text-sm text-accent-700 dark:text-accent-300">
                    {team_option.label}
                  </span>
                </label>
              {/each}
            </div>
          {/if}
        </div>

        <div class="border-t border-accent-200 dark:border-accent-700 pt-6">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={form_data.allow_auto_squad_submission}
              class="w-5 h-5 text-primary-600 rounded border-accent-300"
            />
            <div>
              <span
                class="text-sm font-medium text-accent-900 dark:text-accent-100"
              >
                Allow auto squad submission
              </span>
              <p class="text-xs text-accent-500">
                When enabled, starting a live game will automatically generate
                squads from team rosters. When disabled, teams must submit their
                squads before starting a game.
              </p>
            </div>
          </label>
        </div>
      {:else if active_tab === "rules"}
        <div class="space-y-6">
          <div
            class="border-b border-accent-200 dark:border-accent-700 pb-4 mb-4"
          >
            <h2
              class="text-lg font-medium text-accent-900 dark:text-accent-100"
            >
              Sport Rules
            </h2>
            <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
              Customize competition-specific rules inherited from the sport
            </p>
          </div>
          {#if form_data.organization_id && selected_sport}
            <SportRulesCustomizer
              sport={selected_sport}
              bind:rule_overrides={form_data.rule_overrides}
            />
          {:else}
            <div
              class="rounded-lg border border-accent-200 dark:border-accent-700 p-4"
            >
              <p class="text-sm text-accent-600 dark:text-accent-400">
                Select an organization and sport to customize competition rules.
              </p>
            </div>
          {/if}
        </div>
      {/if}

      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          class="btn btn-outline"
          on:click={handle_cancel}
          disabled={is_saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary-action"
          disabled={is_saving}
        >
          {#if is_saving}
            <span class="flex items-center justify-center">
              <span
                class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"
              ></span>
              Saving...
            </span>
          {:else}
            Create Competition
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
