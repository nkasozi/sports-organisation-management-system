<script lang="ts">
    import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";

    export let selected_event_details: CalendarEvent | null;
    export let on_close: () => void;
</script>

{#if selected_event_details}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
            <button
                type="button"
                class="fixed inset-0 bg-black/50 transition-opacity cursor-default border-none p-0"
                aria-label="Close modal"
                tabindex="-1"
                on:click={on_close}
            ></button>
            <div
                class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
            >
                <div class="flex justify-between items-center">
                    <h3
                        class="text-lg font-semibold text-accent-900 dark:text-accent-100"
                    >
                        {selected_event_details.title}
                    </h3>
                    <button
                        type="button"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Close"
                        on:click={on_close}
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
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <span
                            class="w-3 h-3 rounded-full"
                            style={`background-color: ${selected_event_details.color};`}
                        ></span><span
                            class="text-sm font-medium text-accent-700 dark:text-accent-300"
                            >{selected_event_details.category_name}</span
                        ><span
                            class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 capitalize"
                            >{selected_event_details.source_type}</span
                        >
                    </div>
                    <div
                        class="text-sm text-accent-600 dark:text-accent-400 space-y-1"
                    >
                        <div class="flex items-center gap-2">
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                /></svg
                            ><span
                                >{new Date(
                                    selected_event_details.start,
                                ).toLocaleDateString(undefined, {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}</span
                            >
                        </div>
                        {#if !selected_event_details.all_day}<div
                                class="flex items-center gap-2"
                            >
                                <svg
                                    class="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    /></svg
                                ><span
                                    >{new Date(
                                        selected_event_details.start,
                                    ).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })} - {new Date(
                                        selected_event_details.end,
                                    ).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}</span
                                >
                            </div>{/if}{#if selected_event_details.activity.location}<div
                                class="flex items-center gap-2"
                            >
                                <svg
                                    class="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    /><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    /></svg
                                ><span
                                    >{selected_event_details.activity
                                        .location}</span
                                >
                            </div>{/if}
                    </div>
                    {#if selected_event_details.activity.description}<div
                            class="pt-2 border-t border-gray-200 dark:border-gray-700"
                        >
                            <p
                                class="text-sm text-accent-600 dark:text-accent-400"
                            >
                                {selected_event_details.activity.description}
                            </p>
                        </div>{/if}
                    <div class="pt-2 text-xs text-gray-500 dark:text-gray-500">
                        This event is synced from {selected_event_details.source_type}
                        data and cannot be edited directly.
                    </div>
                </div>
                <div
                    class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                    <button
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-accent-700 dark:text-accent-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        on:click={on_close}>Close</button
                    >
                </div>
            </div>
        </div>
    </div>
{/if}
