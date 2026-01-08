<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Official } from "$lib/domain/entities/Official";
  import type { Organization } from "$lib/domain/entities/Organization";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_official_use_cases } from "$lib/usecases/OfficialUseCases";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import {
    get_official_full_name,
    OFFICIAL_ROLE_OPTIONS,
    CERTIFICATION_LEVEL_OPTIONS,
  } from "$lib/domain/entities/Official";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import ConfirmationModal from "$lib/components/ui/ConfirmationModal.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const official_use_cases = get_official_use_cases();
  const organization_use_cases = get_organization_use_cases();

  let officials: Official[] = [];
  let organizations_map: Map<string, Organization> = new Map();
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let search_query: string = "";
  let current_page: number = 1;
  let total_pages: number = 1;
  let total_items: number = 0;
  let items_per_page: number = 10;

  let show_delete_modal: boolean = false;
  let official_to_delete: Official | null = null;
  let is_deleting: boolean = false;

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  onMount(async () => {
    await load_organizations();
    await load_officials();
  });

  async function load_organizations(): Promise<void> {
    const result = await organization_use_cases.list_organizations(undefined, {
      page_size: 100,
    });
    if (result.success) {
      organizations_map = new Map(
        result.data.items.map((org) => [org.id, org])
      );
    }
  }

  async function load_officials(): Promise<void> {
    loading_state = "loading";
    error_message = "";

    const filter = search_query ? { name_contains: search_query } : undefined;
    const result = await official_use_cases.list_officials(filter, {
      page_number: current_page,
      page_size: items_per_page,
    });

    if (!result.success) {
      loading_state = "error";
      error_message = result.error;
      return;
    }

    officials = result.data.items;
    total_items = result.data.total_count;
    total_pages = result.data.total_pages;
    loading_state = "success";
  }

  function get_organization_name(organization_id: string): string {
    return organizations_map.get(organization_id)?.name || "Unknown";
  }

  function get_role_label(role: string): string {
    return (
      OFFICIAL_ROLE_OPTIONS.find((opt) => opt.value === role)?.label || role
    );
  }

  function get_certification_label(level: string): string {
    return (
      CERTIFICATION_LEVEL_OPTIONS.find((opt) => opt.value === level)?.label ||
      level
    );
  }

  function handle_search(event: CustomEvent<{ query: string }>): void {
    search_query = event.detail.query;
    current_page = 1;
    load_officials();
  }

  function handle_page_change(event: CustomEvent<{ page: number }>): void {
    current_page = event.detail.page;
    load_officials();
  }

  function navigate_to_create(): void {
    goto("/officials/create");
  }

  function navigate_to_edit(official: Official): void {
    goto(`/officials/${official.id}`);
  }

  function request_delete(official: Official): void {
    official_to_delete = official;
    show_delete_modal = true;
  }

  async function confirm_delete(): Promise<void> {
    if (!official_to_delete) return;

    is_deleting = true;
    const result = await official_use_cases.delete_official(
      official_to_delete.id
    );
    is_deleting = false;

    if (!result.success) {
      show_delete_modal = false;
      show_toast(`Failed to delete official: ${result.error}`, "error");
      return;
    }

    show_delete_modal = false;
    official_to_delete = null;
    show_toast("Official deleted successfully", "success");
    load_officials();
  }

  function cancel_delete(): void {
    show_delete_modal = false;
    official_to_delete = null;
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_status_badge_classes(status: Official["status"]): string {
    const base_classes =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case "active":
        return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case "inactive":
        return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case "suspended":
        return `${base_classes} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      case "retired":
        return `${base_classes} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      default:
        return base_classes;
    }
  }

  function get_certification_badge_classes(level: string): string {
    const base_classes =
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";

    switch (level) {
      case "international":
        return `${base_classes} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400`;
      case "national":
        return `${base_classes} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      case "regional":
        return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case "local":
        return `${base_classes} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      default:
        return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  }
</script>

<svelte:head>
  <title>Officials - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Game Officials
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Manage referees, umpires, and other match officials
      </p>
    </div>

    <button
      type="button"
      class="btn btn-primary w-full sm:w-auto"
      on:click={navigate_to_create}
    >
      <svg
        class="h-5 w-5 mr-2"
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
      Add Official
    </button>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-4 border-b border-accent-200 dark:border-accent-700">
      <div class="max-w-md">
        <SearchInput
          placeholder="Search officials..."
          value={search_query}
          is_loading={loading_state === "loading"}
          on:search={handle_search}
        />
      </div>
    </div>

    <LoadingStateWrapper
      state={loading_state}
      {error_message}
      loading_text="Loading officials..."
    >
      {#if officials.length === 0}
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
          >
            No officials found
          </h3>
          <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
            {search_query
              ? "Try adjusting your search criteria"
              : "Get started by adding a new official"}
          </p>
          {#if !search_query}
            <button
              type="button"
              class="btn btn-primary mt-4"
              on:click={navigate_to_create}
            >
              Add Official
            </button>
          {/if}
        </div>
      {:else}
        <div class="hidden md:block overflow-x-auto">
          <table
            class="min-w-full divide-y divide-accent-200 dark:divide-accent-700"
          >
            <thead class="bg-accent-50 dark:bg-accent-900/50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Official</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Role</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Certification</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Organization</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Status</th
                >
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Actions</th
                >
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-accent-800 divide-y divide-accent-200 dark:divide-accent-700"
            >
              {#each officials as official}
                <tr class="hover:bg-accent-50 dark:hover:bg-accent-700/50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
                      >
                        <span
                          class="text-sm font-medium text-primary-600 dark:text-primary-400"
                        >
                          {official.first_name.charAt(
                            0
                          )}{official.last_name.charAt(0)}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div
                          class="text-sm font-medium text-accent-900 dark:text-accent-100"
                        >
                          {get_official_full_name(official)}
                        </div>
                        <div
                          class="text-sm text-accent-500 dark:text-accent-400"
                        >
                          {official.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {get_role_label(official.role)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class={get_certification_badge_classes(
                        official.certification_level
                      )}
                    >
                      {get_certification_label(official.certification_level)}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {get_organization_name(official.organization_id)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={get_status_badge_classes(official.status)}>
                      {official.status}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  >
                    <button
                      type="button"
                      class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      on:click={() => navigate_to_edit(official)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      on:click={() => request_delete(official)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div
          class="md:hidden divide-y divide-accent-200 dark:divide-accent-700"
        >
          {#each officials as official}
            <div class="p-4">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
                  >
                    <span
                      class="text-sm font-medium text-primary-600 dark:text-primary-400"
                    >
                      {official.first_name.charAt(0)}{official.last_name.charAt(
                        0
                      )}
                    </span>
                  </div>
                  <div>
                    <div
                      class="text-sm font-medium text-accent-900 dark:text-accent-100"
                    >
                      {get_official_full_name(official)}
                    </div>
                    <div
                      class="text-xs text-accent-500 dark:text-accent-400 mt-0.5"
                    >
                      {get_role_label(official.role)}
                    </div>
                  </div>
                </div>
                <span class={get_status_badge_classes(official.status)}>
                  {official.status}
                </span>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  class={get_certification_badge_classes(
                    official.certification_level
                  )}
                >
                  {get_certification_label(official.certification_level)}
                </span>
              </div>

              <div class="mt-2 text-sm text-accent-600 dark:text-accent-400">
                {get_organization_name(official.organization_id)}
              </div>

              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  class="flex-1 btn btn-outline text-sm py-1.5"
                  on:click={() => navigate_to_edit(official)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="flex-1 btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 text-sm py-1.5"
                  on:click={() => request_delete(official)}
                >
                  Delete
                </button>
              </div>
            </div>
          {/each}
        </div>

        <Pagination
          {current_page}
          {total_pages}
          {total_items}
          {items_per_page}
          is_loading={loading_state === "loading"}
          on:page_change={handle_page_change}
        />
      {/if}
    </LoadingStateWrapper>
  </div>
</div>

<ConfirmationModal
  is_visible={show_delete_modal}
  title="Delete Official"
  message="Are you sure you want to delete '{official_to_delete
    ? get_official_full_name(official_to_delete)
    : ''}'? This action cannot be undone."
  confirm_text="Delete"
  is_destructive={true}
  is_processing={is_deleting}
  on:confirm={confirm_delete}
  on:cancel={cancel_delete}
/>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
