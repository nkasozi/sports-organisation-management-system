<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Organization } from "$lib/domain/entities/Organization";
  import type {
    CreateOfficialInput,
    OfficialQualification,
  } from "$lib/domain/entities/Official";
  import type { GameOfficialRole } from "$lib/domain/entities/GameOfficialRole";
  import type { SelectOption } from "$lib/components/ui/SelectField.svelte";
  import {
    create_empty_official_input,
    CERTIFICATION_LEVEL_OPTIONS,
  } from "$lib/domain/entities/Official";
  import { get_default_football_official_roles_with_ids } from "$lib/domain/entities/GameOfficialRole";
  import { get_official_use_cases } from "$lib/usecases/OfficialUseCases";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import FormField from "$lib/components/ui/FormField.svelte";
  import SelectField from "$lib/components/ui/SelectField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import ImageUpload from "$lib/components/ui/ImageUpload.svelte";
  import QualificationForm from "$lib/components/ui/QualificationForm.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";
  import { DEFAULT_OFFICIAL_AVATAR } from "$lib/domain/entities/Official";
  import { build_country_select_options } from "$lib/core/countries";

  const official_use_cases = get_official_use_cases();
  const organization_use_cases = get_organization_use_cases();

  let form_data: CreateOfficialInput = create_empty_official_input();
  let organizations: Organization[] = [];
  let available_roles: GameOfficialRole[] = [];
  let organization_options: SelectOption[] = [];
  let is_loading_organizations: boolean = true;
  let is_saving: boolean = false;
  let errors: Record<string, string> = {};

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  const status_options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
    { value: "retired", label: "Retired" },
  ];

  const country_options = build_country_select_options();

  function handle_nationality_change(
    event: CustomEvent<{ value: string }>
  ): boolean {
    form_data.nationality = event.detail.value;
    return true;
  }

  onMount(async () => {
    available_roles = get_default_football_official_roles_with_ids();
    await load_organizations();
  });

  async function load_organizations(): Promise<void> {
    is_loading_organizations = true;
    const result = await organization_use_cases.list(undefined, {
      page: 1,
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

  function handle_organization_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.organization_id = event.detail.value;
  }

  function handle_qualifications_change(
    event: CustomEvent<OfficialQualification[]>
  ): void {
    form_data.qualifications = event.detail;
    const primary_qual = form_data.qualifications.find((q) => q.is_primary);
    form_data.primary_role_id = primary_qual?.role_id || null;
  }

  async function handle_submit(): Promise<void> {
    errors = {};
    is_saving = true;

    const result = await official_use_cases.create(form_data);

    if (!result.success) {
      is_saving = false;
      show_toast(result.error_message || "Failed to create official", "error");
      return;
    }

    is_saving = false;
    show_toast("Official created successfully!", "success");

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
  <title>Add Official - Sports Management</title>
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
        Add Official
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400">
        Register a new referee, umpire, or match official
      </p>
    </div>
  </div>

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

      <ImageUpload
        current_image_url={form_data.profile_image_url}
        default_image_url={DEFAULT_OFFICIAL_AVATAR}
        label="Official Photo"
        disabled={is_saving}
        on:change={(e) => (form_data.profile_image_url = e.detail.url)}
      />

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

        <SelectField
          label="Nationality"
          name="nationality"
          value={form_data.nationality}
          options={country_options}
          placeholder="Select nationality"
          on:change={handle_nationality_change}
        />
      </div>

      <div class="border-b border-accent-200 dark:border-accent-700 pb-4 pt-4">
        <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
          Professional Details
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Create an organization to register officials under it.
              </p>
            </div>
          </div>
        {/if}

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

      <div class="border-b border-accent-200 dark:border-accent-700 pb-4 pt-4">
        <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
          Qualifications & Certifications
        </h2>
      </div>

      <QualificationForm
        qualifications={form_data.qualifications}
        {available_roles}
        on:change={handle_qualifications_change}
      />

      <div class="border-b border-accent-200 dark:border-accent-700 pb-4 pt-4">
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
            Creating...
          </span>
        {:else}
          Add Official
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
