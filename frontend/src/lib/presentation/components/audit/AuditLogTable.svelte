<script lang="ts">
    import type { AuditLog } from "$lib/core/entities/AuditLog";

    import {
        compute_audit_log_total_pages,
        format_audit_log_changes,
        format_audit_log_timestamp,
        get_audit_log_action_badge_class,
    } from "../../logic/auditLogPageState";

    export let audit_logs: AuditLog[] = [];
    export let is_loading: boolean;
    export let error_message = "";
    export let total_count: number;
    export let current_page: number;
    export let page_size: number;
    export let on_page_change: (new_page: number) => Promise<void>;
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
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
            <table
                class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            >
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >Timestamp</th
                        >
                        <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >User</th
                        >
                        <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >Action</th
                        >
                        <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >Entity Type</th
                        >
                        <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >Entity</th
                        >
                        <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >Changes</th
                        >
                    </tr>
                </thead>
                <tbody
                    class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                >
                    {#each audit_logs as log}
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td
                                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                                >{format_audit_log_timestamp(log.timestamp)}</td
                            >
                            <td
                                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                            >
                                <div>{log.user_display_name}</div>
                                <div
                                    class="text-xs text-gray-500 dark:text-gray-400"
                                >
                                    {log.user_email}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-[0.175rem] text-xs font-medium {get_audit_log_action_badge_class(
                                        log.action,
                                    )}"
                                >
                                    {log.action.toUpperCase()}
                                </span>
                            </td>
                            <td
                                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize"
                                >{log.entity_type}</td
                            >
                            <td
                                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                                >{log.entity_display_name || log.entity_id}</td
                            >
                            <td
                                class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md truncate"
                                title={format_audit_log_changes(log)}
                            >
                                {#if log.action === "update" && log.changes && log.changes.length > 0}
                                    {format_audit_log_changes(log)}
                                {:else if log.action === "create"}
                                    <span
                                        class="text-green-600 dark:text-green-400"
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
                    )} of {total_count} results
                </div>
                <div class="flex gap-2">
                    <button
                        on:click={() => on_page_change(current_page - 1)}
                        disabled={current_page === 1}
                        class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-[0.175rem] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Previous
                    </button>
                    <span
                        class="px-3 py-1 text-sm text-gray-700 dark:text-gray-300"
                    >
                        Page {current_page} of {compute_audit_log_total_pages(
                            total_count,
                            page_size,
                        )}
                    </span>
                    <button
                        on:click={() => on_page_change(current_page + 1)}
                        disabled={current_page >=
                            compute_audit_log_total_pages(
                                total_count,
                                page_size,
                            )}
                        class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-[0.175rem] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Next
                    </button>
                </div>
            </div>
        {/if}
    {/if}
</div>
