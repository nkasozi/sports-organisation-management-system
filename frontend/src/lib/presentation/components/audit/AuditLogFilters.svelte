<script lang="ts">
    import { AUDIT_ACTION } from "$lib/core/entities/AuditLog";
    import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";

    import {
        AUDIT_LOG_FILTER_ALL_ACTIONS_VALUE,
        AUDIT_LOG_MESSAGES,
    } from "./auditLogMessages";

    export let filter_entity_type = "";
    export let filter_action = "";
    export let on_filters_changed: () => Promise<void>;

    const ACTION_FILTER_OPTIONS = [
        {
            value: AUDIT_LOG_FILTER_ALL_ACTIONS_VALUE,
            label: AUDIT_LOG_MESSAGES.FILTER_ALL_ACTIONS,
        },
        { value: AUDIT_ACTION.CREATE, label: AUDIT_LOG_MESSAGES.FILTER_CREATE },
        { value: AUDIT_ACTION.UPDATE, label: AUDIT_LOG_MESSAGES.FILTER_UPDATE },
        { value: AUDIT_ACTION.DELETE, label: AUDIT_LOG_MESSAGES.FILTER_DELETE },
    ];

    function choose_action(selected_action: string): Promise<void> {
        filter_action = selected_action;
        return on_filters_changed();
    }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-48">
                <label
                    for="filter_entity_type"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {AUDIT_LOG_MESSAGES.FILTER_ENTITY_TYPE_LABEL}
                </label>
                <input
                    id="filter_entity_type"
                    type="text"
                    bind:value={filter_entity_type}
                    on:input={on_filters_changed}
                    placeholder={AUDIT_LOG_MESSAGES.FILTER_ENTITY_TYPE_PLACEHOLDER}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
            </div>
            <div class="flex-1 min-w-48">
                <label
                    for="searchable-select-filter_action"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {AUDIT_LOG_MESSAGES.FILTER_ACTION_LABEL}
                </label>
                <SearchableSelectField
                    name="filter_action"
                    value={filter_action}
                    options={ACTION_FILTER_OPTIONS}
                    placeholder={AUDIT_LOG_MESSAGES.FILTER_ALL_ACTIONS}
                    on:change={(event) =>
                        void choose_action(event.detail.value)}
                />
            </div>
        </div>
    </div>
</div>
