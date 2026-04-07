<script lang="ts">
    import type { PlayerTimeOnStatus } from "$lib/core/entities/FixtureLineup";
    import type {
        LiveGameDetailDerivedState,
        LiveGameDetailPageState,
    } from "$lib/presentation/logic/liveGameDetailPageState";

    import LiveGameDetailPageContent from "./LiveGameDetailPageContent.svelte";

    export let page_state: LiveGameDetailPageState;
    export let view_state: LiveGameDetailDerivedState;
    export let on_back: () => void;
    export let on_start: () => void;
    export let on_toggle_clock: () => void;
    export let on_period_action: () => void;
    export let on_extra_time: () => void;
    export let on_end: () => void;
    export let on_download_match_report: () => Promise<boolean>;
    export let on_open_event_modal: (
        event_button: LiveGameDetailDerivedState["all_event_buttons"][number],
        team_side: "home" | "away",
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
</script>

<LiveGameDetailPageContent
    fixture={page_state.fixture}
    home_team={page_state.home_team}
    away_team={page_state.away_team}
    organization_name={page_state.organization_name}
    competition_name={page_state.competition?.name || ""}
    home_score={view_state.home_score}
    away_score={view_state.away_score}
    current_period_label={view_state.current_period_label}
    clock_display={view_state.clock_display}
    is_clock_running={page_state.is_clock_running}
    can_modify_game={page_state.can_modify_game}
    is_game_active={view_state.is_game_active}
    is_game_completed={view_state.is_game_completed}
    show_extra_time_button={view_state.show_extra_time_button}
    downloading_report={page_state.downloading_report}
    period_button_config={view_state.period_button_config}
    permission_info_message={page_state.permission_info_message}
    all_event_buttons={view_state.all_event_buttons}
    home_players={page_state.home_players}
    away_players={page_state.away_players}
    home_starters={view_state.home_starters}
    home_substitutes={view_state.home_substitutes}
    away_starters={view_state.away_starters}
    away_substitutes={view_state.away_substitutes}
    home_lineup_expanded={page_state.home_lineup_expanded}
    away_lineup_expanded={page_state.away_lineup_expanded}
    elapsed_minutes={view_state.elapsed_minutes}
    venue_name={view_state.venue_name}
    venue_location={view_state.venue_location}
    home_team_short_name={view_state.home_team_short_name}
    away_team_short_name={view_state.away_team_short_name}
    home_team_color={view_state.home_team_color}
    away_team_color={view_state.away_team_color}
    officials_color={view_state.officials_color}
    assigned_officials={view_state.assigned_officials}
    sorted_events={view_state.sorted_events}
    is_loading={page_state.is_loading}
    error_message={page_state.error_message}
    {on_back}
    {on_start}
    {on_toggle_clock}
    {on_period_action}
    {on_extra_time}
    {on_end}
    {on_download_match_report}
    {on_open_event_modal}
    {on_toggle_home_lineup}
    {on_toggle_away_lineup}
    {on_home_time_on_change}
    {on_away_time_on_change}
/>
