<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";
  import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
  import type { BaseEntity } from "$lib/core/entities/BaseEntity";
  import type { TeamProfile } from "$lib/core/entities/TeamProfile";
  import { get_team_profile_use_cases } from "$lib/core/usecases/TeamProfileUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import DynamicEntityForm from "$lib/presentation/components/DynamicEntityForm.svelte";
  import { auth_store } from "$lib/presentation/stores/auth";
  import { access_denial_store } from "$lib/presentation/stores/accessDenial";
  import {
    build_authorization_list_filter,
    check_entity_permission,
    type UserScopeProfile,
  } from "$lib/core/interfaces/ports";
  import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";

  type ViewMode = "list" | "create" | "edit";

  let current_view: ViewMode = "list";
  let profiles: TeamProfile[] = [];
  let selected_profile: TeamProfile | null = null;
  let is_loading = true;
  let error_message = "";
  let foreign_key_options: Record<string, { value: string; label: string }[]> =
    {};
  let can_create: boolean = false;
  let can_edit: boolean = false;
  let can_delete: boolean = false;
  let can_read: boolean = false;

  const profile_use_cases = get_team_profile_use_cases();
  const team_use_cases = get_team_use_cases();

  function build_profile_authorization_filter(): Record<string, string> {
    const auth_state = get(auth_store);
    if (!auth_state.current_profile) return {};
    const entity_fields = ["team_id", "organization_id"];
    return build_authorization_list_filter(
      auth_state.current_profile as UserScopeProfile,
      entity_fields,
    );
  }

  async function load_profiles(): Promise<boolean> {
    is_loading = true;
    error_message = "";

    const filter = build_profile_authorization_filter();
    const result = await profile_use_cases.list(filter);

    if (!result.success) {
      error_message = result.error_message || "Failed to load profiles";
      is_loading = false;
      return false;
    }

    profiles = result.data as TeamProfile[];
    await load_foreign_key_options();
    is_loading = false;
    return true;
  }

  async function load_foreign_key_options(): Promise<void> {
    const filter = build_profile_authorization_filter();
    const teams_result = await team_use_cases.list(filter);
    if (teams_result.success) {
      foreign_key_options["team_id"] = teams_result.data.map(
        (t: { id: any; name: any }) => ({
          value: t.id,
          label: t.name,
        }),
      );
    }
  }

  function handle_create_click(): void {
    if (!can_create) {
      error_message = "You do not have permission to create team profiles.";
      return;
    }
    selected_profile = null;
    current_view = "create";
  }

  function handle_edit_click(profile: TeamProfile): void {
    if (!can_edit) {
      error_message = "You do not have permission to edit team profiles.";
      return;
    }
    selected_profile = profile;
    current_view = "edit";
  }

  function handle_preview_click(profile: TeamProfile): void {
    if (!profile.profile_slug) return;
    window.open(`/team-profile/${profile.profile_slug}`, "_blank");
  }

  async function handle_delete_click(profile: TeamProfile): Promise<boolean> {
    if (!can_delete) {
      error_message = "You do not have permission to delete team profiles.";
      return false;
    }
    if (!confirm(`Are you sure you want to delete this team profile?`))
      return false;

    const result = await profile_use_cases.delete(profile.id);

    if (!result.success) {
      error_message = result.error || "Failed to delete profile";
      return false;
    }

    await load_profiles();
    return true;
  }

  function handle_form_save(entity: BaseEntity, is_new: boolean): void {
    current_view = "list";
    load_profiles();
  }

  function handle_form_cancel(): void {
    current_view = "list";
    selected_profile = null;
  }

  function get_visibility_badge_class(visibility: string): string {
    return visibility === "public"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-accent-100 text-accent-700 dark:bg-accent-700 dark:text-accent-300";
  }

  function get_team_name(team_id: string): string {
    const team_option = foreign_key_options["team_id"]?.find(
      (t) => t.value === team_id,
    );
    return team_option?.label || team_id;
  }

  onMount(async () => {
    if (!browser) return;
    const ensure_result = await ensure_auth_profile();
    if (!ensure_result.success) {
      error_message = ensure_result.error_message;
      is_loading = false;
      return;
    }

    const auth_state = get(auth_store);
    if (!auth_state.current_token || !auth_state.current_profile) {
      error_message = "No user profile found";
      is_loading = false;
      return;
    }

    can_read = check_entity_permission(
      auth_state.current_profile.role,
      "teamprofile",
      "read",
    );
    can_create = check_entity_permission(
      auth_state.current_profile.role,
      "teamprofile",
      "create",
    );
    can_edit = check_entity_permission(
      auth_state.current_profile.role,
      "teamprofile",
      "update",
    );
    can_delete = check_entity_permission(
      auth_state.current_profile.role,
      "teamprofile",
      "delete",
    );

    if (!can_read) {
      await get_authorization_adapter().check_entity_authorized(
        auth_state.current_token.raw_token,
        "teamprofile",
        "read",
      );
      access_denial_store.set_denial(
        "/team-profiles",
        "Access denied: Your role does not have permission to view Team Profiles.",
      );
      goto("/");
      return;
    }

    load_profiles();
  });
</script>

<svelte:head>
  <title>Team Profiles - Sports Management</title>
</svelte:head>

<div class="w-full">
  {#if current_view === "list"}
    {#if error_message}
      <div
        class="rounded-xl border border-secondary-200 dark:border-secondary-800/50 bg-white dark:bg-accent-900 overflow-hidden mb-4"
      >
        <div class="h-1 bg-secondary-400"></div>
        <div class="p-4 flex items-center gap-3">
          <div
            class="flex-shrink-0 w-9 h-9 rounded-full bg-secondary-50 dark:bg-secondary-900/30 flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-secondary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <p class="text-sm font-medium text-accent-800 dark:text-accent-200">
            {error_message}
          </p>
        </div>
      </div>
    {/if}

    <div class="card p-4 sm:p-6 space-y-6 overflow-x-auto">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4"
      >
        <div>
          <h2
            class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100"
          >
            Team Profile List
          </h2>
          <p class="text-sm text-accent-600 dark:text-accent-400">
            {profiles.length}
            {profiles.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div class="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            class="btn btn-primary-action w-auto"
            on:click={handle_create_click}
          >
            Create New
          </button>
        </div>
      </div>

      {#if is_loading}
        <div class="flex items-center justify-center py-12">
          <div
            class="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"
          ></div>
        </div>
      {:else if profiles.length === 0}
        <div class="text-center py-12">
          <svg
            class="mx-auto h-12 w-12 text-accent-400"
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
          <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
          >
            No team profiles yet
          </h3>
          <p class="mt-2 text-accent-500 dark:text-accent-400">
            Create your first team profile to get started.
          </p>
          <button
            type="button"
            class="mt-4 btn btn-primary-action"
            on:click={handle_create_click}
          >
            Create Profile
          </button>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          >
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Team
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Profile Slug
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Visibility
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
            >
              {#each profiles as profile (profile.id)}
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="px-4 py-4 whitespace-nowrap">
                    <div
                      class="text-sm font-medium text-accent-900 dark:text-accent-100"
                    >
                      {get_team_name(profile.team_id)}
                    </div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap">
                    <code
                      class="text-sm text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-700 px-2 py-1 rounded"
                    >
                      {profile.profile_slug}
                    </code>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex px-2 py-1 text-xs font-medium rounded-full {get_visibility_badge_class(
                        profile.visibility,
                      )}"
                    >
                      {profile.visibility}
                    </span>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex px-2 py-1 text-xs font-medium rounded-full {profile.status ===
                      'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-accent-100 text-accent-700 dark:bg-accent-700 dark:text-accent-300'}"
                    >
                      {profile.status}
                    </span>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right">
                    <div class="flex flex-row gap-2 justify-end items-center">
                      <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        on:click={() => handle_preview_click(profile)}
                        title="Preview profile as public visitor"
                      >
                        <svg
                          class="w-4 h-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Preview
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        on:click={() => handle_edit_click(profile)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline btn-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        on:click={() => handle_delete_click(profile)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {:else if current_view === "create"}
    <div class="space-y-4">
      <button
        type="button"
        class="btn btn-outline"
        on:click={handle_form_cancel}
      >
        <svg
          class="w-5 h-5 mr-2"
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
        Back to List
      </button>
      <div class="card p-6">
        <h2 class="text-xl font-bold text-accent-900 dark:text-accent-100 mb-6">
          Create Team Profile
        </h2>
        <DynamicEntityForm
          entity_type="TeamProfile"
          entity_data={null}
          is_mobile_view={false}
          crud_handlers={null}
          view_callbacks={{
            on_save_completed: handle_form_save,
            on_cancel: handle_form_cancel,
          }}
        />
      </div>
    </div>
  {:else if current_view === "edit"}
    <div class="space-y-4">
      <button
        type="button"
        class="btn btn-outline"
        on:click={handle_form_cancel}
      >
        <svg
          class="w-5 h-5 mr-2"
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
        Back to List
      </button>
      <div class="card p-6">
        <h2 class="text-xl font-bold text-accent-900 dark:text-accent-100 mb-6">
          Edit Team Profile
        </h2>
        <DynamicEntityForm
          entity_type="TeamProfile"
          entity_data={selected_profile}
          is_mobile_view={false}
          crud_handlers={null}
          view_callbacks={{
            on_save_completed: handle_form_save,
            on_cancel: handle_form_cancel,
          }}
        />
      </div>
    </div>
  {/if}
</div>
