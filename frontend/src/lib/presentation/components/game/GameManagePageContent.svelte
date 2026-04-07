<script lang="ts">
    import type {
        Fixture,
        GameEvent,
        GamePeriod,
        QuickEventButton,
    } from "$lib/core/entities/Fixture";
    import GameManageControls from "$lib/presentation/components/game/GameManageControls.svelte";
    import GameManageHeader from "$lib/presentation/components/game/GameManageHeader.svelte";
    import GameManageTimeline from "$lib/presentation/components/game/GameManageTimeline.svelte";

    export let fixture: Fixture;
    export let home_team_name: string;
    export let away_team_name: string;
    export let home_score: number;
    export let away_score: number;
    export let current_period_label: string;
    export let clock_display: string;
    export let is_clock_running: boolean;
    export let is_game_active: boolean;
    export let primary_events: QuickEventButton[];
    export let secondary_events: QuickEventButton[];
    export let sorted_events: GameEvent[];
    export let on_back: () => void;
    export let on_start: () => void;
    export let on_toggle_clock: () => void;
    export let on_end: () => void;
    export let on_end_current_period: () => Promise<void>;
    export let on_change_period: (period: GamePeriod) => Promise<void>;
    export let on_open_event_modal: (
        event_button: QuickEventButton,
        team_side: "home" | "away",
    ) => void;
</script>

<div class="flex flex-col h-screen">
    <GameManageHeader
        status={fixture.status}
        scheduled_time={fixture.scheduled_time}
        {home_team_name}
        {away_team_name}
        {home_score}
        {away_score}
        {current_period_label}
        {clock_display}
        {is_clock_running}
        {is_game_active}
        {on_back}
        {on_start}
        {on_toggle_clock}
        {on_end}
    />
    {#if is_game_active}
        <GameManageControls
            current_period={fixture.current_period}
            {is_clock_running}
            {primary_events}
            {secondary_events}
            {home_team_name}
            {away_team_name}
            {on_end_current_period}
            {on_change_period}
            {on_open_event_modal}
        />
    {/if}
    <div class="flex-1 overflow-y-auto px-4 py-6">
        <div class="max-w-3xl mx-auto">
            <GameManageTimeline
                {sorted_events}
                fixture_status={fixture.status}
                {is_game_active}
                {home_team_name}
                {away_team_name}
            />
        </div>
    </div>
</div>
