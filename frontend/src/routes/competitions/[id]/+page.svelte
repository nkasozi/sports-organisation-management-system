<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type {
    Competition,
    UpdateCompetitionInput,
  } from "$lib/core/entities/Competition";
  import {
    derive_competition_status,
    get_competition_status_display,
  } from "$lib/core/entities/Competition";
  import type { Organization } from "$lib/core/entities/Organization";
  import type { Team } from "$lib/core/entities/Team";
  import type { Sport } from "$lib/core/entities/Sport";
  import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
  import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
  import type { LoadingState } from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
  import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
  import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
  import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
  import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_competition_team_use_cases } from "$lib/core/usecases/CompetitionTeamUseCases";
  import { get_competition_format_use_cases } from "$lib/core/usecases/CompetitionFormatUseCases";
  import { get_sport_by_id } from "$lib/adapters/services/sportService";
  import LoadingStateWrapper from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
  import FormField from "$lib/presentation/components/ui/FormField.svelte";
  import SelectField from "$lib/presentation/components/ui/SelectField.svelte";
  import Toast from "$lib/presentation/components/ui/Toast.svelte";
  import SportRulesCustomizer from "$lib/presentation/components/competition/SportRulesCustomizer.svelte";
  import DynamicEntityList from "$lib/presentation/components/DynamicEntityList.svelte";
  import InfoTooltip from "$lib/presentation/components/ui/InfoTooltip.svelte";
  import type { SquadGenerationStrategy } from "$lib/core/entities/Competition";

  const competition_use_cases = get_competition_use_cases();
  const organization_use_cases = get_organization_use_cases();
  const team_use_cases = get_team_use_cases();
  const competition_team_use_cases = get_competition_team_use_cases();
  const competition_format_use_cases = get_competition_format_use_cases();

  let competition: Competition | null = null;
  let organizations: Organization[] = [];
  let competition_formats: CompetitionFormat[] = [];
  let teams_in_competition: Team[] = [];
  let competition_team_entries: CompetitionTeam[] = [];
  let available_teams: Team[] = [];
  let selected_format: CompetitionFormat | null = null;
  let selected_sport: Sport | null = null;
  let form_data: UpdateCompetitionInput = {};
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let is_saving: boolean = false;
  let active_tab:
    | "details"
    | "teams"
    | "rules"
    | "settings"
    | "official_jerseys" = "details";

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  $: competition_id = $page.params.id ?? "";

  let organization_options: SelectOption[] = [];
  $: organization_options = organizations.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  let competition_format_options: SelectOption[] = [];
  $: competition_format_options = competition_formats.map((format) => ({
    value: format.id,
    label: format.name,
  }));

  $: derived_status =
    form_data.start_date && form_data.end_date
      ? derive_competition_status(form_data.start_date, form_data.end_date)
      : "upcoming";

  $: status_display = get_competition_status_display(derived_status);

  $: official_jersey_filter = {
    foreign_key_field: "holder_id",
    foreign_key_value: competition_id,
    holder_type_field: "holder_type",
    holder_type_value: "competition_official",
  } as SubEntityFilter;

  $: {
    if (
      (form_data.lineup_submission_deadline_hours ?? 0) > 0 &&
      !form_data.allow_auto_squad_submission
    ) {
      form_data.allow_auto_squad_submission = true;
    }
  }

  $: {
    if (
      form_data.allow_auto_squad_submission &&
      !form_data.squad_generation_strategy
    ) {
      form_data.squad_generation_strategy = "first_available";
    }
  }

  function handle_auto_squad_submission_toggle(enabled: boolean): void {
    form_data.allow_auto_squad_submission = enabled;
    if (!enabled) {
      form_data.lineup_submission_deadline_hours = 0;
    }
  }

  onMount(async () => {
    if (!competition_id) {
      loading_state = "error";
      error_message = "Competition ID is required";
      return;
    }
    await load_competition_data();
  });

  async function load_competition_data(): Promise<void> {
    loading_state = "loading";

    const [
      competition_result,
      org_result,
      teams_result,
      comp_teams_result,
      formats_result,
    ] = await Promise.all([
      competition_use_cases.get_by_id(competition_id),
      organization_use_cases.list(undefined, {
        page_number: 1,
        page_size: 100,
      }),
      team_use_cases.list(undefined, { page_number: 1, page_size: 100 }),
      competition_team_use_cases.list_teams_in_competition(competition_id, {
        page_number: 1,
        page_size: 100,
      }),
      competition_format_use_cases.list(undefined, {
        page_number: 1,
        page_size: 100,
      }),
    ]);

    if (!competition_result.success) {
      loading_state = "error";
      error_message =
        competition_result.error_message || "Failed to load competition";
      return;
    }

    if (!competition_result.data) {
      loading_state = "error";
      error_message = "Competition not found";
      return;
    }

    competition = competition_result.data;
    organizations = org_result.success ? org_result.data : [];
    competition_formats = formats_result.success
      ? formats_result.data.filter(
          (format: CompetitionFormat) => format.status === "active",
        )
      : [];

    if (competition) {
      selected_format =
        competition_formats.find(
          (format) => format.id === competition!.competition_format_id,
        ) || null;
    }

    const all_teams = teams_result.success ? teams_result.data : [];
    competition_team_entries = comp_teams_result.success
      ? comp_teams_result.data.items
      : [];

    const team_ids_in_competition = new Set(
      competition_team_entries.map((ct) => ct.team_id),
    );
    teams_in_competition = all_teams.filter((team: Team) =>
      team_ids_in_competition.has(team.id),
    );
    available_teams = all_teams.filter(
      (team: Team) =>
        team.organization_id === competition!.organization_id &&
        !team_ids_in_competition.has(team.id),
    );

    form_data = {
      name: competition.name,
      description: competition.description,
      organization_id: competition.organization_id,
      competition_format_id: competition.competition_format_id,
      team_ids: competition.team_ids || [],
      allow_auto_squad_submission:
        competition.allow_auto_squad_submission || false,
      allow_auto_fixture_details_setup:
        competition.allow_auto_fixture_details_setup || false,
      start_date: competition.start_date,
      end_date: competition.end_date,
      registration_deadline: competition.registration_deadline,
      max_teams: competition.max_teams,
      entry_fee: competition.entry_fee,
      prize_pool: competition.prize_pool,
      location: competition.location,
      rule_overrides: competition.rule_overrides || {},
    };

    const selected_organization = organizations.find(
      (org) => org.id === competition!.organization_id,
    );

    if (selected_organization && selected_organization.sport_id) {
      const sport_result = await get_sport_by_id(
        selected_organization.sport_id,
      );
      if (sport_result.success && sport_result.data) {
        selected_sport = sport_result.data;
      }
    }

    loading_state = "success";
  }

  async function handle_organization_change(
    event: CustomEvent<{ value: string }>,
  ): Promise<void> {
    form_data.organization_id = event.detail.value;
    available_teams = available_teams.filter(
      (team) => team.organization_id === form_data.organization_id,
    );

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

  async function handle_submit(): Promise<void> {
    is_saving = true;

    const result = await competition_use_cases.update(
      competition_id,
      form_data,
    );

    if (!result.success) {
      is_saving = false;
      show_toast(
        result.error_message || "Failed to update competition",
        "error",
      );
      return;
    }

    is_saving = false;
    show_toast("Competition updated successfully!", "success");
    setTimeout(() => goto("/competitions"), 1500);
  }

  async function handle_add_team_to_competition(team: Team): Promise<void> {
    const result = await competition_team_use_cases.add_team_to_competition({
      competition_id: competition_id,
      team_id: team.id,
      registration_date: new Date().toISOString().split("T")[0],
      seed_number: null,
      group_name: null,
      notes: "",
      status: "registered",
    });

    if (!result.success) {
      show_toast(
        `Failed to add team: ${result.error || "Unknown error"}`,
        "error",
      );
      return;
    }

    competition_team_entries = [...competition_team_entries, result.data];
    teams_in_competition = [...teams_in_competition, team];
    available_teams = available_teams.filter((t) => t.id !== team.id);
    show_toast(`${team.name} added to competition`, "success");
  }

  async function handle_remove_team_from_competition(
    team: Team,
  ): Promise<void> {
    const result =
      await competition_team_use_cases.remove_team_from_competition(
        competition_id,
        team.id,
      );

    if (!result.success) {
      show_toast(
        `Failed to remove team: ${result.error || "Unknown error"}`,
        "error",
      );
      return;
    }

    competition_team_entries = competition_team_entries.filter(
      (ct) => ct.team_id !== team.id,
    );
    available_teams = [...available_teams, team];
    teams_in_competition = teams_in_competition.filter((t) => t.id !== team.id);
    show_toast(`${team.name} removed from competition`, "success");
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

  function get_status_badge_classes(status: string): string {
    const base_classes =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case "active":
        return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case "upcoming":
        return `${base_classes} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      case "completed":
        return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case "cancelled":
        return `${base_classes} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return base_classes;
    }
  }
</script>

<svelte:head>
  <title>{competition?.name || "Edit Competition"} - Sports Management</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex flex-col w-full gap-0">
    <div class="flex items-center gap-4 w-full mb-0">
      <button
        type="button"
        class="btn btn-outline"
        on:click={handle_cancel}
        aria-label="Go back"
      >
        ← Back
      </button>
      <h1
        class="text-2xl sm:text-2xl font-bold text-accent-900 dark:text-accent-100"
      >
        {competition?.name || "Edit Competition"}
      </h1>
      {#if competition}
        <span class={get_status_badge_classes(derived_status)}>
          {status_display.label}
        </span>
      {/if}
    </div>
  </div>
  <div class="border-b border-accent-200 dark:border-accent-700 my-6"></div>
  <LoadingStateWrapper
    state={loading_state}
    {error_message}
    loading_text="Loading competition..."
  >
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
            'teams'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300 dark:text-accent-400 dark:hover:text-accent-200'}"
            on:click={() => (active_tab = "teams")}
          >
            Teams ({teams_in_competition.length}/{form_data.max_teams || 0})
          </button>
          <button
            type="button"
            class="px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap {active_tab ===
            'official_jerseys'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300 dark:text-accent-400 dark:hover:text-accent-200'}"
            on:click={() => (active_tab = "official_jerseys")}
          >
            Official Jerseys
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
          <button
            type="button"
            class="px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap {active_tab ===
            'settings'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300 dark:text-accent-400 dark:hover:text-accent-200'}"
            on:click={() => (active_tab = "settings")}
          >
            Settings
          </button>
        </nav>
      </div>

      <div class="p-6">
        {#if active_tab === "details"}
          <form on:submit|preventDefault={handle_submit}>
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="md:col-span-2">
                  <FormField
                    label="Competition Name"
                    name="name"
                    bind:value={form_data.name}
                    placeholder="Enter competition name"
                    required={true}
                  />
                </div>

                <SelectField
                  label="Organization"
                  name="organization_id"
                  value={form_data.organization_id ?? ""}
                  options={organization_options}
                  placeholder="Select an organization..."
                  required={true}
                  disabled={organization_options.length === 0}
                  on:change={handle_organization_change}
                />

                {#if organization_options.length === 0}
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
                        Create an organization to manage competitions.
                      </p>
                    </div>
                  </div>
                {/if}

                <SelectField
                  label="Competition Format"
                  name="competition_format_id"
                  value={form_data.competition_format_id ?? ""}
                  options={competition_format_options}
                  placeholder="Select a format..."
                  required={true}
                  disabled={!!(
                    competition?.competition_format_id &&
                    competition.competition_format_id.trim() &&
                    competition_format_options.some(
                      (opt) => opt.value === competition?.competition_format_id,
                    )
                  )}
                  on:change={handle_format_change}
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
            </div>

            <div
              class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3"
            >
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
                class="btn btn-primary-action w-full sm:w-auto"
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
                  Save Changes
                {/if}
              </button>
            </div>
          </form>
        {:else if active_tab === "teams"}
          <div class="space-y-6">
            <div>
              <h3
                class="text-lg font-medium text-accent-900 dark:text-accent-100 mb-4"
              >
                Teams in Competition ({teams_in_competition.length})
              </h3>
              {#if teams_in_competition.length === 0}
                <div
                  class="text-center py-8 border-2 border-dashed border-accent-200 dark:border-accent-700 rounded-lg"
                >
                  <svg
                    class="mx-auto h-10 w-10 text-accent-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
                    No teams registered yet
                  </p>
                </div>
              {:else}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {#each teams_in_competition as team}
                    <div
                      class="flex items-center justify-between p-3 bg-accent-50 dark:bg-accent-700/50 rounded-lg"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style="background-color: {team.primary_color}"
                        >
                          {team.name.charAt(0)}
                        </div>
                        <span
                          class="font-medium text-accent-900 dark:text-accent-100"
                          >{team.name}</span
                        >
                      </div>
                      <button
                        type="button"
                        class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                        on:click={() =>
                          handle_remove_team_from_competition(team)}
                        aria-label="Remove {team.name}"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <div class="border-t border-accent-200 dark:border-accent-700 pt-6">
              <h3
                class="text-lg font-medium text-accent-900 dark:text-accent-100 mb-4"
              >
                Available Teams ({available_teams.length})
              </h3>
              {#if available_teams.length === 0}
                <p class="text-sm text-accent-500 dark:text-accent-400">
                  No available teams from this organization. Create teams first.
                </p>
              {:else}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {#each available_teams as team}
                    <div
                      class="flex items-center justify-between p-3 border border-accent-200 dark:border-accent-600 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-700/30"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style="background-color: {team.primary_color}"
                        >
                          {team.name.charAt(0)}
                        </div>
                        <span
                          class="font-medium text-accent-900 dark:text-accent-100"
                          >{team.name}</span
                        >
                      </div>
                      <button
                        type="button"
                        class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 p-1"
                        disabled={teams_in_competition.length >=
                          (form_data.max_teams || 0)}
                        on:click={() => handle_add_team_to_competition(team)}
                        aria-label="Add {team.name}"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <div
              class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-accent-200 dark:border-accent-700 pt-6"
            >
              <button
                type="button"
                class="btn btn-outline w-full sm:w-auto"
                on:click={handle_cancel}
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary-action w-full sm:w-auto"
                on:click={() => {
                  show_toast("Team changes saved!", "success");
                  goto("/competitions");
                }}
              >
                Done
              </button>
            </div>
          </div>
        {:else if active_tab === "rules"}
          <form on:submit|preventDefault={handle_submit}>
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
              <div class="">
                <SportRulesCustomizer
                  sport={selected_sport}
                  bind:rule_overrides={form_data.rule_overrides}
                />
              </div>
            </div>

            <div
              class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-accent-200 dark:border-accent-700 pt-6"
            >
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
                class="btn btn-primary-action w-full sm:w-auto"
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
                  Save Rules
                {/if}
              </button>
            </div>
          </form>
        {:else if active_tab === "settings"}
          <form on:submit|preventDefault={handle_submit}>
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div
                  class="md:col-span-2 border-t border-accent-200 dark:border-accent-700 pt-6"
                >
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form_data.allow_auto_squad_submission}
                      on:change={(e) =>
                        handle_auto_squad_submission_toggle(
                          e.currentTarget.checked,
                        )}
                      class="w-5 h-5 text-primary-600 rounded border-accent-300"
                    />
                    <div>
                      <span
                        class="text-sm font-medium text-accent-900 dark:text-accent-100"
                      >
                        Allow auto squad submission
                      </span>
                      <p class="text-xs text-accent-500 dark:text-accent-400">
                        When enabled, starting a live game will automatically
                        generate squads from team rosters. When disabled, teams
                        must submit their squads before starting a game.
                      </p>
                    </div>
                  </label>
                </div>

                {#if form_data.allow_auto_squad_submission}
                  <div class="md:col-span-2 pl-8 space-y-4">
                    <div>
                      <label
                        class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                        for="squad_generation_strategy"
                      >
                        Squad Generation Strategy
                        <InfoTooltip
                          tooltip_text="How to select players for auto-generated squads: 'First Available' picks the first X team members alphabetically. 'Previous Match' uses the team's squad from their last match in this competition."
                          position="right"
                        />
                      </label>
                      <select
                        id="squad_generation_strategy"
                        bind:value={form_data.squad_generation_strategy}
                        class="block w-full sm:w-64 px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                      >
                        <option value="first_available"
                          >First Available Players</option
                        >
                        <option value="previous_match"
                          >Previous Match Squad</option
                        >
                      </select>
                      <p class="text-xs text-accent-500 mt-1">
                        {#if form_data.squad_generation_strategy === "first_available"}
                          Selects the first X players from the team roster
                          alphabetically
                        {:else}
                          Uses the team's squad from their previous match in
                          this competition. Falls back to first available if no
                          previous match exists.
                        {/if}
                      </p>
                    </div>

                    <div>
                      <label
                        class="flex items-center gap-1 text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                        for="lineup_submission_deadline_hours"
                      >
                        Lineup Submission Deadline (hours before match)
                        <InfoTooltip
                          tooltip_text="How many hours before match start time teams must submit their lineups. When set > 0, auto-submission must remain enabled to prevent soft locks where no lineup can be submitted after deadline."
                          position="right"
                        />
                      </label>
                      <input
                        id="lineup_submission_deadline_hours"
                        type="number"
                        bind:value={form_data.lineup_submission_deadline_hours}
                        min={0}
                        max={72}
                        class="block w-full sm:w-32 px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                      />
                      <p class="text-xs text-accent-500 mt-1">
                        Teams must submit lineups at least {form_data.lineup_submission_deadline_hours ??
                          0} hour{(form_data.lineup_submission_deadline_hours ??
                          0) !== 1
                          ? "s"
                          : ""} before match time.
                        {#if (form_data.lineup_submission_deadline_hours ?? 0) > 0}
                          <span class="text-amber-600 dark:text-amber-400">
                            Auto-submission is required when deadline is set.
                          </span>
                        {/if}
                      </p>
                    </div>
                  </div>
                {/if}

                <div class="md:col-span-2">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      bind:checked={form_data.allow_auto_fixture_details_setup}
                      class="w-5 h-5 text-primary-600 rounded border-accent-300"
                    />
                    <div>
                      <span
                        class="text-sm font-medium text-accent-900 dark:text-accent-100"
                      >
                        Allow auto fixture details setup
                      </span>
                      <p class="text-xs text-accent-500 dark:text-accent-400">
                        When enabled, starting a live game without fixture
                        details will redirect to auto-create them with
                        pre-filled officials and jersey colors.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div
              class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3"
            >
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
                class="btn btn-primary-action w-full sm:w-auto"
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
                  Save Settings
                {/if}
              </button>
            </div>
          </form>
        {:else if active_tab === "official_jerseys"}
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3
                  class="text-lg font-medium text-accent-900 dark:text-accent-100"
                >
                  Official Jersey Colors
                </h3>
                <p class="text-sm text-accent-500 dark:text-accent-400">
                  Configure the jersey color options for officials in this
                  competition
                </p>
              </div>
            </div>
            <DynamicEntityList
              entity_type="jerseycolor"
              sub_entity_filter={official_jersey_filter}
              show_actions={true}
            />
          </div>
        {/if}
      </div>
    </div>
  </LoadingStateWrapper>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
