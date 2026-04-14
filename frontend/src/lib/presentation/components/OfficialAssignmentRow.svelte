<script lang="ts">
    import type { OfficialAssignment } from "$lib/core/entities/FixtureDetailsSetup";
    import type { ScalarInput } from "$lib/core/types/DomainScalars";
    import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";
    import type { SelectOption } from "$lib/presentation/logic/officialAssignmentArrayState";

    type EditableOfficialAssignment = ScalarInput<OfficialAssignment>;

    export let assignment: EditableOfficialAssignment;
    export let index: number;
    export let disabled: boolean;
    export let available_officials: SelectOption[];
    export let role_options: SelectOption[];
    export let is_loading: boolean;
    export let official_error: string;
    export let role_error: string;
    export let can_remove: boolean;
    export let on_change: (
        index: number,
        field: keyof OfficialAssignment,
        value: string,
    ) => void;
    export let on_remove: (index: number) => void;

    interface $$Props {
        assignment: EditableOfficialAssignment;
        index: number;
        disabled: boolean;
        available_officials: SelectOption[];
        role_options: SelectOption[];
        is_loading: boolean;
        official_error: string;
        role_error: string;
        can_remove: boolean;
        on_change: (
            index: number,
            field: keyof EditableOfficialAssignment,
            value: string,
        ) => void;
        on_remove: (index: number) => void;
    }
</script>

<div
    class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
>
    <div class="flex items-start justify-between mb-3">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
            >Official #{index + 1}</span
        >
        {#if can_remove}
            <button
                type="button"
                class="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                on:click={() => on_remove(index)}
                {disabled}
                title="Remove this official"
            >
                <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                </svg>
            </button>
        {/if}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <SearchableSelectField
                label="Official"
                name={`official_${index}`}
                value={assignment.official_id}
                options={available_officials}
                placeholder="Select Official"
                required={true}
                {disabled}
                error={official_error}
                {is_loading}
                on:change={(event) =>
                    on_change(index, "official_id", event.detail.value)}
            />
        </div>

        <div>
            <SearchableSelectField
                label="Role"
                name={`role_${index}`}
                value={assignment.role_id}
                options={role_options}
                placeholder="Select Role"
                required={true}
                {disabled}
                error={role_error}
                {is_loading}
                on:change={(event) =>
                    on_change(index, "role_id", event.detail.value)}
            />
        </div>
    </div>
</div>
