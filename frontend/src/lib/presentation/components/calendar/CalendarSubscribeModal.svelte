<script lang="ts">
    import CalendarSubscriptionManager from "$lib/presentation/components/calendar/CalendarSubscriptionManager.svelte";

    export let is_visible: boolean;
    export let organization_id: string;
    export let on_close: () => void;
</script>

{#if is_visible}
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
                class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="subscribe-modal-title"
            >
                <div
                    class="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
                >
                    <h3
                        id="subscribe-modal-title"
                        class="text-lg font-semibold text-accent-900 dark:text-accent-100"
                    >
                        Subscribe to Calendar
                    </h3>
                    <button
                        type="button"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        aria-label="Close subscription modal"
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
                <div class="p-4">
                    <CalendarSubscriptionManager
                        {organization_id}
                        user_id="default-user"
                    />
                </div>
            </div>
        </div>
    </div>
{/if}
