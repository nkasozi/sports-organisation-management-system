<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Organization } from "$lib/domain/entities/Organization";
  import type { CompetitionFormat } from "$lib/domain/entities/CompetitionFormat";
  import type { Team } from "$lib/domain/entities/Team";
  import type { CreateCompetitionInput } from "$lib/domain/entities/Competition";
  import type { SelectOption } from "$lib/components/ui/SelectField.svelte";
  import { create_empty_competition_input } from "$lib/domain/entities/Competition";
  import { get_competition_use_cases } from "$lib/usecases/CompetitionUseCases";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import { get_competition_format_use_cases } from "$lib/usecases/CompetitionFormatUseCases";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import FormField from "$lib/components/ui/FormField.svelte";
  import SelectField from "$lib/components/ui/SelectField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const competition_use_cases = get_competition_use_cases();
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
  let is_loading_organizations: boolean = true;
  let is_loading_formats: boolean = true;
  let is_loading_teams: boolean = true;
  let is_saving: boolean = false;
  let errors: Record<string, string> = {};

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  const status_options = [
    { value: "upcoming", label: "Upcoming" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const sport_type_options = [
    { value: "Football", label: "Football" },
    { value: "Basketball", label: "Basketball" },
    { value: "Cricket", label: "Cricket" },
    { value: "Rugby", label: "Rugby" },
    { value: "Tennis", label: "Tennis" },
    { value: "Hockey", label: "Hockey" },
    { value: "Volleyball", label: "Volleyball" },
    { value: "Other", label: "Other" },
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
    const result = await organization_use_cases.list_organizations(undefined, {
      page_size: 100,
    });

    if (result.success) {
      organizations = result.data.items;
      organization_options = organizations.map((org) => ({
        value: org.id,
        label: org.name,
      }));
    }
    is_loading_organizations = false;
  }

  async function load_competition_formats(): Promise<void> {
    is_loading_formats = true;
    const result = await competition_format_use_cases.list_formats(undefined, {
      page_size: 100,
    });

    if (result.success) {
      competition_formats = result.data.items.filter(
        (format: CompetitionFormat) => format.status === "active"
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
    const result = await team_use_cases.list_teams(undefined, {
      page_size: 200,
    });

    if (result.success) {
      all_teams = result.data.items;
      update_team_options();
    }
    is_loading_teams = false;
  }

  function update_team_options(): void {
    team_options = all_teams
      .filter((team) =>
        form_data.organization_id
          ? team.organization_id === form_data.organization_id
          : true
      )
      .map((team) => ({
        value: team.id,
        label: team.name,
      }));
  }

  function handle_organization_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.organization_id = event.detail.value;
    selected_team_ids.clear();
    update_team_options();
  }

  function handle_format_change(event: CustomEvent<{ value: string }>): void {
    form_data.competition_format_id = event.detail.value;
    selected_format =
      competition_formats.find(
        (format) => format.id === form_data.competition_format_id
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

  async function handle_submit(): Promise<void> {
    errors = {};

    if (!is_team_count_valid) {
      show_toast(
        `Please select between ${selected_format?.min_teams_required} and ${selected_format?.max_teams_allowed} teams`,
        "error"
      );
      return;
    }

    is_saving = true;

    const result = await competition_use_cases.create_competition(form_data);

    if (!result.success) {
      is_saving = false;
      show_toast(result.error, "error");
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
    type: "success" | "error" | "info"
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
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Create Competition
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400">
        Set up a new tournament, league, or championship
      </p>
    </div>
  </div>

  <form
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
    on:submit|preventDefault={handle_submit}
  >
    <div class="space-y-6">
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
          on:change={handle_organization_change}
        />

        <SelectField
          label="Competition Format"
          name="competition_format_id"
          value={form_data.competition_format_id}
          options={competition_format_options}
          placeholder="Select a format..."
          required={true}
          is_loading={is_loading_formats}
          error={errors.competition_format_id || ""}
          on:change={handle_format_change}
        />

        <EnumSelectField
          label="Sport Type"
          name="sport_type"
          bind:value={form_data.sport_type}
          options={sport_type_options}
          required={true}
        />

        <EnumSelectField
          label="Status"
          name="status"
          bind:value={form_data.status}
          options={status_options}
        />

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

        <FormField
          label="Entry Fee ($)"
          name="entry_fee"
          type="number"
          bind:value={form_data.entry_fee}
          min={0}
        />

        <FormField
          label="Prize Pool ($)"
          name="prize_pool"
          type="number"
          bind:value={form_data.prize_pool}
          min={0}
        />

        <div class="md:col-span-2">
          <FormField
            label="Location"
            name="location"
            bind:value={form_data.location}
            placeholder="Enter the competition location"
          />
        </div>

        <div class="md:col-span-2">
          <FormField
            label="Description"
            name="description"
            type="textarea"
            bind:value={form_data.description}
            placeholder="Enter a description of the competition"
            rows={3}
          />
        </div>
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
          <div class="text-center py-8 text-accent-500">
            No teams available for the selected organization
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
            bind:checked={form_data.auto_generate_fixtures_and_assign_officials}
            class="w-5 h-5 text-primary-600 rounded border-accent-300"
          />
          <div>
            <span
              class="text-sm font-medium text-accent-900 dark:text-accent-100"
            >
              Auto-generate fixtures and assign officials
            </span>
            <p class="text-xs text-accent-500 dark:text-accent-400">
              Automatically create fixtures and assign available officials when
              the competition starts
            </p>
          </div>
        </label>
      </div>
    </div>

    <div class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
      <button
        type="button"
        class="btn btn-outline w-full sm:w-auto"
        disabled={is_saving}
        on:click={handle_cancel}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary w-full sm:w-auto"
        disabled={is_saving}
      >
        {#if is_saving}
          <span class="flex items-center justify-center">
            <span
              class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"
            ></span>
            Creating...
          </span>
        {:else}
          Create Competition
        {/if}
      </button>
    </div>
  </form>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
