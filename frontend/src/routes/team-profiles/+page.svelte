<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import type { BaseEntity } from "$lib/core/entities/BaseEntity";
  import type { TeamProfile } from "$lib/core/entities/TeamProfile";
  import { get_team_profile_use_cases } from "$lib/core/usecases/TeamProfileUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import DynamicEntityForm from "$lib/presentation/components/DynamicEntityForm.svelte";

  type ViewMode = "list" | "create" | "edit";

  let current_view: ViewMode = "list";
  let profiles: TeamProfile[] = [];
  let selected_profile: TeamProfile | null = null;
  let is_loading = true;
  let error_message = "";
  let foreign_key_options: Record<string, { value: string; label: string }[]> =
    {};

  const profile_use_cases = get_team_profile_use_cases();
  const team_use_cases = get_team_use_cases();

  async function load_profiles(): Promise<boolean> {
    is_loading = true;
    error_message = "";

    const result = await profile_use_cases.list();

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
    const teams_result = await team_use_cases.list();
    if (teams_result.success) {
      foreign_key_options["team_id"] = teams_result.data.map((t) => ({
        value: t.id,
        label: t.name,
      }));
    }
  }

  function handle_create_click(): void {
    selected_profile = null;
    current_view = "create";
  }

  function handle_edit_click(profile: TeamProfile): void {
    selected_profile = profile;
    current_view = "edit";
  }

  function handle_preview_click(profile: TeamProfile): void {
    if (!profile.profile_slug) return;
    window.open(`/team-profile/${profile.profile_slug}`, "_blank");
  }

  async function handle_delete_click(profile: TeamProfile): Promise<boolean> {
    if (!confirm(`Are you sure you want to delete this team profile?`))
      return false;

    const result = await profile_use_cases.delete(profile.id);

    if (!result.success) {
      error_message = result.error_message || "Failed to delete profile";
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
      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  }

  function get_team_name(team_id: string): string {
    const team_option = foreign_key_options["team_id"]?.find(
      (t) => t.value === team_id,
    );
    return team_option?.label || team_id;
  }

  onMount(() => {
    if (browser) {
      load_profiles();
    }
  });
</script>

<svelte:head>
  <title>Team Profiles - Sports Management</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {#if current_view === "list"}
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Team Profiles
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage shareable team profile pages
          </p>
        </div>
        <button
          type="button"
          class="mt-4 sm:mt-0 btn btn-primary-action"
          on:click={handle_create_click}
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Profile
        </button>
      </div>

      {#if error_message}
        <div
          class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p class="text-red-700 dark:text-red-400">{error_message}</p>
        </div>
      {/if}

      {#if is_loading}
        <div class="flex items-center justify-center py-12">
          <div
            class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"
          ></div>
        </div>
      {:else if profiles.length === 0}
        <div
          class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow"
        >
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
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
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No team profiles yet
          </h3>
          <p class="mt-2 text-gray-500 dark:text-gray-400">
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
        <div
          class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table
              class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            >
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Team
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Profile Slug
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Visibility
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                {#each profiles as profile (profile.id)}
                  <tr
                    class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td class="px-4 py-4 whitespace-nowrap">
                      <div
                        class="text-sm font-medium text-gray-900 dark:text-white"
                      >
                        {get_team_name(profile.team_id)}
                      </div>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap">
                      <code
                        class="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
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
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
                      >
                        {profile.status}
                      </span>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-right">
                      <div class="flex flex-row gap-2 justify-end items-center">
                        <button
                          type="button"
                          class="btn btn-outline btn-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
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
        </div>

        <div
          class="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800"
        >
          <div class="flex items-start gap-3">
            <svg
              class="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="text-sm text-indigo-700 dark:text-indigo-300">
              <p class="font-medium">Sharing Team Profiles</p>
              <p class="mt-1">
                Click "Preview" to view a team profile as it appears to public
                visitors. Use the visibility setting to control who can access
                each profile page.
              </p>
            </div>
          </div>
        </div>
      {/if}
    {:else if current_view === "create"}
      <div class="mb-6">
        <button
          type="button"
          class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center"
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
          Back to list
        </button>
      </div>
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
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
    {:else if current_view === "edit"}
      <div class="mb-6">
        <button
          type="button"
          class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center"
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
          Back to list
        </button>
      </div>
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
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
    {/if}
  </div>
</div>
