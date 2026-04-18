<script lang="ts">
    export let is_visible: boolean;
    export let on_close: () => void;
    export let on_create: (
        category_name: string,
        category_color: string,
        category_type: string,
    ) => Promise<void>;

    let category_name = "";
    let category_color = "#3B82F6";
    let category_type = "custom";

    function reset_form(): void {
        category_name = "";
        category_color = "#3B82F6";
        category_type = "custom";
    }

    function handle_close(): void {
        reset_form();
        on_close();
    }
    async function handle_create(): Promise<void> {
        await on_create(category_name, category_color, category_type);
        reset_form();
    }
</script>

{#if is_visible}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
            <button
                type="button"
                class="fixed inset-0 bg-black/50 transition-opacity cursor-default border-none p-0"
                aria-label="Close modal"
                tabindex="-1"
                on:click={handle_close}
            ></button>
            <div
                class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
            >
                <div class="flex justify-between items-center">
                    <h3
                        class="text-lg font-semibold text-accent-900 dark:text-accent-100"
                    >
                        Create Category
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
                            for="category_name"
                            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                            >Name *</label
                        ><input
                            id="category_name"
                            type="text"
                            bind:value={category_name}
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
                            placeholder="e.g., Team Building"
                        />
                    </div>
                    <div>
                        <label
                            for="category_color"
                            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                            >Color</label
                        >
                        <div class="flex items-center gap-3">
                            <input
                                id="category_color"
                                type="color"
                                bind:value={category_color}
                                class="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            /><span
                                class="text-sm text-accent-600 dark:text-accent-400"
                                >{category_color}</span
                            >
                        </div>
                    </div>
                    <div>
                        <label
                            for="category_type"
                            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                            >Type</label
                        ><select
                            id="category_type"
                            bind:value={category_type}
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[0.175rem] bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100"
                            ><option value="custom">Custom</option><option
                                value="training">Training</option
                            ><option value="administrative"
                                >Administrative</option
                            ><option value="meeting">Meeting</option><option
                                value="medical">Medical</option
                            ><option value="travel">Travel</option></select
                        >
                    </div>
                </div>
                <div
                    class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                    <button
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-accent-700 dark:text-accent-300 bg-gray-100 dark:bg-gray-700 rounded-[0.175rem] hover:bg-gray-200 dark:hover:bg-gray-600"
                        on:click={handle_close}>Cancel</button
                    ><button
                        type="button"
                        class="btn btn-primary-action"
                        on:click={() => void handle_create()}
                        >Create Category</button
                    >
                </div>
            </div>
        </div>
    </div>
{/if}
