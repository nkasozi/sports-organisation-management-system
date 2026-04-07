<script lang="ts">
    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { ActivityFormValues } from "$lib/presentation/logic/calendarPageState";

    export let activity_form_values: ActivityFormValues;
    export let categories: ActivityCategory[];
</script>

<div class="space-y-4">
    <div>
        <label
            for="activity_title"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >Title *</label
        >
        <input
            id="activity_title"
            type="text"
            bind:value={activity_form_values.title}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
            placeholder="e.g., Team Training Session"
        />
    </div>
    <div>
        <label
            for="activity_category"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >Category *</label
        >
        <select
            id="activity_category"
            bind:value={activity_form_values.category_id}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
        >
            <option value="">Select a category</option>
            {#each categories as category}
                <option value={category.id}>{category.name}</option>
            {/each}
        </select>
    </div>
    <div>
        <label
            for="activity_description"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >Description</label
        >
        <textarea
            id="activity_description"
            bind:value={activity_form_values.description}
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
            placeholder="Optional description"
        ></textarea>
    </div>
    <div class="flex items-center gap-2">
        <input
            id="activity_all_day"
            type="checkbox"
            bind:checked={activity_form_values.is_all_day}
            class="w-4 h-4 text-primary-600 border-gray-300 rounded"
        />
        <label
            for="activity_all_day"
            class="text-sm text-accent-700 dark:text-accent-300"
            >All day event</label
        >
    </div>
    <div class="grid grid-cols-2 gap-4">
        <div>
            <label
                for="activity_start_date"
                class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                >Start Date *</label
            >
            <input
                id="activity_start_date"
                type="date"
                bind:value={activity_form_values.start_date}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
            />
        </div>
        {#if !activity_form_values.is_all_day}
            <div>
                <label
                    for="activity_start_time"
                    class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                    >Start Time</label
                >
                <input
                    id="activity_start_time"
                    type="time"
                    bind:value={activity_form_values.start_time}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
                />
            </div>
        {/if}
    </div>
    <div class="grid grid-cols-2 gap-4">
        <div>
            <label
                for="activity_end_date"
                class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                >End Date *</label
            >
            <input
                id="activity_end_date"
                type="date"
                bind:value={activity_form_values.end_date}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
            />
        </div>
        {#if !activity_form_values.is_all_day}
            <div>
                <label
                    for="activity_end_time"
                    class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                    >End Time</label
                >
                <input
                    id="activity_end_time"
                    type="time"
                    bind:value={activity_form_values.end_time}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
                />
            </div>
        {/if}
    </div>
    <div>
        <label
            for="activity_location"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >Location</label
        >
        <input
            id="activity_location"
            type="text"
            bind:value={activity_form_values.location}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
            placeholder="Optional location"
        />
    </div>
</div>
