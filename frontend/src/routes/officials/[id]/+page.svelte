<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type {
    Official,
    UpdateOfficialInput,
  } from "$lib/domain/entities/Official";
  import type { Organization } from "$lib/domain/entities/Organization";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import type { SelectOption } from "$lib/components/ui/SelectField.svelte";
  import {
    get_official_full_name,
    OFFICIAL_ROLE_OPTIONS,
    CERTIFICATION_LEVEL_OPTIONS,
  } from "$lib/domain/entities/Official";
  import { get_official_use_cases } from "$lib/usecases/OfficialUseCases";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import FormField from "$lib/components/ui/FormField.svelte";
  import SelectField from "$lib/components/ui/SelectField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const official_use_cases = get_official_use_cases();
  const organization_use_cases = get_organization_use_cases();

  let official: Official | null = null;
  let organizations: Organization[] = [];
  let form_data: UpdateOfficialInput = {};
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let is_saving: boolean = false;
  let errors: Record<string, string> = {};

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  $: official_id = $page.params.id ?? "";

  let organization_options: SelectOption[] = [];
  $: organization_options = organizations.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  const status_options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
    { value: "retired", label: "Retired" },
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

  onMount(async () => {
    if (!official_id) {
      loading_state = "error";
      error_message = "Official ID is required";
      return;
    }
    await load_official_data();
  });

  async function load_official_data(): Promise<void> {
    loading_state = "loading";

    const [official_result, org_result] = await Promise.all([
      official_use_cases.get_official(official_id),
      organization_use_cases.list_organizations(undefined, { page_size: 100 }),
    ]);

    if (!official_result.success) {
      loading_state = "error";
      error_message = official_result.error;
      return;
    }

    official = official_result.data;
    organizations = org_result.success ? org_result.data.items : [];

    form_data = {
      first_name: official.first_name,
      last_name: official.last_name,
      email: official.email,
      phone: official.phone,
      date_of_birth: official.date_of_birth,
      organization_id: official.organization_id,
      role: official.role,
      sport_type: official.sport_type,
      certification_level: official.certification_level,
      certification_number: official.certification_number,
      certification_expiry: official.certification_expiry,
      years_of_experience: official.years_of_experience,
      nationality: official.nationality,
      emergency_contact_name: official.emergency_contact_name,
      emergency_contact_phone: official.emergency_contact_phone,
      notes: official.notes,
      status: official.status,
    };
    loading_state = "success";
  }

  function handle_organization_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.organization_id = event.detail.value;
  }

  async function handle_submit(): Promise<void> {
    errors = {};
    is_saving = true;

    const result = await official_use_cases.update_official(
      official_id,
      form_data
    );

    if (!result.success) {
      is_saving = false;
      show_toast(result.error, "error");
      return;
    }

    is_saving = false;
    show_toast("Official updated successfully!", "success");

    setTimeout(() => {
      goto("/officials");
    }, 1500);
  }

  function handle_cancel(): void {
    goto("/officials");
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
  <title
    >{official ? get_official_full_name(official) : "Edit Official"} - Sports Management</title
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
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Edit Official
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400">
        Update official details and certifications
      </p>
    </div>
  </div>

  <LoadingStateWrapper
    state={loading_state}
    {error_message}
    loading_text="Loading official..."
  >
    <form
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
      on:submit|preventDefault={handle_submit}
    >
      <div class="space-y-6">
        <div class="border-b border-accent-200 dark:border-accent-700 pb-4">
          <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Personal Information
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="First Name"
            name="first_name"
            bind:value={form_data.first_name}
            placeholder="Enter first name"
            required={true}
            error={errors.first_name || ""}
          />

          <FormField
            label="Last Name"
            name="last_name"
            bind:value={form_data.last_name}
            placeholder="Enter last name"
            required={true}
            error={errors.last_name || ""}
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            bind:value={form_data.email}
            placeholder="official@example.com"
            error={errors.email || ""}
          />

          <FormField
            label="Phone"
            name="phone"
            type="tel"
            bind:value={form_data.phone}
            placeholder="+1-555-0123"
          />

          <FormField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            bind:value={form_data.date_of_birth}
          />

          <FormField
            label="Nationality"
            name="nationality"
            bind:value={form_data.nationality}
            placeholder="Enter nationality"
          />
        </div>

        <div
          class="border-b border-accent-200 dark:border-accent-700 pb-4 pt-4"
        >
          <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Professional Details
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Organization"
            name="organization_id"
            value={form_data.organization_id ?? ""}
            options={organization_options}
            placeholder="Select an organization..."
            required={true}
            error={errors.organization_id || ""}
            on:change={handle_organization_change}
          />

          <EnumSelectField
            label="Role"
            name="role"
            bind:value={form_data.role}
            options={OFFICIAL_ROLE_OPTIONS}
            required={true}
          />

          <EnumSelectField
            label="Sport Type"
            name="sport_type"
            bind:value={form_data.sport_type}
            options={sport_type_options}
            required={true}
          />

          <EnumSelectField
            label="Certification Level"
            name="certification_level"
            bind:value={form_data.certification_level}
            options={CERTIFICATION_LEVEL_OPTIONS}
            required={true}
          />

          <FormField
            label="Certification Number"
            name="certification_number"
            bind:value={form_data.certification_number}
            placeholder="Enter certification number"
          />

          <FormField
            label="Certification Expiry"
            name="certification_expiry"
            type="date"
            bind:value={form_data.certification_expiry}
          />

          <FormField
            label="Years of Experience"
            name="years_of_experience"
            type="number"
            bind:value={form_data.years_of_experience}
            min={0}
          />

          <EnumSelectField
            label="Status"
            name="status"
            bind:value={form_data.status}
            options={status_options}
          />
        </div>

        <div
          class="border-b border-accent-200 dark:border-accent-700 pb-4 pt-4"
        >
          <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Emergency Contact
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Emergency Contact Name"
            name="emergency_contact_name"
            bind:value={form_data.emergency_contact_name}
            placeholder="Enter emergency contact name"
          />

          <FormField
            label="Emergency Contact Phone"
            name="emergency_contact_phone"
            type="tel"
            bind:value={form_data.emergency_contact_phone}
            placeholder="+1-555-0123"
          />
        </div>

        <div class="pt-4">
          <FormField
            label="Notes"
            name="notes"
            type="textarea"
            bind:value={form_data.notes}
            placeholder="Any additional notes about this official"
            rows={3}
          />
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
              Saving...
            </span>
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
