<script lang="ts">
    import type { GameEvent } from "$lib/core/entities/Fixture";
    import {
        format_event_time,
        get_event_icon,
        get_event_label,
    } from "$lib/core/entities/Fixture";
    import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
    import type { GameEventCorrection } from "$lib/core/usecases/FixtureGameEventCorrections";
    import { get_event_bg_class } from "$lib/presentation/logic/gameEventDisplay";
    import {
        LIVE_EVENT_CORRECTION_KIND,
        type LiveEventCorrectionRequest,
    } from "$lib/presentation/logic/liveGameEventCorrection";

    import LiveGameEventEditDialog from "./LiveGameEventEditDialog.svelte";
    import LiveGameEventRemoveDialog from "./LiveGameEventRemoveDialog.svelte";

    export let event: GameEvent;
    export let is_home: boolean;
    export let can_correct: boolean;
    export let edit_cost_text: string;
    export let team_players: LineupPlayer[];
    export let on_correct: (
        request: LiveEventCorrectionRequest,
    ) => Promise<boolean>;

    let is_editing = false,
        is_confirming_removal = false,
        is_saving = false;

    $: event_label = event.description || get_event_label(event.event_type);
    $: event_description = [
        event_label,
        format_event_time(event.minute, event.stoppage_time_minute),
        event.player_name,
    ]
        .filter(Boolean)
        .join(" ");
    $: card_class = is_home
        ? `text-right ${get_event_bg_class(event.event_type).replace("border-l-", "border-r-")} border-r-4`
        : `text-left ${get_event_bg_class(event.event_type)} border-l-4`;

    async function send(request: LiveEventCorrectionRequest): Promise<void> {
        is_saving = true;
        const succeeded = await on_correct(request);
        is_saving = false;
        if (!succeeded) return;
        is_editing = false;
        is_confirming_removal = false;
    }

    function save_edit(correction: GameEventCorrection, reason: string): void {
        void send({
            kind: LIVE_EVENT_CORRECTION_KIND.EDIT,
            event,
            correction,
            reason,
        });
    }
</script>

<div class="relative flex items-center">
    <div
        class={`absolute left-1/2 transform -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-4 ${is_home ? "border-blue-400" : "border-red-400"} flex items-center justify-center text-lg shadow-sm`}
    >
        {get_event_icon(event.event_type)}
    </div>
    <div class={`flex-1 pr-8 flex ${is_home ? "justify-end" : ""}`}>
        {#if is_home}<div
                class={`max-w-xs w-full rounded-lg p-3 shadow-sm ${card_class}`}
            >
                <div class="flex items-center justify-end gap-2 mb-1">
                    <span
                        class="font-semibold text-gray-900 dark:text-white text-sm"
                        >{event_label}</span
                    ><span
                        class="text-sm font-bold text-blue-600 dark:text-blue-400"
                        >{format_event_time(
                            event.minute,
                            event.stoppage_time_minute,
                        )}</span
                    >
                </div>
                {#if event.player_name}<p
                        class="text-xs text-gray-500 dark:text-gray-400"
                    >
                        {event.player_name}{#if event.secondary_player_name}
                            → {event.secondary_player_name}{/if}
                    </p>{/if}
                {#if can_correct}<div class="flex justify-end gap-3 mt-2">
                        <button
                            type="button"
                            class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                            aria-label={`Edit ${event_description}`}
                            on:click={() => (is_editing = true)}>Edit</button
                        ><button
                            type="button"
                            class="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                            aria-label={`Delete ${event_description}`}
                            on:click={() => (is_confirming_removal = true)}
                            >Delete</button
                        >
                    </div>{/if}
            </div>{/if}
    </div>
    <div class="flex-1 pl-8 flex justify-start">
        {#if !is_home}<div
                class={`max-w-xs w-full rounded-lg p-3 shadow-sm ${card_class}`}
            >
                <div class="flex items-center justify-start gap-2 mb-1">
                    <span
                        class="text-sm font-bold text-red-600 dark:text-red-400"
                        >{format_event_time(
                            event.minute,
                            event.stoppage_time_minute,
                        )}</span
                    ><span
                        class="font-semibold text-gray-900 dark:text-white text-sm"
                        >{event_label}</span
                    >
                </div>
                {#if event.player_name}<p
                        class="text-xs text-gray-500 dark:text-gray-400"
                    >
                        {event.player_name}{#if event.secondary_player_name}
                            → {event.secondary_player_name}{/if}
                    </p>{/if}
                {#if can_correct}<div class="flex justify-start gap-3 mt-2">
                        <button
                            type="button"
                            class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                            aria-label={`Edit ${event_description}`}
                            on:click={() => (is_editing = true)}>Edit</button
                        ><button
                            type="button"
                            class="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                            aria-label={`Delete ${event_description}`}
                            on:click={() => (is_confirming_removal = true)}
                            >Delete</button
                        >
                    </div>{/if}
            </div>{/if}
    </div>
</div>
{#if is_editing}<LiveGameEventEditDialog
        {event}
        {team_players}
        {is_saving}
        {edit_cost_text}
        on_save={save_edit}
        on_cancel={() => (is_editing = false)}
    />{/if}
{#if is_confirming_removal}<LiveGameEventRemoveDialog
        {event}
        {is_saving}
        {edit_cost_text}
        on_remove={(reason) =>
            void send({
                kind: LIVE_EVENT_CORRECTION_KIND.REMOVE,
                event,
                reason,
            })}
        on_cancel={() => (is_confirming_removal = false)}
    />{/if}
