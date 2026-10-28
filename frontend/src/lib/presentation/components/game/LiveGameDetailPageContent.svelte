<script lang="ts">
    import type { SvelteComponent } from "svelte";

    import type { Fixture, QuickEventButton } from "$lib/core/entities/Fixture";
    import type {
        LineupPlayer,
        PlayerTimeOnStatus,
    } from "$lib/core/entities/FixtureLineup";
    import type { Option } from "$lib/core/types/Option";
    import GameManageTimeline from "$lib/presentation/components/game/GameManageTimeline.svelte";
    import LiveGameHeader from "$lib/presentation/components/game/LiveGameHeader.svelte";
    import LiveGameInfoSummary from "$lib/presentation/components/game/LiveGameInfoSummary.svelte";
    import LiveGameLineupSection from "$lib/presentation/components/game/LiveGameLineupSection.svelte";
    import LiveGamePermissionBanner from "$lib/presentation/components/game/LiveGamePermissionBanner.svelte";
    import LiveGameQuickActions from "$lib/presentation/components/game/LiveGameQuickActions.svelte";
    import type { LiveGameCorrectionAccess } from "$lib/presentation/logic/liveGameCorrectionAccess";
    import type { PeriodButtonConfig } from "$lib/presentation/logic/liveGameDetailState";
    import type { LiveEventCorrectionRequest } from "$lib/presentation/logic/liveGameEventCorrection";

    import type { GameTeamSide } from "./gameDisplayConstants";
    import {
        build_live_game_team_labels,
        LIVE_GAME_DETAIL_CONTENT_STATUS,
        type LiveGameDetailContentState,
    } from "./liveGameDetailContentState";
    import LiveGameDetailLoadError from "./LiveGameDetailLoadError.svelte";

    export let content_state: LiveGameDetailContentState;
    export let organization_name: string;
    export let home_score: number;
    export let away_score: number;
    export let current_period_label: string;
    export let clock_display: string;
    export let is_clock_running: boolean;
    export let can_modify_game: boolean;
    export let is_game_active: boolean;
    export let is_game_completed: boolean;
    export let is_awaiting_full_time: boolean;
    export let show_extra_time_button: boolean;
    export let downloading_report: boolean;
    export let period_button_config: Option<PeriodButtonConfig>;
    export let permission_info_message: string;
    export let all_event_buttons: QuickEventButton[];
    export let home_players: LineupPlayer[];
    export let away_players: LineupPlayer[];
    export let home_starters: LineupPlayer[];
    export let home_substitutes: LineupPlayer[];
    export let away_starters: LineupPlayer[];
    export let away_substitutes: LineupPlayer[];
    export let home_lineup_expanded: boolean;
    export let away_lineup_expanded: boolean;
    export let elapsed_minutes: number;
    export let venue_name: string;
    export let venue_location: string;
    export let home_team_short_name: string;
    export let away_team_short_name: string;
    export let home_team_color: string;
    export let away_team_color: string;
    export let officials_color: string;
    export let assigned_officials: Array<{ name: string; role_name: string }>;
    export let sorted_events: Fixture["game_events"];
    export let on_back: () => void;
    export let on_start: () => void;
    export let on_toggle_clock: () => void;
    export let on_period_action: () => void;
    export let on_extra_time: () => void;
    export let on_end: () => void;
    export let on_download_match_report: () => Promise<boolean>;
    export let on_open_event_modal: (
        event_button: QuickEventButton,
        team_side: GameTeamSide,
    ) => void;
    export let on_toggle_home_lineup: () => void;
    export let on_toggle_away_lineup: () => void;
    export let on_home_time_on_change: (
        player_id: string,
        new_time_on: PlayerTimeOnStatus,
    ) => Promise<boolean>;
    export let on_away_time_on_change: (
        player_id: string,
        new_time_on: PlayerTimeOnStatus,
    ) => Promise<boolean>;
    export let on_correct_event: (
        request: LiveEventCorrectionRequest,
    ) => Promise<boolean>;
    export let correction_access: LiveGameCorrectionAccess;
    export let on_reset_edits: () => Promise<boolean>;

    const live_game_lineup_section_component =
        LiveGameLineupSection as unknown as typeof SvelteComponent;
    const live_game_permission_banner_component =
        LiveGamePermissionBanner as unknown as typeof SvelteComponent;
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    {#if content_state.status === LIVE_GAME_DETAIL_CONTENT_STATUS.LOADING}<div
            class="flex justify-center items-center min-h-screen"
        >
            <div
                class="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"
            ></div>
        </div>{:else if content_state.status === LIVE_GAME_DETAIL_CONTENT_STATUS.FAILED}<LiveGameDetailLoadError
            message={content_state.message}
            {on_back}
        />{:else if content_state.status === LIVE_GAME_DETAIL_CONTENT_STATUS.READY}{@const fixture =
            content_state.fixture}{@const team_labels =
            build_live_game_team_labels(
                fixture,
                content_state.home_team,
                content_state.away_team,
            )}
        <div class="flex flex-col min-h-screen">
            <LiveGameHeader
                {organization_name}
                competition_name={content_state.competition_name}
                fixture_status={fixture.status}
                scheduled_time={fixture.scheduled_time}
                home_team={content_state.home_team}
                away_team={content_state.away_team}
                {home_score}
                {away_score}
                {current_period_label}
                {clock_display}
                {is_clock_running}
                {can_modify_game}
                {is_game_active}
                {is_game_completed}
                {is_awaiting_full_time}
                {show_extra_time_button}
                {downloading_report}
                {period_button_config}
                {on_back}
                {on_start}
                {on_toggle_clock}
                {on_period_action}
                {on_extra_time}
                {on_end}
                {on_download_match_report}
            />{#if permission_info_message}<svelte:component
                    this={live_game_permission_banner_component}
                    {permission_info_message}
                />{/if}{#if is_game_active && can_modify_game}<LiveGameQuickActions
                    home_team_name={team_labels.home_name}
                    away_team_name={team_labels.away_name}
                    {all_event_buttons}
                    {is_clock_running}
                    {on_open_event_modal}
                />{/if}
            <div class="flex-1 px-4 py-6 pb-24">
                <div class="max-w-3xl mx-auto">
                    <svelte:component
                        this={live_game_lineup_section_component}
                        fixture_status={fixture.status}
                        home_team_name={team_labels.lineup_home_name}
                        away_team_name={team_labels.lineup_away_name}
                        {home_players}
                        {away_players}
                        {home_starters}
                        {home_substitutes}
                        {away_starters}
                        {away_substitutes}
                        {home_lineup_expanded}
                        {away_lineup_expanded}
                        {is_game_active}
                        {elapsed_minutes}
                        {on_toggle_home_lineup}
                        {on_toggle_away_lineup}
                        {on_home_time_on_change}
                        {on_away_time_on_change}
                    /><LiveGameInfoSummary
                        {venue_name}
                        {venue_location}
                        {home_team_short_name}
                        {away_team_short_name}
                        {home_team_color}
                        {away_team_color}
                        {officials_color}
                        {assigned_officials}
                    /><GameManageTimeline
                        {sorted_events}
                        fixture_status={fixture.status}
                        {is_game_active}
                        home_team_name={team_labels.home_name}
                        away_team_name={team_labels.away_name}
                        {correction_access}
                        corrections={fixture.event_corrections ?? []}
                        {on_reset_edits}
                        {home_players}
                        {away_players}
                        on_correct={on_correct_event}
                    />
                </div>
            </div>
        </div>{/if}
</div>
