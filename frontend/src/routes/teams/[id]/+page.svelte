<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type { Team, UpdateTeamInput } from "$lib/domain/entities/Team";
  import type { Organization } from "$lib/domain/entities/Organization";
  import type { Venue } from "$lib/domain/entities/Venue";
  import type { TeamStaff } from "$lib/domain/entities/TeamStaff";
  import type { TeamStaffRole } from "$lib/domain/entities/TeamStaffRole";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import { get_venue_use_cases } from "$lib/usecases/VenueUseCases";
  import { get_team_staff_use_cases } from "$lib/usecases/TeamStaffUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import FormField from "$lib/components/ui/FormField.svelte";
  import SelectField from "$lib/components/ui/SelectField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import TeamStaffForm from "$lib/components/ui/TeamStaffForm.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const team_use_cases = get_team_use_cases();
  const organization_use_cases = get_organization_use_cases();
  const venue_use_cases = get_venue_use_cases();
  const team_staff_use_cases = get_team_staff_use_cases();

  let team: Team | null = null;
  let organizations: Organization[] = [];
  let venues: Venue[] = [];
  let staff_members: TeamStaff[] = [];
  let available_staff_roles: TeamStaffRole[] = [];
  let loading_state: LoadingState = "loading";
  let error_message: string = "";
  let is_submitting: boolean = false;
  let validation_errors: Map<string, string> = new Map();

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  let form_data: UpdateTeamInput = {
    name: "",
    short_name: "",
    organization_id: "",
    sport_type: "Football",
    primary_color: "#3B82F6",
    secondary_color: "#FFFFFF",
    home_venue_id: "",
    max_squad_size: 25,
    website: "",
    founded_year: undefined,
    status: "active",
  };

  const sport_type_options: Array<{ value: string; label: string }> = [
    { value: "Football", label: "Football" },
    { value: "Basketball", label: "Basketball" },
    { value: "Baseball", label: "Baseball" },
    { value: "Hockey", label: "Hockey" },
    { value: "Soccer", label: "Soccer" },
    { value: "Cricket", label: "Cricket" },
    { value: "Rugby", label: "Rugby" },
    { value: "Other", label: "Other" },
  ];

  const status_options: Array<{ value: string; label: string }> = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  onMount(async () => {
    const team_id = $page.params.id ?? "";

    if (!team_id) {
      loading_state = "error";
      error_message = "Team ID is required";
      return;
    }

    const [team_result, org_result, venues_result, staff_result, roles_result] =
      await Promise.all([
        team_use_cases.get_by_id(team_id),
        organization_use_cases.list(undefined, {
          page: 1,
          page_size: 100,
        }),
        venue_use_cases.list(undefined, { page: 1, page_size: 200 }),
        team_staff_use_cases.list_staff_by_team(team_id),
        team_staff_use_cases.list_staff_roles(),
      ]);

    if (!team_result.success) {
      loading_state = "error";
      error_message = team_result.error_message || "Failed to load team";
      return;
    }

    if (!team_result.data) {
      loading_state = "error";
      error_message = "Team not found";
      return;
    }

    const loaded_team = team_result.data;
    team = loaded_team;
    organizations = org_result.success ? org_result.data : [];
    venues = venues_result.success ? venues_result.data : [];
    staff_members = staff_result.success ? staff_result.data.items : [];
    available_staff_roles = roles_result.success ? roles_result.data : [];

    form_data = {
      name: loaded_team.name,
      short_name: loaded_team.short_name || "",
      organization_id: loaded_team.organization_id,
      sport_type: loaded_team.sport_type,
      primary_color: loaded_team.primary_color || "#3B82F6",
      secondary_color: loaded_team.secondary_color || "#FFFFFF",
      home_venue_id: (loaded_team as any).home_venue_id || "",
      max_squad_size: loaded_team.max_squad_size || 25,
      website: loaded_team.website || "",
      founded_year: loaded_team.founded_year,
      status: loaded_team.status,
    };

    loading_state = "success";
  });

  function handle_organization_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.organization_id = event.detail.value;
  }

  function handle_sport_type_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.sport_type = event.detail.value as UpdateTeamInput["sport_type"];
  }

  function handle_status_change(event: CustomEvent<{ value: string }>): void {
    form_data.status = event.detail.value as UpdateTeamInput["status"];
  }

  async function handle_submit(): Promise<void> {
    if (!team) return;

    validation_errors = new Map();

    if (!form_data.name?.trim()) {
      validation_errors.set("name", "Team name is required");
    }
    if (!form_data.organization_id) {
      validation_errors.set("organization_id", "Organization is required");
    }
    if (
      form_data.max_squad_size &&
      (form_data.max_squad_size < 1 || form_data.max_squad_size > 100)
    ) {
      validation_errors.set(
        "max_squad_size",
        "Max squad size must be between 1 and 100"
      );
    }

    if (validation_errors.size > 0) {
      validation_errors = new Map(validation_errors);
      return;
    }

    is_submitting = true;

    const result = await team_use_cases.update(team.id, form_data);

    if (!result.success) {
      is_submitting = false;
      show_toast(result.error_message || "Failed to update team", "error");
      return;
    }

    show_toast("Team updated successfully", "success");
    setTimeout(() => goto("/teams"), 1500);
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
    goto("/teams");
  }

  async function handle_staff_add(
    event: CustomEvent<{ staff: TeamStaff }>
  ): Promise<void> {
    if (!team) return;

    const staff_input = {
      first_name: event.detail.staff.first_name,
      last_name: event.detail.staff.last_name,
      email: event.detail.staff.email,
      phone: event.detail.staff.phone,
      date_of_birth: event.detail.staff.date_of_birth,
      team_id: team.id,
      role_id: event.detail.staff.role_id,
      nationality: event.detail.staff.nationality,
      profile_image_url: event.detail.staff.profile_image_url,
      employment_start_date: event.detail.staff.employment_start_date,
      employment_end_date: event.detail.staff.employment_end_date,
      emergency_contact_name: event.detail.staff.emergency_contact_name,
      emergency_contact_phone: event.detail.staff.emergency_contact_phone,
      notes: event.detail.staff.notes,
      status: event.detail.staff.status,
    };

    const result = await team_staff_use_cases.create(staff_input);

    if (result.success && result.data) {
      const temp_id = event.detail.staff.id;
      staff_members = staff_members.map((s) =>
        s.id === temp_id ? result.data! : s
      );
      show_toast("Staff member added", "success");
    } else {
      staff_members = staff_members.filter(
        (s) => s.id !== event.detail.staff.id
      );
      show_toast(result.error_message || "Failed to add staff member", "error");
    }
  }

  async function handle_staff_remove(
    event: CustomEvent<{ staff_id: string }>
  ): Promise<void> {
    const staff_id = event.detail.staff_id;

    if (staff_id.startsWith("temp-")) return;

    const result = await team_staff_use_cases.delete(staff_id);

    if (result.success) {
      show_toast("Staff member removed", "success");
    } else {
      const staff_result = await team_staff_use_cases.list_staff_by_team(
        team?.id || ""
      );
      if (staff_result.success) {
        staff_members = staff_result.data.items;
      }
      show_toast(
        result.error_message || "Failed to remove staff member",
        "error"
      );
    }
  }

  $: organization_options = organizations.map((org) => ({
    value: org.id,
    label: org.name,
  }));
</script>

<svelte:head>
  <title>Edit Team - Sports Management</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="p-2 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-700"
      aria-label="Go back to teams list"
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
        Edit Team
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Update team information
      </p>
    </div>
  </div>

  <LoadingStateWrapper
    state={loading_state}
    loading_text="Loading team..."
    {error_message}
  >
    <form
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 space-y-6"
      on:submit|preventDefault={handle_submit}
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="md:col-span-2">
          <FormField
            label="Team Name"
            name="name"
            bind:value={form_data.name}
            placeholder="Enter team name"
            required={true}
            error={validation_errors.get("name")}
          />
        </div>

        <FormField
          label="Short Name"
          name="short_name"
          bind:value={form_data.short_name}
          placeholder="Enter short name (e.g., MUN)"
        />

        <SelectField
          label="Organization"
          name="organization_id"
          value={form_data.organization_id || ""}
          options={organization_options}
          placeholder="Select organization"
          required={true}
          disabled={organization_options.length === 0}
          error={validation_errors.get("organization_id")}
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
                Create an organization to assign this team to.
              </p>
            </div>
          </div>
        {/if}

        <EnumSelectField
          label="Sport Type"
          name="sport_type"
          value={form_data.sport_type || "Football"}
          options={sport_type_options}
          required={true}
          on:change={handle_sport_type_change}
        />

        <div>
          <label
            for="primary_color"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Primary Color
          </label>
          <div class="flex items-center gap-3">
            <input
              type="color"
              id="primary_color"
              bind:value={form_data.primary_color}
              class="h-10 w-20 rounded border border-accent-300 dark:border-accent-600 cursor-pointer"
            />
            <span class="text-sm text-accent-600 dark:text-accent-400"
              >{form_data.primary_color}</span
            >
          </div>
        </div>

        <div>
          <label
            for="secondary_color"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Secondary Color
          </label>
          <div class="flex items-center gap-3">
            <input
              type="color"
              id="secondary_color"
              bind:value={form_data.secondary_color}
              class="h-10 w-20 rounded border border-accent-300 dark:border-accent-600 cursor-pointer"
            />
            <span class="text-sm text-accent-600 dark:text-accent-400"
              >{form_data.secondary_color}</span
            >
          </div>
        </div>

        <FormField
          label="Home Venue"
          name="home_venue_id"
          bind:value={form_data.home_venue_id}
          placeholder="Enter home venue ID"
        />

        <FormField
          label="Max Squad Size"
          name="max_squad_size"
          type="number"
          bind:value={form_data.max_squad_size}
          placeholder="25"
          min={1}
          max={100}
          error={validation_errors.get("max_squad_size")}
        />

        <FormField
          label="Website"
          name="website"
          type="url"
          bind:value={form_data.website}
          placeholder="https://team-website.com"
        />

        <FormField
          label="Founded Year"
          name="founded_year"
          type="number"
          bind:value={form_data.founded_year}
          placeholder="1990"
          min={1800}
          max={new Date().getFullYear()}
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

      <div class="border-t border-accent-200 dark:border-accent-700 pt-6">
        <TeamStaffForm
          bind:staff_members
          available_roles={available_staff_roles}
          team_id={team?.id || ""}
          disabled={is_submitting}
          on:add={handle_staff_add}
          on:remove={handle_staff_remove}
        />
      </div>

      <div
        class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-accent-200 dark:border-accent-700"
      >
        <button
          type="button"
          class="btn btn-outline"
          on:click={navigate_back}
          disabled={is_submitting}
        >
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" disabled={is_submitting}>
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
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Saving...
          {:else}
            Save Changes
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
