<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { Organization } from "$lib/domain/entities/Organization";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_organization_use_cases } from "$lib/usecases/OrganizationUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import ConfirmationModal from "$lib/components/ui/ConfirmationModal.svelte";
  import Toast from "$lib/components/ui/Toast.svelte";

  const use_cases = get_organization_use_cases();

  let organizations: Organization[] = [];
  let loading_state: LoadingState = "idle";
  let error_message: string = "";
  let search_query: string = "";
  let current_page: number = 1;
  let total_pages: number = 1;
  let total_items: number = 0;
  let items_per_page: number = 10;

  let show_delete_modal: boolean = false;
  let organization_to_delete: Organization | null = null;
  let is_deleting: boolean = false;

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  onMount(() => {
    load_organizations();
  });

  async function load_organizations(): Promise<void> {
    loading_state = "loading";
    error_message = "";

    const filter = search_query ? { name_contains: search_query } : undefined;
    const result = await use_cases.list_organizations(filter, {
      page_number: current_page,
      page_size: items_per_page,
    });

    if (!result.success) {
      loading_state = "error";
      error_message = result.error;
      return;
    }

    organizations = result.data.items;
    total_items = result.data.total_count;
    total_pages = result.data.total_pages;
    loading_state = "success";
  }

  function handle_search(event: CustomEvent<{ query: string }>): void {
    search_query = event.detail.query;
    current_page = 1;
    load_organizations();
  }

  function handle_page_change(event: CustomEvent<{ page: number }>): void {
    current_page = event.detail.page;
    load_organizations();
  }

  function navigate_to_create(): void {
    goto("/organizations/create");
  }

  function navigate_to_edit(organization: Organization): void {
    goto(`/organizations/${organization.id}`);
  }

  function request_delete(organization: Organization): void {
    organization_to_delete = organization;
    show_delete_modal = true;
  }

  async function confirm_delete(): Promise<void> {
    if (!organization_to_delete) return;

    is_deleting = true;
    const result = await use_cases.delete_organization(
      organization_to_delete.id
    );
    is_deleting = false;

    if (!result.success) {
      show_delete_modal = false;
      show_toast(`Failed to delete organization: ${result.error}`, "error");
      return;
    }

    show_delete_modal = false;
    organization_to_delete = null;
    show_toast("Organization deleted successfully", "success");
    load_organizations();
  }

  function cancel_delete(): void {
    show_delete_modal = false;
    organization_to_delete = null;
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_status_badge_classes(status: Organization["status"]): string {
    const base_classes =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case "active":
        return `${base_classes} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case "inactive":
        return `${base_classes} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case "suspended":
        return `${base_classes} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return base_classes;
    }
  }
</script>

<svelte:head>
  <title>Organizations - Sports Management</title>
</svelte:head>

<div class="space-y-6">
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Organizations
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Manage sports organizations and leagues
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
      New Organization
    </button>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-4 border-b border-accent-200 dark:border-accent-700">
      <div class="max-w-md">
        <SearchInput
          placeholder="Search organizations..."
          value={search_query}
          is_loading={loading_state === "loading"}
          on:search={handle_search}
        />
      </div>
    </div>

    <LoadingStateWrapper
      state={loading_state}
      {error_message}
      loading_text="Loading organizations..."
    >
      {#if organizations.length === 0}
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
          >
            No organizations found
          </h3>
          <p class="mt-2 text-sm text-accent-500 dark:text-accent-400">
            {search_query
              ? "Try adjusting your search criteria"
              : "Get started by creating a new organization"}
          </p>
          {#if !search_query}
            <button
              type="button"
              class="btn btn-primary mt-4"
              on:click={navigate_to_create}
            >
              Create Organization
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
                  >Organization</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Sport</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-accent-500 dark:text-accent-400 uppercase tracking-wider"
                  >Contact</th
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
              {#each organizations as organization}
                <tr class="hover:bg-accent-50 dark:hover:bg-accent-700/50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
                      >
                        <span
                          class="text-sm font-medium text-primary-700 dark:text-primary-400"
                        >
                          {organization.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div
                          class="text-sm font-medium text-accent-900 dark:text-accent-100"
                        >
                          {organization.name}
                        </div>
                        <div
                          class="text-sm text-accent-500 dark:text-accent-400 truncate max-w-xs"
                        >
                          {organization.description || "No description"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {organization.sport_type || "—"}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-accent-600 dark:text-accent-300"
                  >
                    {organization.contact_email || "—"}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={get_status_badge_classes(organization.status)}>
                      {organization.status}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  >
                    <button
                      type="button"
                      class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      on:click={() => navigate_to_edit(organization)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      on:click={() => request_delete(organization)}
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
          {#each organizations as organization}
            <div class="p-4">
              <div class="flex items-start justify-between">
                <div class="flex items-center">
                  <div
                    class="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0"
                  >
                    <span
                      class="text-sm font-medium text-primary-700 dark:text-primary-400"
                    >
                      {organization.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div class="ml-3">
                    <div
                      class="text-sm font-medium text-accent-900 dark:text-accent-100"
                    >
                      {organization.name}
                    </div>
                    <div class="text-sm text-accent-500 dark:text-accent-400">
                      {organization.sport_type || "—"}
                    </div>
                  </div>
                </div>
                <span class={get_status_badge_classes(organization.status)}>
                  {organization.status}
                </span>
              </div>

              {#if organization.description}
                <p
                  class="mt-2 text-sm text-accent-600 dark:text-accent-400 line-clamp-2"
                >
                  {organization.description}
                </p>
              {/if}

              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  class="flex-1 btn btn-outline text-sm py-1.5"
                  on:click={() => navigate_to_edit(organization)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="flex-1 btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 text-sm py-1.5"
                  on:click={() => request_delete(organization)}
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
  title="Delete Organization"
  message="Are you sure you want to delete '{organization_to_delete?.name}'? This action cannot be undone."
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
