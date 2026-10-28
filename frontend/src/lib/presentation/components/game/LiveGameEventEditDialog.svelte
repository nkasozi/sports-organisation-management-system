<script lang="ts">
    import type { GameEvent } from "$lib/core/entities/Fixture";
    import {
        get_event_icon,
        get_event_label,
    } from "$lib/core/entities/Fixture";
    import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
    import type { GameEventCorrection } from "$lib/core/usecases/FixtureGameEventCorrections";
    import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";
    import { REASON_REQUIRED_MESSAGE } from "$lib/presentation/logic/liveGameEventEditForm";
    import {
        build_event_correction,
        can_change_event_player,
        create_event_edit_form,
    } from "$lib/presentation/logic/liveGameEventEditForm";

    import LiveGameCorrectionReasonField from "./LiveGameCorrectionReasonField.svelte";

    export let event: GameEvent;
    export let team_players: LineupPlayer[];
    export let is_saving: boolean;
    export let edit_cost_text: string;
    export let on_save: (
        correction: GameEventCorrection,
        reason: string,
    ) => void;
    export let on_cancel: () => void;

    let form = create_event_edit_form(event);
    let reason = "";
    let reason_error = "";

    function save(): void {
        if (!reason.trim()) {
            reason_error = REASON_REQUIRED_MESSAGE;
            return;
        }
        on_save(build_event_correction(event, form, team_players), reason);
    }

    $: player_options = team_players.map((player) => ({
        value: String(player.id),
        label: `#${player.jersey_number ?? "?"} ${player.first_name} ${player.last_name}`,
    }));
</script>

<div
    class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
>
    <div
        class="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-xl shadow-2xl"
        role="dialog"
        aria-label="Edit event"
    >
        <div
            class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3"
        >
            <span class="text-2xl">{get_event_icon(event.event_type)}</span>
            <h3 class="font-semibold text-gray-900 dark:text-white">
                Edit {get_event_label(event.event_type)}
            </h3>
        </div>
        <div class="p-4 space-y-4">
            <div>
                <label
                    for="edit_event_minute"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Game Minute</label
                >
                <input
                    id="edit_event_minute"
                    type="number"
                    min="0"
                    max="150"
                    bind:value={form.minute}
                    class="w-24 px-3 py-2 text-center text-2xl font-mono font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>
            {#if can_change_event_player(event)}
                <SearchableSelectField
                    label="Player"
                    name="edit_event_player"
                    value={form.player_id}
                    options={player_options}
                    placeholder="Search for a player..."
                    on:change={(change) =>
                        (form = { ...form, player_id: change.detail.value })}
                />
            {:else}
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    {event.player_name} → {event.secondary_player_name}. To
                    change the players, remove this substitution and record it
                    again.
                </p>
            {/if}
            <div>
                <label
                    for="edit_event_description"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Description (optional)</label
                ><input
                    id="edit_event_description"
                    type="text"
                    bind:value={form.description}
                    placeholder="Add details..."
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>
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
                class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-[0.175rem] disabled:opacity-50"
                disabled={is_saving}
                on:click={save}
                >{is_saving ? "Saving..." : "✓ Save Changes"}</button
            >
        </div>
    </div>
</div>
