<script lang="ts">
    import {
        get_profile_management_status_badge_class,
        get_profile_management_visibility_badge_class,
        type ProfileManagementRow,
    } from "$lib/presentation/logic/profileManagementPageState";

    export let subject_column_label: string;
    export let list_title: string;
    export let create_button_label: string;
    export let preview_button_label: string;
    export let empty_title: string;
    export let empty_message: string;
    export let is_loading: boolean;
    export let error_message: string;
    export let rows: ProfileManagementRow[];
    export let on_create_requested: () => void;
    export let on_preview_requested: (row: ProfileManagementRow) => void;
    export let on_edit_requested: (row: ProfileManagementRow) => void;
    export let on_delete_requested: (row: ProfileManagementRow) => void;
</script>

<div class="w-full">
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
                <p
                    class="text-sm font-medium text-accent-800 dark:text-accent-200"
                >
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
                    {list_title}
                </h2>
                <p class="text-sm text-accent-600 dark:text-accent-400">
                    {rows.length}
                    {rows.length === 1 ? "item" : "items"}
                </p>
            </div>

            <div class="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                    type="button"
                    class="btn btn-primary-action w-auto"
                    on:click={on_create_requested}
                >
                    {create_button_label}
                </button>
            </div>
        </div>

        {#if is_loading}
            <div class="flex items-center justify-center py-12">
                <div
                    class="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"
                ></div>
            </div>
        {:else if rows.length === 0}
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
                    {empty_title}
                </h3>
                <p class="mt-2 text-accent-500 dark:text-accent-400">
                    {empty_message}
                </p>
                <button
                    type="button"
                    class="mt-4 btn btn-primary-action"
                    on:click={on_create_requested}
                >
                    {create_button_label}
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
                                {subject_column_label}
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
                        {#each rows as row (row.id)}
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div
                                        class="text-sm font-medium text-accent-900 dark:text-accent-100"
                                    >
                                        {row.subject_name}
                                    </div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <code
                                        class="text-sm text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-700 px-2 py-1 rounded"
                                    >
                                        {row.profile_slug}
                                    </code>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <span
                                        class="inline-flex px-2 py-1 text-xs font-medium rounded-full {get_profile_management_visibility_badge_class(
                                            row.visibility,
                                        )}"
                                    >
                                        {row.visibility}
                                    </span>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <span
                                        class="inline-flex px-2 py-1 text-xs font-medium rounded-full {get_profile_management_status_badge_class(
                                            row.status,
                                        )}"
                                    >
                                        {row.status}
                                    </span>
                                </td>
                                <td
                                    class="px-4 py-4 whitespace-nowrap text-right"
                                >
                                    <div
                                        class="flex flex-row gap-2 justify-end items-center"
                                    >
                                        <button
                                            type="button"
                                            class="btn btn-outline btn-sm"
                                            on:click={() =>
                                                on_preview_requested(row)}
                                            title="Preview profile as public visitor"
                                        >
                                            {preview_button_label}
                                        </button>
                                        <button
                                            type="button"
                                            class="btn btn-outline btn-sm"
                                            on:click={() =>
                                                on_edit_requested(row)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            class="btn btn-outline btn-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                            on:click={() =>
                                                on_delete_requested(row)}
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
</div>
