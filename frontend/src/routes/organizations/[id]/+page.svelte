<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type {
    Organization,
    UpdateOrganizationInput,
  } from "$lib/domain/entities/Organization";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import FormField from "$lib/components/ui/FormField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const use_cases = get_organization_use_cases();

  let organization: Organization | null = null;
  let form_data: UpdateOrganizationInput = {};
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let is_saving: boolean = false;
  let errors: Record<string, string> = {};

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  $: organization_id = $page.params.id ?? "";

  const status_options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
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

  onMount(() => {
    if (!organization_id) {
      loading_state = "error";
      error_message = "Organization ID is required";
      return;
    }
    load_organization();
  });

  async function load_organization(): Promise<void> {
    loading_state = "loading";

    const result = await use_cases.get_by_id(organization_id);

    if (!result.success) {
      loading_state = "error";
      error_message = result.error_message || "Failed to load organization";
      return;
    }

    if (!result.data) {
      loading_state = "error";
      error_message = "Organization not found";
      return;
    }

    organization = result.data;
    form_data = {
      name: organization.name,
      description: organization.description,
      sport_id: organization.sport_id,
      founded_date: organization.founded_date,
      contact_email: organization.contact_email,
      contact_phone: organization.contact_phone,
      address: organization.address,
      website: organization.website,
      status: organization.status,
    };
    loading_state = "success";
  }

  async function handle_submit(): Promise<void> {
    errors = {};
    is_saving = true;

    const result = await use_cases.update(organization_id, form_data);

    if (!result.success) {
      is_saving = false;
      show_toast(
        result.error_message || "Failed to update organization",
        "error"
      );
      return;
    }

    is_saving = false;
    show_toast("Organization updated successfully!", "success");

    setTimeout(() => {
      goto("/organizations");
    }, 1500);
  }

  function handle_cancel(): void {
    goto("/organizations");
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
  <title>{organization?.name || "Edit Organization"} - Sports Management</title>
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
        Edit Organization
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400">
        Update organization details
      </p>
    </div>
  </div>

  <LoadingStateWrapper
    state={loading_state}
    {error_message}
    loading_text="Loading organization..."
  >
    <form
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
      on:submit|preventDefault={handle_submit}
    >
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <FormField
              label="Organization Name"
              name="name"
              bind:value={form_data.name}
              placeholder="Enter organization name"
              required={true}
              error={errors.name || ""}
            />
          </div>

          <EnumSelectField
            label="Sport"
            name="sport_id"
            bind:value={form_data.sport_id}
            options={sport_type_options}
            required={true}
            error={errors.sport_id || ""}
          />

          <EnumSelectField
            label="Status"
            name="status"
            bind:value={form_data.status}
            options={status_options}
            error={errors.status || ""}
          />

          <div class="md:col-span-2">
            <FormField
              label="Description"
              name="description"
              type="textarea"
              bind:value={form_data.description}
              placeholder="Enter a description of the organization"
              rows={3}
            />
          </div>

          <FormField
            label="Founded Date"
            name="founded_date"
            type="date"
            bind:value={form_data.founded_date}
          />

          <FormField
            label="Contact Email"
            name="contact_email"
            type="email"
            bind:value={form_data.contact_email}
            placeholder="admin@organization.com"
          />

          <FormField
            label="Contact Phone"
            name="contact_phone"
            type="tel"
            bind:value={form_data.contact_phone}
            placeholder="+1-555-0123"
          />

          <FormField
            label="Website"
            name="website"
            type="url"
            bind:value={form_data.website}
            placeholder="https://organization.com"
          />

          <div class="md:col-span-2">
            <FormField
              label="Address"
              name="address"
              type="textarea"
              bind:value={form_data.address}
              placeholder="Enter the organization's address"
              rows={2}
            />
          </div>
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
