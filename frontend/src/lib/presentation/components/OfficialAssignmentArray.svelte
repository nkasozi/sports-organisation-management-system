<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { OfficialAssignment } from "$lib/core/entities/FixtureDetailsSetup";
  import { create_empty_official_assignment } from "$lib/core/entities/FixtureDetailsSetup";
  import SearchableSelectField from "./ui/SearchableSelectField.svelte";
  import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
  import { get_game_official_role_use_cases } from "$lib/core/usecases/GameOfficialRoleUseCases";

  export let assignments: OfficialAssignment[] = [];
  export let disabled: boolean = false;
  export let errors: Record<string, string> = {};

  const dispatch = createEventDispatcher<{
    change: { assignments: OfficialAssignment[] };
  }>();

  const official_use_cases = get_official_use_cases();
  const role_use_cases = get_game_official_role_use_cases();

  type SelectOption = { value: string; label: string };

  let official_options: SelectOption[] = [];
  let role_options: SelectOption[] = [];
  let is_loading = true;

  onMount(async () => {
    await load_options();
    is_loading = false;
  });

  async function load_options(): Promise<void> {
    const [officials_result, roles_result] = await Promise.all([
      official_use_cases.list(undefined, { page_number: 1, page_size: 500 }),
      role_use_cases.list(undefined, { page_number: 1, page_size: 100 }),
    ]);

    console.log("[OFFICIALS] Loading officials result:", officials_result);
    console.log("[OFFICIALS] Loading roles result:", roles_result);

    if (officials_result.success && officials_result.data) {
      const officials_data = officials_result.data as any;
      const officials_list = Array.isArray(officials_data)
        ? officials_data
        : officials_data.items || [];
      official_options = officials_list.map(
        (official: { id: string; first_name: string; last_name: string }) => ({
          value: official.id,
          label: `${official.first_name} ${official.last_name}`,
        }),
      );
      console.log("[OFFICIALS] Loaded official_options:", official_options);
    }

    if (roles_result.success && roles_result.data) {
      const roles_data = roles_result.data as any;
      const roles_list = Array.isArray(roles_data)
        ? roles_data
        : roles_data.items || [];
      role_options = roles_list.map((role: { id: string; name: string }) => ({
        value: role.id,
        label: role.name,
      }));
      console.log("[OFFICIALS] Loaded role_options:", role_options);
    }
  }

  function handle_assignment_change(
    index: number,
    field: keyof OfficialAssignment,
    value: string,
  ): void {
    const updated_assignments = [...assignments];
    updated_assignments[index] = {
      ...updated_assignments[index],
      [field]: value,
    };
    dispatch("change", { assignments: updated_assignments });
  }

  function add_assignment(): void {
    const updated_assignments = [
      ...assignments,
      create_empty_official_assignment(),
    ];
    dispatch("change", { assignments: updated_assignments });
  }

  function remove_assignment(index: number): void {
    if (assignments.length <= 1) return;
    const updated_assignments = assignments.filter((_, i) => i !== index);
    dispatch("change", { assignments: updated_assignments });
  }

  function get_assignment_error(index: number, field: string): string {
    return errors[`assigned_officials_${index}_${field}`] || "";
  }

  function compute_available_officials(
    all_officials: SelectOption[],
    current_assignments: OfficialAssignment[],
    current_index: number,
  ): SelectOption[] {
    const assigned_official_ids = new Set(
      current_assignments
        .map((a, i) => (i !== current_index ? a.official_id : null))
        .filter((id): id is string => id !== null && id !== ""),
    );

    return all_officials.filter(
      (option) => !assigned_official_ids.has(option.value),
    );
  }

  $: available_officials_by_index = assignments.map((_, index) =>
    compute_available_officials(official_options, assignments, index),
  );
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <span class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Assigned Officials
    </span>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
             bg-accent-600 text-white hover:bg-accent-700
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-colors duration-200"
      on:click={add_assignment}
      {disabled}
    >
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v16m8-8H4"
        />
      </svg>
      Add Official
    </button>
  </div>

  {#if errors.assigned_officials}
    <p class="text-sm text-red-600 dark:text-red-300">
      {errors.assigned_officials}
    </p>
  {/if}

  <div class="space-y-4">
    {#each assignments as assignment, index}
      <div
        class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
      >
        <div class="flex items-start justify-between mb-3">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Official #{index + 1}
          </span>
          {#if assignments.length > 1}
            <button
              type="button"
              class="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                     hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              on:click={() => remove_assignment(index)}
              {disabled}
              title="Remove this official"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          {/if}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <SearchableSelectField
              label="Official"
              name={`official_${index}`}
              value={assignment.official_id}
              options={available_officials_by_index[index] || []}
              placeholder="Select Official"
              required={true}
              {disabled}
              error={get_assignment_error(index, "official")}
              {is_loading}
              on:change={(e) =>
                handle_assignment_change(index, "official_id", e.detail.value)}
            />
          </div>

          <div>
            <SearchableSelectField
              label="Role"
              name={`role_${index}`}
              value={assignment.role_id}
              options={role_options}
              placeholder="Select Role"
              required={true}
              {disabled}
              error={get_assignment_error(index, "role")}
              {is_loading}
              on:change={(e) =>
                handle_assignment_change(index, "role_id", e.detail.value)}
            />
          </div>
        </div>
      </div>
    {/each}
  </div>

  {#if assignments.length === 0}
    <div
      class="p-4 text-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No officials assigned yet. Click "Add Official" to assign officials to
        this fixture.
      </p>
    </div>
  {/if}
</div>
