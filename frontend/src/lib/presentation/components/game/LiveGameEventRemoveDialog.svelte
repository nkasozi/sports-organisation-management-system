<script lang="ts">
    import type { GameEvent } from "$lib/core/entities/Fixture";
    import { get_event_label } from "$lib/core/entities/Fixture";
    import { REASON_REQUIRED_MESSAGE } from "$lib/presentation/logic/liveGameEventEditForm";

    import LiveGameCorrectionReasonField from "./LiveGameCorrectionReasonField.svelte";

    export let event: GameEvent;
    export let is_saving: boolean;
    export let edit_cost_text: string;
    export let on_remove: (reason: string) => void;
    export let on_cancel: () => void;

    let reason = "";
    let reason_error = "";

    function remove(): void {
        if (!reason.trim()) {
            reason_error = REASON_REQUIRED_MESSAGE;
            return;
        }
        on_remove(reason);
    }
</script>

<div
    class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
>
    <div
        class="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl shadow-2xl"
        role="dialog"
        aria-label="Delete event"
    >
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">
                Delete this {get_event_label(event.event_type).toLowerCase()}?
            </h3>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                It will be removed from the timeline, and the score, stats and
                lineup will be updated.
            </p>
        </div>
        <div class="p-4">
            <LiveGameCorrectionReasonField
                bind:reason
                bind:reason_error
                {edit_cost_text}
            />
        </div>
        <div
            class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"
        >
            <button
                type="button"
                class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                on:click={on_cancel}>Cancel</button
            ><button
                type="button"
                class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-[0.175rem] disabled:opacity-50"
                disabled={is_saving}
                on:click={remove}>{is_saving ? "Deleting..." : "Delete"}</button
            >
        </div>
    </div>
</div>
