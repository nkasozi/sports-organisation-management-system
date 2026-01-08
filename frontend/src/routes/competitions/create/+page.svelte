<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Organization } from "$lib/domain/entities/Organization";
  import type { CreateCompetitionInput } from "$lib/domain/entities/Competition";
  import type { SelectOption } from "$lib/components/ui/SelectField.svelte";
  import { create_empty_competition_input } from "$lib/domain/entities/Competition";
  import { get_competition_use_cases } from "$lib/usecases/CompetitionUseCases";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import FormField from "$lib/components/ui/FormField.svelte";
  import SelectField from "$lib/components/ui/SelectField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const competition_use_cases = get_competition_use_cases();
  const organization_use_cases = get_organization_use_cases();

  let form_data: CreateCompetitionInput = create_empty_competition_input();
  let organizations: Organization[] = [];
  let organization_options: SelectOption[] = [];
  let is_loading_organizations: boolean = true;
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

  const competition_type_options = [
    { value: "league", label: "League" },
    { value: "tournament", label: "Tournament" },
    { value: "championship", label: "Championship" },
    { value: "cup", label: "Cup" },
    { value: "friendly", label: "Friendly" },
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
    await load_organizations();
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

  function handle_organization_change(
    event: CustomEvent<{ value: string }>
  ): void {
    form_data.organization_id = event.detail.value;
  }

  async function handle_submit(): Promise<void> {
    errors = {};
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

        <EnumSelectField
          label="Competition Type"
          name="competition_type"
          bind:value={form_data.competition_type}
          options={competition_type_options}
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

        <div class="md:col-span-2">
          <FormField
            label="Rules"
            name="rules"
            type="textarea"
            bind:value={form_data.rules}
            placeholder="Enter competition rules and regulations"
            rows={4}
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
