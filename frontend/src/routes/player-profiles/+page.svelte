<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import type { BaseEntity } from "$lib/core/entities/BaseEntity";
  import type { PlayerProfile } from "$lib/core/entities/PlayerProfile";
  import { get_player_profile_use_cases } from "$lib/core/usecases/PlayerProfileUseCases";
  import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
  import DynamicEntityForm from "$lib/presentation/components/DynamicEntityForm.svelte";

  type ViewMode = "list" | "create" | "edit";

  let current_view: ViewMode = "list";
  let profiles: PlayerProfile[] = [];
  let selected_profile: PlayerProfile | null = null;
  let is_loading = true;
  let error_message = "";
  let foreign_key_options: Record<string, { value: string; label: string }[]> =
    {};

  const profile_use_cases = get_player_profile_use_cases();
  const player_use_cases = get_player_use_cases();

  async function load_profiles(): Promise<boolean> {
    is_loading = true;
    error_message = "";

    const result = await profile_use_cases.list();

    if (!result.success) {
      error_message = result.error_message || "Failed to load profiles";
      is_loading = false;
      return false;
    }

    profiles = result.data as PlayerProfile[];
    await load_foreign_key_options();
    is_loading = false;
    return true;
  }

  async function load_foreign_key_options(): Promise<void> {
    const players_result = await player_use_cases.list();
    if (players_result.success) {
      foreign_key_options["player_id"] = players_result.data.map((p) => ({
        value: p.id,
        label: `${p.first_name} ${p.last_name}`,
      }));
    }
  }

  function handle_create_click(): void {
    selected_profile = null;
    current_view = "create";
  }

  function handle_edit_click(profile: PlayerProfile): void {
    selected_profile = profile;
    current_view = "edit";
  }

  function handle_preview_click(profile: PlayerProfile): void {
    if (!profile.profile_slug) return;
    window.open(`/profile/${profile.profile_slug}`, "_blank");
  }

  async function handle_delete_click(profile: PlayerProfile): Promise<boolean> {
    if (!confirm(`Are you sure you want to delete this profile?`)) return false;

    const result = await profile_use_cases.delete(profile.id);

    if (!result.success) {
      error_message = result.error_message || "Failed to delete profile";
      return false;
    }

    await load_profiles();
    return true;
  }

  function handle_form_save(
    event: CustomEvent<{ entity: BaseEntity; is_new: boolean }>,
  ): void {
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

  function get_player_name(player_id: string): string {
    const player_option = foreign_key_options["player_id"]?.find(
      (p) => p.value === player_id,
    );
    return player_option?.label || player_id;
  }

  onMount(() => {
    if (browser) {
      load_profiles();
    }
  });
</script>

<svelte:head>
  <title>Player Profiles - Sports Management</title>
</svelte:head>

<div class="w-full">
  {#if current_view === "list"}
    {#if error_message}
      <div
        class="alert bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 p-4 rounded-lg mb-4"
      >
        <p>{error_message}</p>
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
            Player Profile List
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
              d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
          >
            No profiles yet
          </h3>
          <p class="mt-2 text-accent-500 dark:text-accent-400">
            Create your first player profile to get started.
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
                  Player
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
                      {get_player_name(profile.player_id)}
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
  {:else}
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
          {current_view === "create" ? "Create New Profile" : "Edit Profile"}
        </h2>

        {#if current_view === "edit" && selected_profile}
          <div
            class="mb-6 p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <p class="text-sm text-accent-600 dark:text-accent-400">
                Profile URL
              </p>
              <code
                class="text-sm font-medium text-primary-600 dark:text-primary-400"
              >
                /profile/{selected_profile.profile_slug}
              </code>
            </div>
            <button
              type="button"
              class="btn btn-outline btn-sm"
              on:click={() =>
                selected_profile && handle_preview_click(selected_profile)}
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Preview in New Tab
            </button>
          </div>
        {/if}

        <DynamicEntityForm
          entity_type="PlayerProfile"
          entity_data={selected_profile}
          on:save={handle_form_save}
          on:cancel={handle_form_cancel}
        />
      </div>
    </div>
  {/if}
</div>
