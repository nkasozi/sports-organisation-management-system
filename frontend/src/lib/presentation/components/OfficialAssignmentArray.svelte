<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  import type { OfficialAssignment } from "$lib/core/entities/FixtureDetailsSetup";
  import { create_empty_official_assignment } from "$lib/core/entities/FixtureDetailsSetup";
  import type { ScalarInput } from "$lib/core/types/DomainScalars";
  import {
    get_game_official_role_use_cases,
    get_official_use_cases,
  } from "$lib/infrastructure/registry/useCaseFactories";

  import type { SelectOption } from "../logic/officialAssignmentArrayState";
  import {
    compute_available_officials,
    load_assignment_options,
    reload_official_options,
  } from "../logic/officialAssignmentArrayState";
  import OfficialAssignmentRow from "./OfficialAssignmentRow.svelte";

  type EditableOfficialAssignment = ScalarInput<OfficialAssignment>;

  export let assignments: EditableOfficialAssignment[] = [];
  export let disabled: boolean = false;
  export let errors: Record<string, string> = {};
  export let organization_id: string = "";

  const dispatch = createEventDispatcher<{
    change: { assignments: EditableOfficialAssignment[] };
  }>();

  const official_use_cases = get_official_use_cases();
  const role_use_cases = get_game_official_role_use_cases();

  let official_options: SelectOption[] = [];
  let role_options: SelectOption[] = [];
  let is_loading = true;

  onMount(async () => {
    const options = await load_assignment_options({
      organization_id,
      official_use_cases,
      role_use_cases,
    });
    official_options = options.official_options;
    role_options = options.role_options;
    is_loading = false;
  });

  $: {
    if (organization_id) {
      reload_officials_for_organization(organization_id);
    }
  }

  async function reload_officials_for_organization(
    org_id: string,
  ): Promise<boolean> {
    is_loading = true;
    official_options = await reload_official_options({
      organization_id: org_id,
      official_use_cases,
    });
    is_loading = false;
    return true;
  }

  function handle_assignment_change(
    index: number,
    field: keyof EditableOfficialAssignment,
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
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[0.175rem]
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
      <OfficialAssignmentRow
        {assignment}
        {index}
        {disabled}
        available_officials={available_officials_by_index[index] || []}
        {role_options}
        {is_loading}
        official_error={get_assignment_error(index, "official")}
        role_error={get_assignment_error(index, "role")}
        can_remove={assignments.length > 1}
        on_change={handle_assignment_change}
        on_remove={remove_assignment}
      />
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
