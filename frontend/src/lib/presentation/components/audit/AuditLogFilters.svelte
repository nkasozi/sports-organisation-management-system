<script lang="ts">
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
                    Entity Type
                </label>
                <input
                    id="filter_entity_type"
                    type="text"
                    bind:value={filter_entity_type}
                    on:input={on_filters_changed}
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
                    on:change={on_filters_changed}
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
</div>
