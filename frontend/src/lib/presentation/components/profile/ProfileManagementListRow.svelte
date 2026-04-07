<script lang="ts">
    import {
        get_profile_management_status_badge_class,
        get_profile_management_visibility_badge_class,
        type ProfileManagementRow,
    } from "$lib/presentation/logic/profileManagementPageState";

    export let row: ProfileManagementRow;
    export let preview_button_label: string;
    export let on_preview_requested: (row: ProfileManagementRow) => void;
    export let on_edit_requested: (row: ProfileManagementRow) => void;
    export let on_delete_requested: (row: ProfileManagementRow) => void;
</script>

<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
    <td class="px-4 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-accent-900 dark:text-accent-100">
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
    <td class="px-4 py-4 whitespace-nowrap text-right">
        <div class="flex flex-row gap-2 justify-end items-center">
            <button
                type="button"
                class="btn btn-outline btn-sm"
                on:click={() => on_preview_requested(row)}
                title="Preview profile as public visitor"
            >
                {preview_button_label}
            </button>
            <button
                type="button"
                class="btn btn-outline btn-sm"
                on:click={() => on_edit_requested(row)}
            >
                Edit
            </button>
            <button
                type="button"
                class="btn btn-outline btn-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                on:click={() => on_delete_requested(row)}
            >
                Delete
            </button>
        </div>
    </td>
</tr>
