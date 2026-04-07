<script lang="ts">
    export let is_visible: boolean;
    export let extra_minutes_to_add: number;
    export let is_updating: boolean;
    export let on_close: () => void;
    export let on_confirm: () => Promise<void>;
</script>

{#if is_visible}<div
        class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
    >
        <div
            class="bg-white dark:bg-gray-800 w-full sm:max-w-sm sm:rounded-xl shadow-2xl"
        >
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="font-semibold text-gray-900 dark:text-white text-lg">
                    ⏱️ Add Extra Time
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    How many minutes of extra time to add to the current period?
                </p>
            </div>
            <div class="p-4">
                <label
                    for="extra-time-input"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >Minutes to add</label
                ><input
                    id="extra-time-input"
                    type="number"
                    min="1"
                    max="30"
                    bind:value={extra_minutes_to_add}
                    class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
            </div>
            <div
                class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"
            >
                <button
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    on:click={on_close}>Cancel</button
                ><button
                    class="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md disabled:opacity-50"
                    disabled={extra_minutes_to_add < 1 || is_updating}
                    on:click={() => void on_confirm()}
                    >Add {extra_minutes_to_add} min</button
                >
            </div>
        </div>
    </div>{/if}
