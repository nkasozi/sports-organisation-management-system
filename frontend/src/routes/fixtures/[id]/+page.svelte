<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type {
    Fixture,
    UpdateFixtureInput,
    AssignedOfficial,
  } from "$lib/domain/entities/Fixture";
  import type { Competition } from "$lib/domain/entities/Competition";
  import type { Team } from "$lib/domain/entities/Team";
  import type { CompetitionTeam } from "$lib/domain/entities/CompetitionTeam";
  import type { Official } from "$lib/domain/entities/Official";
  import type { GameOfficialRole } from "$lib/domain/entities/GameOfficialRole";
  import type { SelectOption } from "$lib/components/ui/SelectField.svelte";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_fixture_use_cases } from "$lib/usecases/FixtureUseCases";
  import { get_competition_use_cases } from "$lib/usecases/CompetitionUseCases";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import { get_competition_team_use_cases } from "$lib/usecases/CompetitionTeamUseCases";
  import { get_official_use_cases } from "$lib/usecases/OfficialUseCases";
  import { get_game_official_role_use_cases } from "$lib/usecases/GameOfficialRoleUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
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

  let fixture: Fixture | null = null;
  let form_data: UpdateFixtureInput = {};
  let competitions: Competition[] = [];
  let teams: Team[] = [];
  let competition_teams: CompetitionTeam[] = [];
  let available_officials: Official[] = [];
  let available_roles: GameOfficialRole[] = [];
  let competition_options: SelectOption[] = [];
  let team_options: SelectOption[] = [];
  let loading_state: LoadingState = "loading";
  let error_message: string = "";
  let is_saving: boolean = false;
  let errors: Record<string, string> = {};

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  const status_options: SelectOption[] = [
    { value: "scheduled", label: "Scheduled" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "postponed", label: "Postponed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  $: fixture_id = $page.params.id ?? "";

  onMount(async () => {
    if (!fixture_id) {
      loading_state = "error";
      error_message = "Fixture ID is required";
      return;
    }
    await load_fixture_data();
  });

  async function load_fixture_data(): Promise<void> {
    loading_state = "loading";

    const [
      fixture_result,
      competitions_result,
      teams_result,
      officials_result,
      roles_result,
    ] = await Promise.all([
      fixture_use_cases.get_by_id(fixture_id),
      competition_use_cases.list(undefined, { page: 1, page_size: 100 }),
      team_use_cases.list(undefined, { page: 1, page_size: 100 }),
      official_use_cases.list(undefined, { page: 1, page_size: 100 }),
      official_role_use_cases.list(undefined, { page: 1, page_size: 100 }),
    ]);

    if (!fixture_result.success || !fixture_result.data) {
      loading_state = "error";
      error_message = fixture_result.error_message || "Failed to load fixture";
      return;
    }

    fixture = fixture_result.data;
    competitions = competitions_result.success ? competitions_result.data : [];
    teams = teams_result.success ? teams_result.data : [];
    available_officials = officials_result.success ? officials_result.data : [];
    available_roles = roles_result.success ? roles_result.data : [];

    competition_options = competitions.map((c) => ({
      value: c.id,
      label: c.name,
    }));

    form_data = {
      competition_id: fixture.competition_id,
      home_team_id: fixture.home_team_id,
      away_team_id: fixture.away_team_id,
      scheduled_date: fixture.scheduled_date,
      scheduled_time: fixture.scheduled_time,
      venue: fixture.venue,
      round_number: fixture.round_number,
      assigned_officials: fixture.assigned_officials || [],
      status: fixture.status,
    };

    await update_team_options();
    loading_state = "success";
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
    form_data.status = event.detail.value as UpdateFixtureInput["status"];
  }

  function handle_officials_change(
    event: CustomEvent<AssignedOfficial[]>
  ): void {
    form_data.assigned_officials = event.detail;
  }

  async function handle_submit(): Promise<void> {
    errors = {};
    is_saving = true;

    const result = await fixture_use_cases.update(fixture_id, form_data);

    if (!result.success) {
      is_saving = false;
      show_toast(result.error_message || "Failed to update fixture", "error");
      return;
    }

    is_saving = false;
    show_toast("Fixture updated successfully!", "success");

    setTimeout(() => {
      goto("/fixtures");
    }, 1500);
  }

  function handle_cancel(): void {
    goto("/fixtures");
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_status_badge_classes(status: string): string {
    const base_classes =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case "scheduled":
        return `${base_classes} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      case "in_progress":
        return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case "completed":
        return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case "postponed":
        return `${base_classes} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case "cancelled":
        return `${base_classes} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return base_classes;
    }
  }
</script>

<svelte:head>
  <title
    >{fixture
      ? `Edit ${fixture.home_team_id} vs ${fixture.away_team_id}`
      : "Edit Fixture"} - Sports Management</title
  >
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
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
          Edit Fixture
        </h1>
        {#if fixture}
          <span class={get_status_badge_classes(fixture.status)}>
            {fixture.status}
          </span>
        {/if}
      </div>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Update match details and schedule
      </p>
    </div>
  </div>

  <LoadingStateWrapper
    state={loading_state}
    {error_message}
    loading_text="Loading fixture..."
  >
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
          value={form_data.competition_id || ""}
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
            value={form_data.home_team_id || ""}
            required
            error={errors.home_team_id}
            disabled={!form_data.competition_id || team_options.length === 0}
            on:change={handle_home_team_change}
          />

          <SelectField
            name="away_team_id"
            label="Away Team"
            placeholder="Select away team"
            options={team_options.filter(
              (t) => t.value !== form_data.home_team_id
            )}
            value={form_data.away_team_id || ""}
            required
            error={errors.away_team_id}
            disabled={!form_data.competition_id || team_options.length === 0}
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
          placeholder="Enter venue location"
          required
          error={errors.venue}
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            name="round_number"
            label="Round Number"
            type="number"
            bind:value={form_data.round_number}
            min={1}
            error={errors.round_number}
          />

          <SelectField
            name="status"
            label="Status"
            options={status_options}
            value={form_data.status || "scheduled"}
            on:change={handle_status_change}
          />
        </div>

        <div
          class="border-b border-accent-200 dark:border-accent-700 pb-4 pt-4"
        >
          <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Officials Assignment
          </h2>
        </div>

        <FixtureOfficialAssignment
          {available_officials}
          {available_roles}
          assigned_officials={form_data.assigned_officials || []}
          on:change={handle_officials_change}
        />
      </div>

      <div
        class="px-6 py-4 bg-accent-50 dark:bg-accent-900/20 rounded-b-lg flex justify-end gap-3"
      >
        <button
          type="button"
          class="btn btn-outline"
          on:click={handle_cancel}
          disabled={is_saving}
        >
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" disabled={is_saving}>
          {#if is_saving}
            <span class="flex items-center justify-center">
              <span
                class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"
              ></span>
              Saving...
            </span>
          {:else}
            Update Fixture
          {/if}
        </button>
      </div>
    </form>
  </LoadingStateWrapper>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
