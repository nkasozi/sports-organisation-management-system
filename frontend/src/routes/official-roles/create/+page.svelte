<script lang="ts">
  import { goto } from "$app/navigation";
  import type { CreateGameOfficialRoleInput } from "$lib/domain/entities/GameOfficialRole";
  import { create_empty_game_official_role_input } from "$lib/domain/entities/GameOfficialRole";
  import { get_game_official_role_use_cases } from "$lib/usecases/GameOfficialRoleUseCases";
  import FormField from "$lib/components/ui/FormField.svelte";
  import EnumSelectField from "$lib/components/ui/EnumSelectField.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const use_cases = get_game_official_role_use_cases();

  let form_data: CreateGameOfficialRoleInput =
    create_empty_game_official_role_input();
  let is_submitting: boolean = false;
  let validation_errors: Map<string, string> = new Map();

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  const status_options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  async function handle_submit(): Promise<void> {
    validation_errors = new Map();

    if (!form_data.name.trim()) {
      validation_errors.set("name", "Role name is required");
    }
    if (!form_data.code.trim()) {
      validation_errors.set("code", "Role code is required");
    }

    if (validation_errors.size > 0) {
      validation_errors = new Map(validation_errors);
      return;
    }

    is_submitting = true;

    const result = await use_cases.create_role(form_data);

    if (!result.success) {
      is_submitting = false;
      show_toast(result.error, "error");
      return;
    }

    show_toast("Official role created successfully", "success");
    setTimeout(() => goto("/official-roles"), 1500);
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
    goto("/official-roles");
  }

  function handle_status_change(event: CustomEvent<{ value: string }>): void {
    form_data.status = event.detail
      .value as CreateGameOfficialRoleInput["status"];
  }
</script>

<svelte:head>
  <title>Create Official Role - Sports Management</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="p-2 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-700"
      aria-label="Go back"
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
        Create Official Role
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Add a new referee or match official role
      </p>
    </div>
  </div>

  <form
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 space-y-6"
    on:submit|preventDefault={handle_submit}
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        label="Role Name"
        name="name"
        bind:value={form_data.name}
        placeholder="e.g., Referee, Assistant Referee"
        required={true}
        error={validation_errors.get("name")}
      />

      <FormField
        label="Role Code"
        name="code"
        bind:value={form_data.code}
        placeholder="e.g., REF, AR"
        required={true}
        error={validation_errors.get("code")}
      />

      <div class="md:col-span-2">
        <FormField
          label="Description"
          name="description"
          type="textarea"
          bind:value={form_data.description}
          placeholder="Describe the responsibilities of this role"
          rows={3}
        />
      </div>

      <FormField
        label="Display Order"
        name="display_order"
        type="number"
        bind:value={form_data.display_order}
        placeholder="1"
        min={0}
      />

      <EnumSelectField
        label="Status"
        name="status"
        value={form_data.status}
        options={status_options}
        required={true}
        on:change={handle_status_change}
      />

      <div class="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_on_field"
          bind:checked={form_data.is_on_field}
          class="h-4 w-4 rounded border-accent-300 text-primary-600 focus:ring-primary-500"
        />
        <label
          for="is_on_field"
          class="text-sm font-medium text-accent-700 dark:text-accent-300"
        >
          On-field position
        </label>
      </div>

      <div class="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_head_official"
          bind:checked={form_data.is_head_official}
          class="h-4 w-4 rounded border-accent-300 text-primary-600 focus:ring-primary-500"
        />
        <label
          for="is_head_official"
          class="text-sm font-medium text-accent-700 dark:text-accent-300"
        >
          Head official role
        </label>
      </div>
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
          Create Role
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
