<script lang="ts">
    import {
        SyncReviewActionStatus,
        SyncReviewDecision,
        type SyncReviewDecisionValue,
        type SyncReviewItem,
        SyncReviewItemKind,
        type SyncReviewState,
    } from "$lib/presentation/stores/conflictStoreSyncReviewTypes";

    export let review_state: SyncReviewState;
    export let on_decide: (
        item: SyncReviewItem,
        decision: SyncReviewDecisionValue,
    ) => void;
    export let on_dismiss: () => void;

    const REVIEW_COPY = {
        [SyncReviewItemKind.REMOTE_DELETION]: {
            title: "was deleted on another device",
            body: "You changed it on this device after it was deleted elsewhere.",
            keep_label: "Restore it",
            discard_label: "Discard my changes",
        },
        [SyncReviewItemKind.REJECTED_CHANGE]: {
            title: "could not be saved to the server",
            body: "",
            keep_label: "Try again",
            discard_label: "Discard my change",
        },
    } as const;

    function is_working(item: SyncReviewItem): boolean {
        const action_state = review_state.action_state;
        return (
            action_state.status === SyncReviewActionStatus.WORKING &&
            action_state.item_id === item.id
        );
    }

    function read_failure_message(item: SyncReviewItem): string {
        const action_state = review_state.action_state;
        return action_state.status === SyncReviewActionStatus.FAILED &&
            action_state.item_id === item.id
            ? action_state.message
            : "";
    }

    function describe_item(item: SyncReviewItem): string {
        return item.kind === SyncReviewItemKind.REJECTED_CHANGE
            ? item.rejection_message
            : REVIEW_COPY[item.kind].body;
    }
</script>

<div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="sync-review-title"
>
    <div
        class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
    >
        <div class="border-b border-gray-200 bg-violet-50 px-6 py-4">
            <h2
                id="sync-review-title"
                class="text-xl font-semibold text-gray-900"
            >
                Some changes need your decision
            </h2>
            <p class="mt-1 text-sm text-gray-600">
                Nothing has been lost. Choose what to keep for each item.
            </p>
        </div>
        <ul class="flex-1 space-y-4 overflow-y-auto p-6">
            {#each review_state.items as item (item.id)}
                <li class="rounded-lg border border-gray-200 p-4">
                    <p class="font-medium text-gray-900">
                        “{item.entity_display_name}” {REVIEW_COPY[item.kind]
                            .title}
                    </p>
                    {#if describe_item(item)}
                        <p class="mt-1 text-sm text-gray-600">
                            {describe_item(item)}
                        </p>
                    {/if}
                    {#if read_failure_message(item)}
                        <p class="mt-2 text-sm text-red-700" role="alert">
                            {read_failure_message(item)}
                        </p>
                    {/if}
                    <div class="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            disabled={is_working(item)}
                            on:click={() =>
                                on_decide(
                                    item,
                                    SyncReviewDecision.DISCARD_MINE,
                                )}
                            class="rounded-[0.175rem] border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >{REVIEW_COPY[item.kind].discard_label}</button
                        >
                        <button
                            type="button"
                            disabled={is_working(item)}
                            on:click={() =>
                                on_decide(item, SyncReviewDecision.KEEP_MINE)}
                            class="rounded-[0.175rem] bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >{REVIEW_COPY[item.kind].keep_label}</button
                        >
                    </div>
                </li>
            {/each}
        </ul>
        <div class="border-t border-gray-200 bg-gray-50 px-6 py-4 text-right">
            <button
                type="button"
                on:click={on_dismiss}
                class="rounded-[0.175rem] border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >Decide later</button
            >
        </div>
    </div>
</div>
