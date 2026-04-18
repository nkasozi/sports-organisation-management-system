<script lang="ts">
    import type {
        GamePeriod,
        QuickEventButton,
    } from "$lib/core/entities/Fixture";
    import type { GameEvent } from "$lib/core/entities/Fixture";
    import GameManagePageContent from "$lib/presentation/components/game/GameManagePageContent.svelte";
    import ConfirmationModal from "$lib/presentation/components/ui/ConfirmationModal.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import type {
        ManagedGameFixtureState,
        ManagedGameSelectedEventTypeState,
    } from "$lib/presentation/logic/managedGamePageTypes";

    export let fixture_state!: ManagedGameFixtureState;
    export let home_team_name!: string;
    export let away_team_name!: string;
    export let home_score!: number;
    export let away_score!: number;
    export let current_period_label!: string;
    export let clock_display!: string;
    export let is_clock_running!: boolean;
    export let is_game_active!: boolean;
    export let is_loading!: boolean;
    export let error_message!: string;
    export let is_updating!: boolean;
    export let primary_events!: QuickEventButton[];
    export let secondary_events!: QuickEventButton[];
    export let sorted_events!: GameEvent[];
    export let show_start_modal!: boolean;
    export let show_end_modal!: boolean;
    export let show_event_modal!: boolean;
    export let selected_event_type_state!: ManagedGameSelectedEventTypeState;
    export let selected_team_side!: "home" | "away";
    export let event_minute!: number;
    export let event_player_name!: string;
    export let event_description!: string;
    export let game_clock_seconds!: number;
    export let available_players!: unknown[];
    export let toast_visible!: boolean;
    export let toast_message!: string;
    export let toast_type!: "success" | "error" | "info";
    export let error_title!: string;
    export let back_button_label!: string;
    export let event_modal_component!: any;
    export let on_back!: () => void;
    export let on_start!: () => void | Promise<void>;
    export let on_toggle_clock!: () => void;
    export let on_end!: () => void;
    export let on_end_current_period!: () => Promise<void>;
    export let on_change_period!: (new_period: GamePeriod) => Promise<void>;
    export let on_open_event_modal!: (
        event_button: QuickEventButton,
        team_side: "home" | "away",
    ) => void;
    export let on_confirm_start!: () => Promise<void>;
    export let on_cancel_start!: () => void;
    export let on_confirm_end!: () => Promise<void>;
    export let on_cancel_end!: () => void;
    export let on_cancel_event!: () => void;
    export let on_record_event!: () => Promise<void>;
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    {#if is_loading}
        <div class="flex min-h-screen items-center justify-center">
            <div
                class="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"
            ></div>
        </div>
    {:else if error_message}
        <div class="mx-auto max-w-2xl p-6">
            <div
                class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20"
            >
                <h3
                    class="mb-2 text-lg font-medium text-red-800 dark:text-red-200"
                >
                    {error_title}
                </h3>
                <p class="text-red-600 dark:text-red-400">{error_message}</p>
                <button
                    type="button"
                    class="btn btn-outline mt-4"
                    on:click={on_back}>{back_button_label}</button
                >
            </div>
        </div>
    {:else if fixture_state.status === "present"}
        <GameManagePageContent
            fixture={fixture_state.fixture}
            {home_team_name}
            {away_team_name}
            {home_score}
            {away_score}
            {current_period_label}
            {clock_display}
            {is_clock_running}
            {is_game_active}
            {primary_events}
            {secondary_events}
            {sorted_events}
            {on_back}
            {on_start}
            {on_toggle_clock}
            {on_end}
            {on_end_current_period}
            {on_change_period}
            {on_open_event_modal}
        />
    {/if}
</div>

<ConfirmationModal
    is_visible={show_start_modal}
    title="Start Game"
    message="Are you sure you want to start this game? The match clock will begin."
    confirm_text="Start Game"
    is_processing={is_updating}
    on:confirm={on_confirm_start}
    on:cancel={on_cancel_start}
/>
<ConfirmationModal
    is_visible={show_end_modal}
    title="End Game"
    message={`Are you sure you want to end this game with the current score of ${home_score} - ${away_score}?`}
    confirm_text="End Game"
    is_destructive
    is_processing={is_updating}
    on:confirm={on_confirm_end}
    on:cancel={on_cancel_end}
/>
{#if show_event_modal && selected_event_type_state.status === "present"}
    <svelte:component
        this={event_modal_component}
        bind:event_minute
        bind:event_player_name
        bind:event_description
        selected_event_type={selected_event_type_state.event_type}
        {selected_team_side}
        {home_team_name}
        {away_team_name}
        {game_clock_seconds}
        {is_updating}
        {available_players}
        on_cancel={on_cancel_event}
        on_record={on_record_event}
    />
{/if}
<Toast
    bind:is_visible={toast_visible}
    message={toast_message}
    type={toast_type}
    on:dismiss={() => (toast_visible = false)}
/>
