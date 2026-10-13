<script lang="ts">
    import { AUDIT_ACTION } from "$lib/core/entities/AuditLog";

    import {
        AUDIT_LOG_FILTER_ALL_ACTIONS_VALUE,
        AUDIT_LOG_MESSAGES,
    } from "./auditLogMessages";

    export let filter_entity_type = "";
    export let filter_action = "";
    export let on_filters_changed: () => Promise<void>;
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
                    for="filter_action"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                    {AUDIT_LOG_MESSAGES.FILTER_ACTION_LABEL}
                </label>
                <select
                    id="filter_action"
                    bind:value={filter_action}
                    on:change={on_filters_changed}
                    class="select-styled w-full"
                >
                    <option value={AUDIT_LOG_FILTER_ALL_ACTIONS_VALUE}
                        >{AUDIT_LOG_MESSAGES.FILTER_ALL_ACTIONS}</option
                    >
                    <option value={AUDIT_ACTION.CREATE}
                        >{AUDIT_LOG_MESSAGES.FILTER_CREATE}</option
                    >
                    <option value={AUDIT_ACTION.UPDATE}
                        >{AUDIT_LOG_MESSAGES.FILTER_UPDATE}</option
                    >
                    <option value={AUDIT_ACTION.DELETE}
                        >{AUDIT_LOG_MESSAGES.FILTER_DELETE}</option
                    >
                </select>
            </div>
        </div>
    </div>
</div>
