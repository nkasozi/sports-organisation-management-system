<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { TeamStaff } from "$lib/core/entities/TeamStaff";
  import type { TeamStaffRole } from "$lib/core/entities/TeamStaffRole";
  import {
    create_empty_team_staff_input,
    get_team_staff_full_name,
    get_team_staff_initials,
    DEFAULT_STAFF_AVATAR,
  } from "$lib/core/entities/TeamStaff";
  import SelectField from "./SelectField.svelte";
  import FormField from "./FormField.svelte";
  import ImageUpload from "./ImageUpload.svelte";

  export let staff_members: TeamStaff[] = [];
  export let available_roles: TeamStaffRole[] = [];
  export let team_id: string = "";
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    add: { staff: TeamStaff };
    remove: { staff_id: string };
    change: TeamStaff[];
  }>();

  let show_add_form: boolean = false;
  let new_staff = create_empty_team_staff_input(team_id, "");

  $: role_options = available_roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  $: category_badge_class = (category: string): string => {
    switch (category) {
      case "coaching":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
      case "medical":
        return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
      case "administrative":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
      case "technical":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300";
      default:
        return "bg-accent-100 text-accent-700 dark:bg-accent-700 dark:text-accent-300";
    }
  };

  function get_role_name(role_id: string): string {
    return (
      available_roles.find((r) => r.id === role_id)?.name || "Unknown Role"
    );
  }

  function get_role_category(role_id: string): string {
    return available_roles.find((r) => r.id === role_id)?.category || "other";
  }

  function handle_add_staff(): void {
    if (!new_staff.role_id || !new_staff.first_name || !new_staff.last_name) {
      return;
    }

    const fake_id = `temp-${Date.now()}`;
    const new_staff_member: TeamStaff = {
      ...new_staff,
      id: fake_id,
      team_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    staff_members = [...staff_members, new_staff_member];
    dispatch("add", { staff: new_staff_member });
    dispatch("change", staff_members);

    new_staff = create_empty_team_staff_input(team_id, "");
    show_add_form = false;
  }

  function handle_remove_staff(staff_id: string): void {
    staff_members = staff_members.filter((s) => s.id !== staff_id);
    dispatch("remove", { staff_id });
    dispatch("change", staff_members);
  }

  function handle_role_change(event: CustomEvent<{ value: string }>): void {
    new_staff.role_id = event.detail.value;
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-medium text-accent-900 dark:text-accent-100">
      Staff Members ({staff_members.length})
    </h3>
    {#if !disabled && !show_add_form}
      <button
        type="button"
        class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
        on:click={() => (show_add_form = true)}
      >
        + Add Staff Member
      </button>
    {/if}
  </div>

  {#if staff_members.length === 0 && !show_add_form}
    <div class="p-4 bg-accent-50 dark:bg-accent-700/30 rounded-lg text-center">
      <p class="text-sm text-accent-600 dark:text-accent-400">
        No staff members added yet. Add coaches, medical staff, and other team
        personnel.
      </p>
    </div>
  {/if}

  {#if staff_members.length > 0}
    <div class="space-y-3">
      {#each staff_members as staff_member}
        <div
          class="p-4 border border-accent-200 dark:border-accent-700 rounded-lg"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div
                class="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-medium text-sm"
              >
                {get_team_staff_initials(staff_member)}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="font-medium text-accent-900 dark:text-accent-100"
                  >
                    {get_team_staff_full_name(staff_member)}
                  </span>
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded-full {category_badge_class(
                      get_role_category(staff_member.role_id)
                    )}"
                  >
                    {get_role_name(staff_member.role_id)}
                  </span>
                </div>
                <div
                  class="mt-1 text-sm text-accent-600 dark:text-accent-400 flex flex-wrap gap-x-4 gap-y-1"
                >
                  {#if staff_member.email}
                    <span>{staff_member.email}</span>
                  {/if}
                  {#if staff_member.phone}
                    <span>{staff_member.phone}</span>
                  {/if}
                </div>
              </div>
            </div>

            {#if !disabled}
              <button
                type="button"
                class="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                on:click={() => handle_remove_staff(staff_member.id)}
                title="Remove staff member"
                aria-label="Remove staff member"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if show_add_form}
    <div
      class="p-4 border-2 border-dashed border-accent-300 dark:border-accent-600 rounded-lg space-y-4"
    >
      <ImageUpload
        current_image_url={new_staff.profile_image_url}
        default_image_url={DEFAULT_STAFF_AVATAR}
        label="Staff Photo"
        on:change={(e) => (new_staff.profile_image_url = e.detail.url)}
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="First Name"
          name="new_first_name"
          bind:value={new_staff.first_name}
          placeholder="Enter first name"
          required={true}
        />

        <FormField
          label="Last Name"
          name="new_last_name"
          bind:value={new_staff.last_name}
          placeholder="Enter last name"
          required={true}
        />

        <SelectField
          label="Role"
          name="new_role_id"
          value={new_staff.role_id}
          options={role_options}
          placeholder="Select role..."
          required={true}
          on:change={handle_role_change}
        />

        <FormField
          label="Email"
          name="new_email"
          type="email"
          bind:value={new_staff.email}
          placeholder="staff@example.com"
        />

        <FormField
          label="Phone"
          name="new_phone"
          type="tel"
          bind:value={new_staff.phone}
          placeholder="+1-555-0123"
        />
      </div>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="btn btn-outline text-sm py-1.5 px-3"
          on:click={() => {
            show_add_form = false;
            new_staff = create_empty_team_staff_input(team_id, "");
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary text-sm py-1.5 px-3"
          disabled={!new_staff.role_id ||
            !new_staff.first_name ||
            !new_staff.last_name}
          on:click={handle_add_staff}
        >
          Add Staff Member
        </button>
      </div>
    </div>
  {/if}
</div>
