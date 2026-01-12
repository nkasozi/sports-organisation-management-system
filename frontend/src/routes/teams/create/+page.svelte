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

  let logo_preview: string = "";
  let logo_file_input: HTMLInputElement | undefined;

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
      organization_use_cases.list(undefined, { page: 1, page_size: 100 }),
      team_staff_use_cases.list_staff_roles(),
    ]);

    if (!org_result.success) {
      loading_state = "error";
      return;
    }

    organizations = org_result.data;
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

  function handle_logo_file_select(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        logo_preview = result;
        form_data.logo_url = result;
      }
    };
    reader.readAsDataURL(file);
  }

  function clear_logo_preview(): void {
    logo_preview = "";
    form_data.logo_url = "";
    if (logo_file_input) {
      logo_file_input.value = "";
    }
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

    const result = await team_use_cases.create(form_data);

    if (!result.success) {
      is_submitting = false;
      show_toast(result.error_message || "Failed to create team", "error");
      return;
    }

    if (!result.data) {
      is_submitting = false;
      show_toast("Failed to create team", "error");
      return;
    }

    const created_team = result.data;

    const staff_create_promises = pending_staff_members.map((staff) =>
      team_staff_use_cases.create({
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

  $: organization_options = (organizations || []).map((org) => ({
    value: org.id,
    label: org.name || "Unknown",
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
    <form class="space-y-8" on:submit|preventDefault={handle_submit}>
      <div
        class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-8 space-y-8"
      >
        <div>
          <h2
            class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-6"
          >
            Basic Information
          </h2>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
              <FormField
                label="Team Name"
                name="name"
                bind:value={form_data.name}
                placeholder="Enter full team name"
                required={true}
                error={validation_errors.get("name")}
              />

              <FormField
                label="Short Name"
                name="short_name"
                bind:value={form_data.short_name}
                placeholder="e.g., MUN, LIV, MCI"
              />

              <SelectField
                label="Organization"
                name="organization_id"
                value={form_data.organization_id}
                options={organization_options}
                placeholder="Select organization"
                required={true}
                error={validation_errors.get("organization_id")}
                disabled={organization_options.length === 0}
                on:change={handle_organization_change}
              />

              {#if organization_options.length === 0}
                <div
                  class="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 text-yellow-900 dark:text-yellow-100"
                >
                  <svg
                    class="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.336-.213 3.005-1.742 3.005H3.48c-1.53 0-2.492-1.669-1.743-3.005L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div>
                    <p class="text-sm font-medium">No organizations found</p>
                    <p class="text-sm">
                      Create an organization first to attach this team
                    </p>
                  </div>
                </div>
              {/if}

              <EnumSelectField
                label="Sport Type"
                name="sport_type"
                value={form_data.sport_type}
                options={sport_type_options}
                required={true}
                on:change={handle_sport_type_change}
              />
            </div>

            <div class="space-y-6">
              <div>
                <label
                  for="logo_upload"
                  class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-3"
                >
                  Team Logo
                </label>
                <div
                  id="logo_upload"
                  class="relative rounded-lg border-2 border-dashed border-accent-300 dark:border-accent-600 p-6 hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer bg-accent-50 dark:bg-accent-700/50"
                  on:click={() => logo_file_input?.click()}
                  role="button"
                  tabindex="0"
                  on:keydown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      logo_file_input?.click();
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    bind:this={logo_file_input}
                    on:change={handle_logo_file_select}
                    class="hidden"
                  />

                  {#if logo_preview}
                    <div class="space-y-3">
                      <img
                        src={logo_preview}
                        alt="Logo preview"
                        class="h-32 w-32 object-contain mx-auto rounded"
                      />
                      <button
                        type="button"
                        on:click|stopPropagation={clear_logo_preview}
                        class="w-full text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                      >
                        Remove Logo
                      </button>
                    </div>
                  {:else}
                    <div class="text-center">
                      <svg
                        class="h-12 w-12 text-accent-400 dark:text-accent-500 mx-auto mb-2"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M4 20h40M32 4v16"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <circle cx="20" cy="28" r="4" stroke-width="2" />
                      </svg>
                      <p
                        class="text-sm font-medium text-accent-900 dark:text-accent-100"
                      >
                        Click to upload logo
                      </p>
                      <p
                        class="text-xs text-accent-600 dark:text-accent-400 mt-1"
                      >
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  {/if}
                </div>
              </div>

              <div>
                <label
                  for="primary_color"
                  class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                >
                  Primary Color
                </label>
                <div class="flex items-center gap-3">
                  <input
                    type="color"
                    id="primary_color"
                    bind:value={form_data.primary_color}
                    class="h-12 w-16 rounded-lg border border-accent-300 dark:border-accent-600 cursor-pointer hover:opacity-90"
                  />
                  <span
                    class="text-sm font-mono text-accent-600 dark:text-accent-400"
                  >
                    {form_data.primary_color}
                  </span>
                </div>
              </div>

              <div>
                <label
                  for="secondary_color"
                  class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                >
                  Secondary Color
                </label>
                <div class="flex items-center gap-3">
                  <input
                    type="color"
                    id="secondary_color"
                    bind:value={form_data.secondary_color}
                    class="h-12 w-16 rounded-lg border border-accent-300 dark:border-accent-600 cursor-pointer hover:opacity-90"
                  />
                  <span
                    class="text-sm font-mono text-accent-600 dark:text-accent-400"
                  >
                    {form_data.secondary_color}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-8"
      >
        <h2
          class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-6"
        >
          Team Details
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Home Venue"
            name="home_venue"
            bind:value={form_data.home_venue}
            placeholder="e.g., Old Trafford"
          />

          <FormField
            label="Website"
            name="website"
            type="url"
            bind:value={form_data.website}
            placeholder="https://team-website.com"
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
            label="Founded Year"
            name="founded_year"
            type="number"
            bind:value={form_data.founded_year}
            placeholder={new Date().getFullYear().toString()}
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

        <div class="mt-6">
          <label
            for="description"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            bind:value={form_data.description}
            placeholder="Team history, achievements, and other information"
            rows="4"
            class="w-full px-4 py-2 rounded-lg border border-accent-300 dark:border-accent-600 bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100 placeholder-accent-400 dark:placeholder-accent-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          ></textarea>
        </div>
      </div>

      <div
        class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-8"
      >
        <h2
          class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-6"
        >
          Staff Members <span
            class="text-sm font-normal text-accent-600 dark:text-accent-400"
            >(Optional)</span
          >
        </h2>
        <TeamStaffForm
          bind:staff_members={pending_staff_members}
          available_roles={available_staff_roles}
          team_id=""
          disabled={is_submitting}
        />
        {#if pending_staff_members.length > 0}
          <p
            class="mt-4 text-sm text-accent-600 dark:text-accent-400 flex items-center gap-2"
          >
            <svg
              class="w-4 h-4 text-primary-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            Staff members will be added after the team is created
          </p>
        {/if}
      </div>

      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
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
