<script lang="ts">
    import type { Activity } from "$lib/core/entities/Activity";
    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { ActivityFormValues } from "$lib/presentation/logic/calendarPageState";

    export let is_visible: boolean;
    export let editing_activity: Activity | null;
    export let activity_form_values: ActivityFormValues;
    export let categories: ActivityCategory[];
    export let on_close: () => void;
    export let on_save: () => Promise<void>;
    export let on_delete: () => Promise<void>;

    let modal_position = { x: 0, y: 0 };
    let is_dragging = false;
    let drag_offset = { x: 0, y: 0 };

    function start_modal_drag(event: MouseEvent): void {
        is_dragging = true;
        drag_offset = {
            x: event.clientX - modal_position.x,
            y: event.clientY - modal_position.y,
        };
    }

    function handle_modal_drag(event: MouseEvent): void {
        if (!is_dragging) return;
        modal_position = {
            x: event.clientX - drag_offset.x,
            y: event.clientY - drag_offset.y,
        };
    }

    function stop_modal_drag(): void {
        is_dragging = false;
    }
    function reset_modal_position(): void {
        modal_position = { x: 0, y: 0 };
    }
    function handle_close(): void {
        reset_modal_position();
        on_close();
    }
</script>

{#if is_visible}
    <div
        class="fixed inset-0 z-50 overflow-visible pointer-events-none"
        on:mousemove={handle_modal_drag}
        on:mouseup={stop_modal_drag}
        on:mouseleave={stop_modal_drag}
        role="presentation"
    >
        <button
            type="button"
            class="fixed inset-0 bg-black/30 transition-opacity cursor-default border-none p-0 pointer-events-auto"
            aria-label="Close modal"
            tabindex="-1"
            on:click={handle_close}
        ></button>
        <div
            class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={`transform: translate(calc(-50% + ${modal_position.x}px), calc(-50% + ${modal_position.y}px));`}
        >
            <div
                class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <div
                    class="flex justify-between items-center cursor-move select-none"
                    on:mousedown={start_modal_drag}
                    role="toolbar"
                    tabindex="0"
                >
                    <h3
                        class="text-lg font-semibold text-accent-900 dark:text-accent-100"
                    >
                        {editing_activity ? "Edit Activity" : "Create Activity"}
                    </h3>
                    <button
                        type="button"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Close"
                        on:click={handle_close}
                        ><svg
                            class="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            /></svg
                        ></button
                    >
                </div>

                <div class="space-y-4">
                    <div>
                        <label
                            for="activity_title"
                            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                            >Title *</label
                        ><input
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
                        ><select
                            id="activity_category"
                            bind:value={activity_form_values.category_id}
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
                            ><option value="">Select a category</option
                            >{#each categories as category}<option
                                    value={category.id}>{category.name}</option
                                >{/each}</select
                        >
                    </div>
                    <div>
                        <label
                            for="activity_description"
                            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                            >Description</label
                        ><textarea
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
                        /><label
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
                            ><input
                                id="activity_start_date"
                                type="date"
                                bind:value={activity_form_values.start_date}
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
                            />
                        </div>
                        {#if !activity_form_values.is_all_day}<div>
                                <label
                                    for="activity_start_time"
                                    class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                                    >Start Time</label
                                ><input
                                    id="activity_start_time"
                                    type="time"
                                    bind:value={activity_form_values.start_time}
                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
                                />
                            </div>{/if}
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                for="activity_end_date"
                                class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                                >End Date *</label
                            ><input
                                id="activity_end_date"
                                type="date"
                                bind:value={activity_form_values.end_date}
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
                            />
                        </div>
                        {#if !activity_form_values.is_all_day}<div>
                                <label
                                    for="activity_end_time"
                                    class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                                    >End Time</label
                                ><input
                                    id="activity_end_time"
                                    type="time"
                                    bind:value={activity_form_values.end_time}
                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
                                />
                            </div>{/if}
                    </div>
                    <div>
                        <label
                            for="activity_location"
                            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                            >Location</label
                        ><input
                            id="activity_location"
                            type="text"
                            bind:value={activity_form_values.location}
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
                            placeholder="Optional location"
                        />
                    </div>
                </div>

                <div
                    class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                    {#if editing_activity && editing_activity.source_type === "manual"}
                        <button
                            type="button"
                            class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                            on:click={() => void on_delete()}>Delete</button
                        >
                    {:else}
                        <div></div>
                    {/if}
                    <div class="flex gap-3">
                        <button
                            type="button"
                            class="px-4 py-2 text-sm font-medium text-accent-700 dark:text-accent-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                            on:click={handle_close}>Cancel</button
                        ><button
                            type="button"
                            class="btn btn-primary-action"
                            on:click={() => void on_save()}
                            >{editing_activity
                                ? "Save Changes"
                                : "Create Activity"}</button
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
