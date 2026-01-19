<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import type {
    Qualification,
    CreateQualificationInput,
    QualificationHolderType,
    CertificationLevel,
  } from "$lib/core/entities/Qualification";
  import {
    create_empty_qualification_input,
    CERTIFICATION_LEVEL_OPTIONS,
    is_qualification_expired,
    get_days_until_expiry,
    get_expiry_status_color,
  } from "$lib/core/entities/Qualification";
  import { get_qualification_use_cases } from "$lib/core/usecases/QualificationUseCases";
  import FormField from "$lib/presentation/components/ui/FormField.svelte";
  import EnumSelectField from "$lib/presentation/components/ui/EnumSelectField.svelte";
  import Toast from "$lib/presentation/components/ui/Toast.svelte";

  export let holder_type: QualificationHolderType;
  export let holder_id: string;
  export let readonly: boolean = false;

  const dispatch = createEventDispatcher();
  const qualification_use_cases = get_qualification_use_cases();

  let qualifications: Qualification[] = [];
  let is_loading: boolean = true;
  let is_adding: boolean = false;
  let editing_id: string | null = null;
  let new_qualification: CreateQualificationInput = create_empty_qualification_input(
    holder_type,
    holder_id,
  );

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  onMount(async () => {
    await load_qualifications();
  });

  async function load_qualifications(): Promise<boolean> {
    if (!holder_id) {
      is_loading = false;
      return false;
    }

    is_loading = true;
    const result = await qualification_use_cases.list_by_holder(
      holder_type,
      holder_id,
    );

    if (result.success && result.data) {
      qualifications = result.data.items;
    }
    is_loading = false;
    return result.success;
  }

  function start_adding(): void {
    new_qualification = create_empty_qualification_input(holder_type, holder_id);
    is_adding = true;
    editing_id = null;
  }

  function cancel_adding(): void {
    is_adding = false;
    new_qualification = create_empty_qualification_input(holder_type, holder_id);
  }

  async function save_new_qualification(): Promise<boolean> {
    const result = await qualification_use_cases.create(new_qualification);

    if (result.success && result.data) {
      qualifications = [...qualifications, result.data];
      is_adding = false;
      new_qualification = create_empty_qualification_input(holder_type, holder_id);
      show_toast("Qualification added successfully", "success");
      dispatch("change", { qualifications });
      return true;
    }

    const error_message = !result.success ? result.error : "Failed to add qualification";
    show_toast(error_message, "error");
    return false;
  }

  function start_editing(qualification: Qualification): void {
    editing_id = qualification.id;
    is_adding = false;
  }

  function cancel_editing(): void {
    editing_id = null;
  }

  async function save_edited_qualification(qualification: Qualification): Promise<boolean> {
    const result = await qualification_use_cases.update(qualification.id, qualification);

    if (result.success && result.data) {
      qualifications = qualifications.map((q) =>
        q.id === qualification.id ? result.data! : q,
      );
      editing_id = null;
      show_toast("Qualification updated successfully", "success");
      dispatch("change", { qualifications });
      return true;
    }

    const error_message = !result.success ? result.error : "Failed to update qualification";
    show_toast(error_message, "error");
    return false;
  }

  async function delete_qualification(id: string): Promise<boolean> {
    const result = await qualification_use_cases.delete(id);

    if (result.success) {
      qualifications = qualifications.filter((q) => q.id !== id);
      show_toast("Qualification removed", "success");
      dispatch("change", { qualifications });
      return true;
    }

    show_toast("Failed to remove qualification", "error");
    return false;
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info",
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function format_date(date_string: string): string {
    if (!date_string) return "N/A";
    return new Date(date_string).toLocaleDateString();
  }

  function get_level_label(level: CertificationLevel): string {
    const option = CERTIFICATION_LEVEL_OPTIONS.find((o) => o.value === level);
    return option?.label || level;
  }

  function get_expiry_badge_class(expiry_date: string): string {
    const color = get_expiry_status_color(expiry_date);
    switch (color) {
      case "red":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "orange":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "yellow":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "green":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  }

  function get_expiry_text(expiry_date: string): string {
    const days = get_days_until_expiry(expiry_date);
    if (days === null) return "No expiry";
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return "Expires today";
    if (days === 1) return "Expires tomorrow";
    return `Expires in ${days} days`;
  }

  function handle_specialization_input(
    event: Event,
    target: CreateQualificationInput | Qualification,
  ): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    target.specializations = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100">
      Qualifications & Certifications
    </h3>
    {#if !readonly && holder_id && !is_adding}
      <button
        type="button"
        class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 transition-colors"
        on:click={start_adding}
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Qualification
      </button>
    {/if}
  </div>

  {#if !holder_id}
    <div class="p-4 text-center text-accent-500 dark:text-accent-400 bg-accent-50 dark:bg-accent-800/50 rounded-lg">
      <p>Save the record first to add qualifications</p>
    </div>
  {:else if is_loading}
    <div class="p-4 text-center">
      <div class="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
      <p class="mt-2 text-sm text-accent-500">Loading qualifications...</p>
    </div>
  {:else}
    {#if is_adding}
      <div class="p-4 border border-primary-200 dark:border-primary-700 rounded-lg bg-primary-50/50 dark:bg-primary-900/20">
        <h4 class="font-medium text-accent-900 dark:text-accent-100 mb-4">New Qualification</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Certification Name"
            name="certification_name"
            bind:value={new_qualification.certification_name}
            placeholder="e.g., FIFA Referee License"
            required={true}
          />
          <EnumSelectField
            label="Level"
            name="certification_level"
            bind:value={new_qualification.certification_level}
            options={CERTIFICATION_LEVEL_OPTIONS}
          />
          <FormField
            label="Certificate Number"
            name="certification_number"
            bind:value={new_qualification.certification_number}
            placeholder="e.g., REF-2024-001"
          />
          <FormField
            label="Issuing Authority"
            name="issuing_authority"
            bind:value={new_qualification.issuing_authority}
            placeholder="e.g., FIFA, National FA"
          />
          <FormField
            label="Issue Date"
            name="issue_date"
            type="date"
            bind:value={new_qualification.issue_date}
          />
          <FormField
            label="Expiry Date"
            name="expiry_date"
            type="date"
            bind:value={new_qualification.expiry_date}
          />
          <div class="md:col-span-2">
            <label for="new-qual-specializations" class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1">
              Specializations
            </label>
            <input
              id="new-qual-specializations"
              type="text"
              class="input w-full"
              placeholder="Enter specializations separated by commas"
              value={new_qualification.specializations.join(", ")}
              on:input={(e) => handle_specialization_input(e, new_qualification)}
            />
            <p class="mt-1 text-xs text-accent-500">Separate multiple specializations with commas</p>
          </div>
          <div class="md:col-span-2">
            <FormField
              label="Notes"
              name="notes"
              bind:value={new_qualification.notes}
              placeholder="Additional notes..."
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button
            type="button"
            class="btn btn-outline"
            on:click={cancel_adding}
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            on:click={save_new_qualification}
          >
            Add Qualification
          </button>
        </div>
      </div>
    {/if}

    {#if qualifications.length === 0 && !is_adding}
      <div class="p-6 text-center border-2 border-dashed border-accent-300 dark:border-accent-600 rounded-lg">
        <svg class="w-12 h-12 mx-auto text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-2 text-accent-500 dark:text-accent-400">No qualifications added yet</p>
        {#if !readonly}
          <button
            type="button"
            class="mt-3 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            on:click={start_adding}
          >
            Add first qualification
          </button>
        {/if}
      </div>
    {:else}
      <div class="space-y-3">
        {#each qualifications as qualification (qualification.id)}
          <div
            class="p-4 border border-accent-200 dark:border-accent-700 rounded-lg bg-white dark:bg-accent-800 {is_qualification_expired(qualification.expiry_date) ? 'border-l-4 border-l-red-500' : ''}"
          >
            {#if editing_id === qualification.id}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Certification Name"
                  name="edit_certification_name"
                  bind:value={qualification.certification_name}
                  required={true}
                />
                <EnumSelectField
                  label="Level"
                  name="edit_certification_level"
                  bind:value={qualification.certification_level}
                  options={CERTIFICATION_LEVEL_OPTIONS}
                />
                <FormField
                  label="Certificate Number"
                  name="edit_certification_number"
                  bind:value={qualification.certification_number}
                />
                <FormField
                  label="Issuing Authority"
                  name="edit_issuing_authority"
                  bind:value={qualification.issuing_authority}
                />
                <FormField
                  label="Issue Date"
                  name="edit_issue_date"
                  type="date"
                  bind:value={qualification.issue_date}
                />
                <FormField
                  label="Expiry Date"
                  name="edit_expiry_date"
                  type="date"
                  bind:value={qualification.expiry_date}
                />
                <div class="md:col-span-2">
                  <label for="edit-qual-specializations-{qualification.id}" class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1">
                    Specializations
                  </label>
                  <input
                    id="edit-qual-specializations-{qualification.id}"
                    type="text"
                    class="input w-full"
                    value={qualification.specializations.join(", ")}
                    on:input={(e) => handle_specialization_input(e, qualification)}
                  />
                </div>
                <div class="md:col-span-2">
                  <FormField
                    label="Notes"
                    name="edit_notes"
                    bind:value={qualification.notes}
                  />
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  class="btn btn-outline"
                  on:click={cancel_editing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  on:click={() => save_edited_qualification(qualification)}
                >
                  Save Changes
                </button>
              </div>
            {:else}
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="font-medium text-accent-900 dark:text-accent-100">
                      {qualification.certification_name}
                    </h4>
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-accent-100 text-accent-700 dark:bg-accent-700 dark:text-accent-300">
                      {get_level_label(qualification.certification_level)}
                    </span>
                    {#if qualification.expiry_date}
                      <span class="px-2 py-0.5 text-xs font-medium rounded-full {get_expiry_badge_class(qualification.expiry_date)}">
                        {get_expiry_text(qualification.expiry_date)}
                      </span>
                    {/if}
                  </div>
                  <div class="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                    {#if qualification.certification_number}
                      <div>
                        <span class="text-accent-500 dark:text-accent-400">Number:</span>
                        <span class="ml-1 text-accent-700 dark:text-accent-300">{qualification.certification_number}</span>
                      </div>
                    {/if}
                    {#if qualification.issuing_authority}
                      <div>
                        <span class="text-accent-500 dark:text-accent-400">Issuer:</span>
                        <span class="ml-1 text-accent-700 dark:text-accent-300">{qualification.issuing_authority}</span>
                      </div>
                    {/if}
                    {#if qualification.issue_date}
                      <div>
                        <span class="text-accent-500 dark:text-accent-400">Issued:</span>
                        <span class="ml-1 text-accent-700 dark:text-accent-300">{format_date(qualification.issue_date)}</span>
                      </div>
                    {/if}
                    {#if qualification.expiry_date}
                      <div>
                        <span class="text-accent-500 dark:text-accent-400">Expires:</span>
                        <span class="ml-1 text-accent-700 dark:text-accent-300">{format_date(qualification.expiry_date)}</span>
                      </div>
                    {/if}
                  </div>
                  {#if qualification.specializations.length > 0}
                    <div class="mt-2 flex flex-wrap gap-1">
                      {#each qualification.specializations as spec}
                        <span class="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded">
                          {spec}
                        </span>
                      {/each}
                    </div>
                  {/if}
                  {#if qualification.notes}
                    <p class="mt-2 text-sm text-accent-500 dark:text-accent-400 italic">
                      {qualification.notes}
                    </p>
                  {/if}
                </div>
                {#if !readonly}
                  <div class="flex items-center gap-1 ml-4">
                    <button
                      type="button"
                      class="p-2 text-accent-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                      on:click={() => start_editing(qualification)}
                      title="Edit qualification"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="p-2 text-accent-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      on:click={() => delete_qualification(qualification.id)}
                      title="Remove qualification"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
