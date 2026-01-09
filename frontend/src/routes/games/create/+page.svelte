<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Competition } from "$lib/domain/entities/Competition";
  import type { Team } from "$lib/domain/entities/Team";
  import type { CompetitionTeam } from "$lib/domain/entities/CompetitionTeam";
  import type { Official } from "$lib/domain/entities/Official";
  import type { GameOfficialRole } from "$lib/domain/entities/GameOfficialRole";
  import type {
    CreateFixtureInput,
    AssignedOfficial,
  } from "$lib/domain/entities/Fixture";
  import type { SelectOption } from "$lib/components/ui/SelectField.svelte";
  import { create_empty_fixture_input } from "$lib/domain/entities/Fixture";
  import { get_fixture_use_cases } from "$lib/usecases/FixtureUseCases";
  import { get_competition_use_cases } from "$lib/usecases/CompetitionUseCases";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import { get_competition_team_use_cases } from "$lib/usecases/CompetitionTeamUseCases";
  import { get_official_use_cases } from "$lib/usecases/OfficialUseCases";
  import { get_game_official_role_use_cases } from "$lib/usecases/GameOfficialRoleUseCases";
  import FormField from "$lib/components/ui/FormField.svelte";
  import SelectField from "$lib/components/ui/SelectField.svelte";
  import FixtureOfficialAssignment from "$lib/components/ui/FixtureOfficialAssignment.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const fixture_use_cases = get_fixture_use_cases();
  const competition_use_cases = get_competition_use_cases();
  const team_use_cases = get_team_use_cases();
  const competition_team_use_cases = get_competition_team_use_cases();
  const official_use_cases = get_official_use_cases();
  const official_role_use_cases = get_game_official_role_use_cases();

  let form_data: CreateFixtureInput = create_empty_fixture_input();
  let competitions: Competition[] = [];
  let teams: Team[] = [];
  let competition_teams: CompetitionTeam[] = [];
  let available_officials: Official[] = [];
  let available_roles: GameOfficialRole[] = [];
  let competition_options: SelectOption[] = [];
  let team_options: SelectOption[] = [];
  let is_loading: boolean = true;
  let is_saving: boolean = false;
  let errors: Record<string, string> = {};

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  const status_options: SelectOption[] = [
    { value: "scheduled", label: "Scheduled" },
    { value: "postponed", label: "Postponed" },
  ];

  onMount(async () => {
    await load_reference_data();
  });

  async function load_reference_data(): Promise<void> {
    is_loading = true;

    const [comp_result, teams_result, officials_result, roles_result] =
      await Promise.all([
        competition_use_cases.list_competitions(undefined, { page_size: 100 }),
        team_use_cases.list_teams(undefined, { page_size: 200 }),
        official_use_cases.list_officials(undefined, { page_size: 200 }),
        official_role_use_cases.list_roles(undefined, { page_size: 100 }),
      ]);

    if (comp_result.success) {
      competitions = comp_result.data.items;
      competition_options = competitions.map((c) => ({
        value: c.id,
        label: c.name,
      }));
    }

    if (teams_result.success) {
      teams = teams_result.data.items;
      update_team_options();
    }

    if (officials_result.success) {
      available_officials = officials_result.data.items.filter(
        (o) => o.status === "active"
      );
    }

    if (roles_result.success) {
      available_roles = roles_result.data.items.filter(
        (r) => r.status === "active"
      );
    }

    is_loading = false;
  }

  async function update_team_options(): Promise<void> {
    if (!form_data.competition_id) {
      team_options = teams.map((t) => ({
        value: t.id,
        label: t.name,
      }));
      return;
    }

    const comp_teams_result =
      await competition_team_use_cases.list_teams_in_competition(
        form_data.competition_id,
        { page_size: 100 }
      );

    if (!comp_teams_result.success) {
      team_options = teams.map((t) => ({
        value: t.id,
        label: t.name,
      }));
      return;
    }

    competition_teams = comp_teams_result.data.items;
    const team_ids_in_competition = new Set(
      competition_teams.map((ct) => ct.team_id)
    );
    const filtered_teams = teams.filter((t) =>
      team_ids_in_competition.has(t.id)
    );

    team_options = filtered_teams.map((t) => ({
      value: t.id,
      label: t.name,
    }));
  }

  async function handle_competition_change(
    event: CustomEvent<{ value: string }>
  ): Promise<void> {
    form_data.competition_id = event.detail.value;
    form_data.home_team_id = "";
    form_data.away_team_id = "";
    await update_team_options();
  }

  function handle_home_team_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.home_team_id = event.detail.value;
  }

  function handle_away_team_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.away_team_id = event.detail.value;
  }

  function handle_status_change(event: CustomEvent<{ value: string }>): void {
    form_data.status = event.detail.value as "scheduled" | "postponed";
  }

  function handle_officials_change(
    event: CustomEvent<AssignedOfficial[]>
  ): void {
    form_data.assigned_officials = event.detail;
  }

  async function handle_submit(): Promise<void> {
    errors = {};
    is_saving = true;

    const result = await fixture_use_cases.create_fixture(form_data);

    if (!result.success) {
      is_saving = false;
      show_toast(result.error, "error");
      return;
    }

    is_saving = false;
    show_toast("Fixture created successfully!", "success");

    setTimeout(() => {
      goto("/games");
    }, 1500);
  }

  function handle_cancel(): void {
    goto("/games");
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
  <title>Create Fixture - Sports Management</title>
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
        Create Fixture
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400">
        Schedule a new match between two teams
      </p>
    </div>
  </div>

  {#if is_loading}
    <div class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"
      ></div>
    </div>
  {:else}
    <form
      on:submit|preventDefault={handle_submit}
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
    >
      <div class="p-6 space-y-6">
        <div class="border-b border-accent-200 dark:border-accent-700 pb-4">
          <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Match Details
          </h2>
        </div>

        <SelectField
          name="competition_id"
          label="Competition"
          placeholder="Select a competition"
          options={competition_options}
          value={form_data.competition_id}
          required
          error={errors.competition_id}
          on:change={handle_competition_change}
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            name="home_team_id"
            label="Home Team"
            placeholder="Select home team"
            options={team_options.filter(
              (t) => t.value !== form_data.away_team_id
            )}
            value={form_data.home_team_id}
            required
            error={errors.home_team_id}
            disabled={!form_data.competition_id}
            on:change={handle_home_team_change}
          />

          <SelectField
            name="away_team_id"
            label="Away Team"
            placeholder="Select away team"
            options={team_options.filter(
              (t) => t.value !== form_data.home_team_id
            )}
            value={form_data.away_team_id}
            required
            error={errors.away_team_id}
            disabled={!form_data.competition_id}
            on:change={handle_away_team_change}
          />
        </div>

        <div
          class="border-b border-accent-200 dark:border-accent-700 pb-4 pt-4"
        >
          <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Schedule
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            name="scheduled_date"
            label="Date"
            type="date"
            bind:value={form_data.scheduled_date}
            required
            error={errors.scheduled_date}
          />

          <FormField
            name="scheduled_time"
            label="Time"
            type="time"
            bind:value={form_data.scheduled_time}
            required
            error={errors.scheduled_time}
          />
        </div>

        <FormField
          name="venue"
          label="Venue"
          type="text"
          bind:value={form_data.venue}
          placeholder="Stadium or location name"
          error={errors.venue}
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            name="round_number"
            label="Round Number"
            type="number"
            bind:value={form_data.round_number}
            placeholder="1"
            error={errors.round_number}
          />

          <FormField
            name="round_name"
            label="Round Name"
            type="text"
            bind:value={form_data.round_name}
            placeholder="e.g., Matchday 1, Quarter Finals"
            error={errors.round_name}
          />
        </div>

        <SelectField
          name="status"
          label="Status"
          options={status_options}
          value={form_data.status}
          on:change={handle_status_change}
        />

        <div
          class="border-b border-accent-200 dark:border-accent-700 pb-4 pt-4"
        >
          <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Match Officials
          </h2>
          <p class="text-sm text-accent-500 dark:text-accent-400 mt-1">
            Assign referees and other officials to this fixture
          </p>
        </div>

        <FixtureOfficialAssignment
          assigned_officials={form_data.assigned_officials}
          {available_officials}
          {available_roles}
          disabled={is_saving}
          on:change={handle_officials_change}
        />

        <FormField
          name="notes"
          label="Notes"
          type="textarea"
          bind:value={form_data.notes}
          placeholder="Any additional notes about this fixture"
          error={errors.notes}
        />
      </div>

      <div
        class="px-6 py-4 bg-accent-50 dark:bg-accent-900/50 border-t border-accent-200 dark:border-accent-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3"
      >
        <button
          type="button"
          class="btn btn-outline w-full sm:w-auto"
          on:click={handle_cancel}
          disabled={is_saving}
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
            Create Fixture
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>

<Toast
  bind:is_visible={toast_visible}
  message={toast_message}
  type={toast_type}
  on:dismiss={() => (toast_visible = false)}
/>
