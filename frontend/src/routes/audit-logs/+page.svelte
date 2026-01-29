<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { get_audit_log_use_cases } from "$lib/core/usecases/AuditLogUseCases";
  import type { AuditLog } from "$lib/core/entities/AuditLog";
  import { build_audit_log_summary } from "$lib/core/entities/AuditLog";

  let audit_logs: AuditLog[] = [];
  let is_loading = true;
  let error_message = "";
  let total_count = 0;
  let current_page = 1;
  let page_size = 25;

  let filter_entity_type = "";
  let filter_action = "";
  let filter_user = "";

  const audit_log_use_cases = get_audit_log_use_cases();

  async function load_audit_logs(): Promise<AuditLog[]> {
    if (!browser) return [];

    is_loading = true;
    error_message = "";

    const filter: Record<string, string> = {};
    if (filter_entity_type) filter.entity_type = filter_entity_type;
    if (filter_action) filter.action = filter_action;
    if (filter_user) filter.user_id = filter_user;

    const result = await audit_log_use_cases.list(filter, {
      page_number: current_page,
      page_size: page_size,
    });

    is_loading = false;

    if (!result.success) {
      error_message = result.error_message || "Failed to load audit logs";
      return [];
    }

    total_count = result.total_count;
    return result.data;
  }

  function format_timestamp(timestamp: string): string {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  function get_action_badge_class(action: string): string {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  }

  function format_changes(log: AuditLog): string {
    if (!log.changes || log.changes.length === 0) return "";
    return log.changes
      .map(
        (change) =>
          `${change.field_name}: "${change.old_value}" → "${change.new_value}"`,
      )
      .join(", ");
  }

  async function handle_filter_change(): Promise<void> {
    current_page = 1;
    audit_logs = await load_audit_logs();
  }

  async function handle_page_change(new_page: number): Promise<void> {
    current_page = new_page;
    audit_logs = await load_audit_logs();
  }

  function compute_total_pages(): number {
    return Math.ceil(total_count / page_size);
  }

  onMount(async () => {
    if (!browser) return;
    audit_logs = await load_audit_logs();
  });
</script>

<svelte:head>
  <title>Audit Trail - Sports Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
      Audit Trail
    </h1>
    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
      View all changes made to entities in the system
    </p>
  </div>

  <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-48">
          <label
            for="filter_entity_type"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Entity Type
          </label>
          <input
            id="filter_entity_type"
            type="text"
            bind:value={filter_entity_type}
            on:input={handle_filter_change}
            placeholder="Filter by entity type..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div class="flex-1 min-w-48">
          <label
            for="filter_action"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Action
          </label>
          <select
            id="filter_action"
            bind:value={filter_action}
            on:change={handle_filter_change}
            class="select-styled w-full"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>
      </div>
    </div>

    {#if is_loading}
      <div class="p-8 text-center">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"
        ></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Loading audit logs...
        </p>
      </div>
    {:else if error_message}
      <div class="p-8 text-center">
        <p class="text-red-600 dark:text-red-400">{error_message}</p>
      </div>
    {:else if audit_logs.length === 0}
      <div class="p-8 text-center">
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No audit logs found
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Audit logs will appear here when changes are made to entities.
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Timestamp
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                User
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Action
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Entity Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Entity
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Changes
              </th>
            </tr>
          </thead>
          <tbody
            class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
          >
            {#each audit_logs as log}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  {format_timestamp(log.timestamp)}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  <div>{log.user_display_name}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {log.user_email}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {get_action_badge_class(
                      log.action,
                    )}"
                  >
                    {log.action.toUpperCase()}
                  </span>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize"
                >
                  {log.entity_type}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  {log.entity_display_name || log.entity_id}
                </td>
                <td
                  class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md truncate"
                  title={format_changes(log)}
                >
                  {#if log.action === "update" && log.changes && log.changes.length > 0}
                    {format_changes(log)}
                  {:else if log.action === "create"}
                    <span class="text-green-600 dark:text-green-400"
                      >New record created</span
                    >
                  {:else if log.action === "delete"}
                    <span class="text-red-600 dark:text-red-400"
                      >Record deleted</span
                    >
                  {:else}
                    -
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if total_count > page_size}
        <div
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
        >
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Showing {(current_page - 1) * page_size + 1} to {Math.min(
              current_page * page_size,
              total_count,
            )}
            of {total_count} results
          </div>
          <div class="flex gap-2">
            <button
              on:click={() => handle_page_change(current_page - 1)}
              disabled={current_page === 1}
              class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <span class="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Page {current_page} of {compute_total_pages()}
            </span>
            <button
              on:click={() => handle_page_change(current_page + 1)}
              disabled={current_page >= compute_total_pages()}
              class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
