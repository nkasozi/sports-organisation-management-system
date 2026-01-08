<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { CreateTeamInput } from "$lib/domain/entities/Team";
  import type { Organization } from "$lib/domain/entities/Organization";
  import type { TeamStaff } from "$lib/domain/entities/TeamStaff";
  import type { TeamStaffRole } from "$lib/domain/entities/TeamStaffRole";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import { get_team_staff_use_cases } from "$lib/usecases/TeamStaffUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import FormField from "$lib/components/ui/FormField.svelte";
  import SelectField from "$lib/components/ui/SelectField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import TeamStaffForm from "$lib/components/ui/TeamStaffForm.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const team_use_cases = get_team_use_cases();
  const organization_use_cases = get_organization_use_cases();
  const team_staff_use_cases = get_team_staff_use_cases();

  let organizations: Organization[] = [];
  let pending_staff_members: TeamStaff[] = [];
  let available_staff_roles: TeamStaffRole[] = [];
  let loading_state: LoadingState = "loading";
  let is_submitting: boolean = false;
  let validation_errors: Map<string, string> = new Map();

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  let form_data: CreateTeamInput = {
    name: "",
    short_name: "",
    organization_id: "",
    sport_type: "Football",
    primary_color: "#3B82F6",
    secondary_color: "#FFFFFF",
    description: "",
    logo_url: "",
    home_venue: "",
    max_squad_size: 25,
    website: "",
    founded_year: new Date().getFullYear(),
    captain_player_id: null,
    vice_captain_player_id: null,
    status: "active",
  };

  const sport_type_options: Array<{
    value: CreateTeamInput["sport_type"];
    label: string;
  }> = [
    { value: "Football", label: "Football" },
    { value: "Basketball", label: "Basketball" },
    { value: "Baseball", label: "Baseball" },
    { value: "Hockey", label: "Hockey" },
    { value: "Soccer", label: "Soccer" },
    { value: "Cricket", label: "Cricket" },
    { value: "Rugby", label: "Rugby" },
    { value: "Other", label: "Other" },
  ];

  const status_options: Array<{
    value: CreateTeamInput["status"];
    label: string;
  }> = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  onMount(async () => {
    const [org_result, roles_result] = await Promise.all([
      organization_use_cases.list_organizations(undefined, { page_size: 100 }),
      team_staff_use_cases.list_staff_roles(),
    ]);

    if (!org_result.success) {
      loading_state = "error";
      return;
    }

    organizations = org_result.data.items;
    available_staff_roles = roles_result.success ? roles_result.data : [];
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
    form_data.sport_type = event.detail.value as CreateTeamInput["sport_type"];
  }

  function handle_status_change(event: CustomEvent<{ value: string }>): void {
    form_data.status = event.detail.value as CreateTeamInput["status"];
  }

  async function handle_submit(): Promise<void> {
    validation_errors = new Map();

    if (!form_data.name.trim()) {
      validation_errors.set("name", "Team name is required");
    }
    if (!form_data.organization_id) {
      validation_errors.set("organization_id", "Organization is required");
    }
    if (form_data.max_squad_size < 1 || form_data.max_squad_size > 100) {
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

    const result = await team_use_cases.create_team(form_data);

    if (!result.success) {
      is_submitting = false;
      show_toast(result.error, "error");
      return;
    }

    const created_team = result.data;

    const staff_create_promises = pending_staff_members.map((staff) =>
      team_staff_use_cases.create_team_staff({
        first_name: staff.first_name,
        last_name: staff.last_name,
        email: staff.email,
        phone: staff.phone,
        date_of_birth: staff.date_of_birth,
        team_id: created_team.id,
        role_id: staff.role_id,
        nationality: staff.nationality,
        profile_image_url: staff.profile_image_url,
        qualifications: staff.qualifications,
        license_number: staff.license_number,
        license_expiry: staff.license_expiry,
        employment_start_date: staff.employment_start_date,
        employment_end_date: staff.employment_end_date,
        emergency_contact_name: staff.emergency_contact_name,
        emergency_contact_phone: staff.emergency_contact_phone,
        notes: staff.notes,
        status: staff.status,
      })
    );

    await Promise.all(staff_create_promises);

    show_toast("Team created successfully", "success");
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

  $: organization_options = organizations.map((org) => ({
    value: org.id,
    label: org.name,
  }));
</script>

<svelte:head>
  <title>Create Team - Sports Management</title>
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
        Create Team
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Add a new team to your organization
      </p>
    </div>
  </div>

  <LoadingStateWrapper
    state={loading_state}
    loading_text="Loading form data..."
    error_message="Failed to load organizations"
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
          value={form_data.organization_id}
          options={organization_options}
          placeholder="Select organization"
          required={true}
          error={validation_errors.get("organization_id")}
          on:change={handle_organization_change}
        />

        <EnumSelectField
          label="Sport Type"
          name="sport_type"
          value={form_data.sport_type}
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
          name="home_venue"
          bind:value={form_data.home_venue}
          placeholder="Enter home venue/stadium"
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
          value={form_data.status}
          options={status_options}
          required={true}
          on:change={handle_status_change}
        />
      </div>

      <div class="border-t border-accent-200 dark:border-accent-700 pt-6">
        <TeamStaffForm
          bind:staff_members={pending_staff_members}
          available_roles={available_staff_roles}
          team_id=""
          disabled={is_submitting}
        />
        {#if pending_staff_members.length > 0}
          <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
            Staff members will be added after the team is created
          </p>
        {/if}
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
            Creating...
          {:else}
            Create Team
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
