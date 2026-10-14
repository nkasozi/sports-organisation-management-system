<script lang="ts">
    import { createEventDispatcher } from "svelte";

    import {
        type ConflictResolutionAction,
        ConflictResolutionActionKind,
        type FieldDifference,
    } from "$lib/infrastructure/sync/conflictTypes";
    import MergeConflictDifferences from "$lib/presentation/components/mergeConflict/MergeConflictDifferences.svelte";
    import MergeConflictFooter from "$lib/presentation/components/mergeConflict/MergeConflictFooter.svelte";
    import MergeConflictHeader from "$lib/presentation/components/mergeConflict/MergeConflictHeader.svelte";
    import MergeConflictResolutionNotice from "$lib/presentation/components/mergeConflict/MergeConflictResolutionNotice.svelte";
    import MergeConflictResolutionOptions from "$lib/presentation/components/mergeConflict/MergeConflictResolutionOptions.svelte";
    import MergeConflictSummary from "$lib/presentation/components/mergeConflict/MergeConflictSummary.svelte";
    import SyncReviewPanel from "$lib/presentation/components/mergeConflict/SyncReviewPanel.svelte";
    import {
        build_merge_conflict_resolved_data,
        format_merge_conflict_timestamp,
        format_merge_conflict_value,
        get_merge_conflict_selected_value_source,
        MERGE_CONFLICT_VALUE_SOURCE,
        type MergeConflictValueSource,
    } from "$lib/presentation/logic/mergeConflictScreenLogic";
    import { conflict_store } from "$lib/presentation/stores/conflictStore";
    import {
        conflict_progress,
        current_conflict,
        pending_conflicts,
        show_merge_screen,
    } from "$lib/presentation/stores/conflictStoreDerived";
    import {
        type CurrentConflictState,
        CurrentConflictStatus,
    } from "$lib/presentation/stores/conflictStoreHelpers";
    import {
        build_resolution_notice,
        HIDDEN_RESOLUTION_NOTICE,
        is_attention_needed,
        type ResolutionNotice,
        resolve_conflicts_in_order,
    } from "$lib/presentation/stores/conflictStoreResolutionFlow";
    import { sync_review_store } from "$lib/presentation/stores/conflictStoreSyncReviewInstance";
    import type {
        SyncReviewDecisionValue,
        SyncReviewItem,
    } from "$lib/presentation/stores/conflictStoreSyncReviewTypes";
    import { sync_store } from "$lib/presentation/stores/syncStore";
    import type { ConflictResolutionFeedback } from "$lib/presentation/stores/syncStoreConflictOutcome";

    const dispatch = createEventDispatcher<{ dismiss: void }>();
    let resolution_notice: ResolutionNotice = HIDDEN_RESOLUTION_NOTICE;
    let is_resolving = false;

    let custom_merge_values: Record<string, unknown> = {};
    let selected_action: ConflictResolutionAction =
        ConflictResolutionActionKind.KEEP_LOCAL;
    let current_conflict_state: CurrentConflictState = {
        status: CurrentConflictStatus.ABSENT,
    };

    $: current_conflict_state = $current_conflict;

    function advance_after_resolution(): void {
        selected_action = ConflictResolutionActionKind.KEEP_LOCAL;
        custom_merge_values = {};
        if (!conflict_store.move_to_next_conflict()) dispatch("dismiss");
    }

    function apply_feedback(feedback: ConflictResolutionFeedback): void {
        resolution_notice = build_resolution_notice(feedback);
        if (!is_attention_needed(feedback)) advance_after_resolution();
    }

    async function handle_resolve_current(): Promise<void> {
        if (is_resolving) return;
        if (current_conflict_state.status !== CurrentConflictStatus.PRESENT)
            return;
        const conflict = current_conflict_state.conflict;
        const resolved_data =
            selected_action === ConflictResolutionActionKind.MERGE
                ? build_merge_conflict_resolved_data(
                      conflict,
                      custom_merge_values,
                  )
                : void 0;
        is_resolving = true;
        const feedback = await sync_store.resolve_conflict_and_sync(
            conflict,
            selected_action,
            resolved_data,
        );
        is_resolving = false;
        apply_feedback(feedback);
    }

    function handle_select_field_value(
        field_name: string,
        source: Exclude<
            MergeConflictValueSource,
            typeof MERGE_CONFLICT_VALUE_SOURCE.NONE
        >,
        difference: FieldDifference,
    ): void {
        custom_merge_values[field_name] =
            source === MERGE_CONFLICT_VALUE_SOURCE.LOCAL
                ? difference.local_value
                : difference.remote_value;
    }

    function handle_dismiss(): void {
        conflict_store.dismiss_merge_screen();
        dispatch("dismiss");
    }

    async function resolve_all(
        action: ConflictResolutionAction,
    ): Promise<void> {
        if (is_resolving) return;
        is_resolving = true;
        const feedback = await resolve_conflicts_in_order(
            (conflict, chosen_action) =>
                sync_store.resolve_conflict_and_sync(conflict, chosen_action),
            [...$pending_conflicts],
            action,
        );
        is_resolving = false;
        resolution_notice = build_resolution_notice(feedback);
        if (is_attention_needed(feedback)) return;
        conflict_store.dismiss_merge_screen();
        dispatch("dismiss");
    }

    function handle_review_decision(
        item: SyncReviewItem,
        decision: SyncReviewDecisionValue,
    ): void {
        void sync_review_store.decide(item, decision);
    }
</script>

{#if $show_merge_screen}
    {#if current_conflict_state.status === CurrentConflictStatus.PRESENT}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
            <div
                class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
            >
                <MergeConflictHeader
                    current_progress={$conflict_progress.current}
                    resolved_progress={$conflict_progress.resolved}
                    total_progress={$conflict_progress.total}
                    on_dismiss={handle_dismiss}
                />
                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    <MergeConflictResolutionNotice notice={resolution_notice} />
                    <MergeConflictSummary
                        conflict={current_conflict_state.conflict}
                        format_timestamp={format_merge_conflict_timestamp}
                    />
                    <MergeConflictDifferences
                        differences={current_conflict_state.conflict
                            .field_differences}
                        format_value={format_merge_conflict_value}
                        get_selected_value_source={(field_name, difference) =>
                            get_merge_conflict_selected_value_source(
                                custom_merge_values,
                                field_name,
                                difference,
                            )}
                        on_select_field_value={handle_select_field_value}
                    />
                    <MergeConflictResolutionOptions bind:selected_action />
                </div>
                <MergeConflictFooter
                    on_dismiss={handle_dismiss}
                    on_keep_all_local={() =>
                        void resolve_all(
                            ConflictResolutionActionKind.KEEP_LOCAL,
                        )}
                    on_keep_all_remote={() =>
                        void resolve_all(
                            ConflictResolutionActionKind.KEEP_REMOTE,
                        )}
                    on_resolve_current={() => void handle_resolve_current()}
                />
            </div>
        </div>
    {/if}
{/if}

{#if !($show_merge_screen && current_conflict_state.status === CurrentConflictStatus.PRESENT) && $sync_review_store.is_visible && $sync_review_store.items.length > 0}
    <SyncReviewPanel
        review_state={$sync_review_store}
        on_decide={handle_review_decision}
        on_dismiss={() => sync_review_store.dismiss()}
    />
{/if}
