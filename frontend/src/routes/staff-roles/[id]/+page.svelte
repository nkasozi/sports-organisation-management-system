<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import type { TeamStaffRole } from "$lib/domain/entities/TeamStaffRole";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_team_staff_role_use_cases } from "$lib/usecases/TeamStaffRoleUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const use_cases = get_team_staff_role_use_cases();

  let role: TeamStaffRole | null = null;
  let loading_state: LoadingState = "loading";
  let error_message: string = "";

  let name: string = "";
  let code: string = "";
  let description: string = "";
  let category:
    | "coaching"
    | "medical"
    | "administrative"
    | "technical"
    | "other" = "coaching";
  let display_order: number = 0;
  let is_primary_contact: boolean = false;
  let status: "active" | "inactive" = "active";

  let is_submitting: boolean = false;
  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  $: role_id = $page.params.id;

  onMount(async () => {
    await load_role();
  });

  async function load_role(): Promise<void> {
    loading_state = "loading";

    const result = await use_cases.get_role(role_id);

    if (!result.success) {
      loading_state = "error";
      error_message = result.error;
      return;
    }

    role = result.data;
    name = role.name;
    code = role.code;
    description = role.description || "";
    category = role.category;
    display_order = role.display_order;
    is_primary_contact = role.is_primary_contact;
    status = role.status;
    loading_state = "success";
  }

  async function handle_submit(event: Event): Promise<void> {
    event.preventDefault();

    if (!name.trim()) {
      show_toast("Please enter a role name", "error");
      return;
    }

    if (!code.trim()) {
      show_toast("Please enter a role code", "error");
      return;
    }

    is_submitting = true;

    const result = await use_cases.update_role(role_id, {
      name: name.trim(),
      code: code.trim(),
      description: description.trim() || undefined,
      category,
      display_order,
      is_primary_contact,
      status,
    });

    if (!result.success) {
      show_toast(result.error, "error");
      is_submitting = false;
      return;
    }

    show_toast("Role updated successfully", "success");
    setTimeout(() => goto("/staff-roles"), 1000);
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
  <title>Edit Staff Role - Sports Management</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="p-2 text-accent-600 hover:text-accent-900 dark:text-accent-400 dark:hover:text-accent-100"
      aria-label="Go back to staff roles list"
      on:click={() => goto("/staff-roles")}
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
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Edit Staff Role
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Update team staff role details
      </p>
    </div>
  </div>

  <LoadingStateWrapper
    state={loading_state}
    loading_text="Loading role..."
    {error_message}
  >
    <form
      on:submit={handle_submit}
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 space-y-6"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label
            for="name"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Role Name *
          </label>
          <input
            type="text"
            id="name"
            bind:value={name}
            placeholder="e.g., Head Coach"
            class="w-full px-4 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
            required
          />
        </div>

        <div>
          <label
            for="code"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Code *
          </label>
          <input
            type="text"
            id="code"
            bind:value={code}
            placeholder="e.g., HEAD_COACH"
            class="w-full px-4 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100 font-mono"
            required
          />
        </div>
      </div>

      <div>
        <label
          for="description"
          class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          bind:value={description}
          rows="3"
          placeholder="Optional description of this role..."
          class="w-full px-4 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label
            for="category"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Category
          </label>
          <select
            id="category"
            bind:value={category}
            class="w-full px-4 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
          >
            <option value="coaching">Coaching</option>
            <option value="medical">Medical</option>
            <option value="administrative">Administrative</option>
            <option value="technical">Technical</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label
            for="display_order"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Display Order
          </label>
          <input
            type="number"
            id="display_order"
            bind:value={display_order}
            min="0"
            class="w-full px-4 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label
            for="status"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            bind:value={status}
            class="w-full px-4 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div class="flex items-center pt-6">
          <input
            type="checkbox"
            id="is_primary_contact"
            bind:checked={is_primary_contact}
            class="h-4 w-4 text-primary-600 border-accent-300 rounded focus:ring-primary-500"
          />
          <label
            for="is_primary_contact"
            class="ml-2 text-sm text-accent-700 dark:text-accent-300"
          >
            Primary Contact Role
          </label>
        </div>
      </div>

      <div
        class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-accent-200 dark:border-accent-700"
      >
        <button
          type="button"
          class="btn btn-outline"
          on:click={() => goto("/staff-roles")}
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
