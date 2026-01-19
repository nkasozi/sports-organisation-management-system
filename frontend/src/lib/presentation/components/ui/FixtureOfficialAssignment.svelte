<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AssignedOfficial } from "$lib/core/entities/Fixture";
  import type { Official } from "$lib/core/entities/Official";
  import type { GameOfficialRole } from "$lib/core/entities/GameOfficialRole";
  import {
    get_official_full_name,
    get_official_avatar,
  } from "$lib/core/entities/Official";
  import SelectField from "./SelectField.svelte";

  export let assigned_officials: AssignedOfficial[] = [];
  export let available_officials: Official[] = [];
  export let available_roles: GameOfficialRole[] = [];
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    change: AssignedOfficial[];
  }>();

  let selected_official_id: string = "";
  let selected_role_id: string = "";
  let show_add_form: boolean = false;

  $: official_options = build_official_options(
    available_officials,
    assigned_officials
  );
  $: role_options = build_role_options(available_roles);

  function build_official_options(
    officials: Official[],
    already_assigned: AssignedOfficial[]
  ): Array<{ value: string; label: string }> {
    const assigned_ids = new Set(already_assigned.map((ao) => ao.official_id));
    return officials
      .filter((official) => !assigned_ids.has(official.id))
      .map((official) => ({
        value: official.id,
        label: get_official_full_name(official),
      }));
  }

  function build_role_options(
    roles: GameOfficialRole[]
  ): Array<{ value: string; label: string }> {
    return roles.map((role) => ({
      value: role.id,
      label: role.name,
    }));
  }

  function get_role_name(role_id: string): string {
    return (
      available_roles.find((r) => r.id === role_id)?.name || "Unknown Role"
    );
  }

  function get_official_by_id(official_id: string): Official | undefined {
    return available_officials.find((o) => o.id === official_id);
  }

  function handle_add_assignment(): void {
    if (!selected_official_id || !selected_role_id) return;

    const selected_role = available_roles.find(
      (r) => r.id === selected_role_id
    );
    if (!selected_role) return;

    const new_assignment: AssignedOfficial = {
      official_id: selected_official_id,
      role_id: selected_role_id,
      role_name: selected_role.name,
    };

    const updated_assignments = [...assigned_officials, new_assignment];
    assigned_officials = updated_assignments;
    dispatch("change", assigned_officials);

    selected_official_id = "";
    selected_role_id = "";
    show_add_form = false;
  }

  function handle_remove_assignment(index: number): void {
    const updated_assignments = assigned_officials.filter(
      (_, i) => i !== index
    );
    assigned_officials = updated_assignments;
    dispatch("change", assigned_officials);
  }

  function handle_official_change(event: CustomEvent<{ value: string }>): void {
    selected_official_id = event.detail.value;
  }

  function handle_role_change(event: CustomEvent<{ value: string }>): void {
    selected_role_id = event.detail.value;
  }

  function handle_cancel_add(): void {
    selected_official_id = "";
    selected_role_id = "";
    show_add_form = false;
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-medium text-accent-900 dark:text-accent-100">
      Assigned Officials ({assigned_officials.length})
    </h3>
    {#if !disabled && !show_add_form && official_options.length > 0}
      <button
        type="button"
        class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
        on:click={() => (show_add_form = true)}
      >
        + Add Official
      </button>
    {/if}
  </div>

  {#if assigned_officials.length === 0 && !show_add_form}
    <div
      class="py-8 px-4 border-2 border-dashed border-accent-300 dark:border-accent-600 rounded-lg text-center"
    >
      <svg
        class="mx-auto h-10 w-10 text-accent-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
        No officials assigned yet
      </p>
      {#if !disabled && official_options.length > 0}
        <button
          type="button"
          class="mt-3 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          on:click={() => (show_add_form = true)}
        >
          Assign first official
        </button>
      {:else if available_officials.length === 0}
        <p class="mt-2 text-xs text-accent-400 dark:text-accent-500">
          No officials available. Create officials first.
        </p>
      {/if}
    </div>
  {/if}

  {#if assigned_officials.length > 0}
    <div class="space-y-2">
      {#each assigned_officials as assignment, index}
        {@const official = get_official_by_id(assignment.official_id)}
        <div
          class="flex items-center justify-between p-3 bg-accent-50 dark:bg-accent-700/50 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <img
              src={official ? get_official_avatar(official) : ""}
              alt=""
              class="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div class="font-medium text-accent-900 dark:text-accent-100">
                {official
                  ? get_official_full_name(official)
                  : "Unknown Official"}
              </div>
              <div class="text-sm text-accent-500 dark:text-accent-400">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400"
                >
                  {assignment.role_name || get_role_name(assignment.role_id)}
                </span>
              </div>
            </div>
          </div>
          {#if !disabled}
            <button
              type="button"
              class="p-1.5 text-accent-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-600"
              on:click={() => handle_remove_assignment(index)}
              aria-label="Remove official assignment"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if show_add_form}
    <div
      class="p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg border border-accent-200 dark:border-accent-600 space-y-4"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          name="official"
          label="Select Official"
          placeholder="Choose an official"
          options={official_options}
          value={selected_official_id}
          required
          on:change={handle_official_change}
        />

        <SelectField
          name="role"
          label="Assign Role"
          placeholder="Choose a role"
          options={role_options}
          value={selected_role_id}
          required
          on:change={handle_role_change}
        />
      </div>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="btn btn-outline text-sm py-1.5 px-3"
          on:click={handle_cancel_add}
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary text-sm py-1.5 px-3"
          disabled={!selected_official_id || !selected_role_id}
          on:click={handle_add_assignment}
        >
          Add Assignment
        </button>
      </div>
    </div>
  {/if}
</div>
