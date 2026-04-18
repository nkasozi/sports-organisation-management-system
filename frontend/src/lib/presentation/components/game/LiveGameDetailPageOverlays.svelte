<script lang="ts">
    import ConfirmationModal from "$lib/presentation/components/ui/ConfirmationModal.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import type {
        LiveGameDetailDerivedState,
        LiveGameDetailEventState,
        LiveGameDetailModalState,
        LiveGameDetailPageState,
        LiveGameDetailToastState,
    } from "$lib/presentation/logic/liveGameDetailPageState";

    import LiveGameEventModal from "./LiveGameEventModal.svelte";
    import LiveGameExtraTimeModal from "./LiveGameExtraTimeModal.svelte";
    import LiveGameStartConfirmationDialog from "./LiveGameStartConfirmationDialog.svelte";

    export let page_state: LiveGameDetailPageState;
    export let modal_state: LiveGameDetailModalState;
    export let event_state: LiveGameDetailEventState;
    export let toast_state: LiveGameDetailToastState;
    export let view_state: LiveGameDetailDerivedState;
    export let on_close_start: () => void;
    export let on_start_confirm: () => Promise<void>;
    export let on_end: () => Promise<void>;
    export let on_close_end: () => void;
    export let on_confirm_period: () => Promise<void>;
    export let on_close_period: () => void;
    export let on_close_extra_time: () => void;
    export let on_confirm_extra_time: () => Promise<void>;
    export let on_extra_minutes_change: (minutes: number) => void;
    export let on_cancel_event: () => void;
    export let on_record_event: () => Promise<void>;
    export let on_select_player: (player_id: string) => void;
    export let on_select_secondary_player: (player_id: string) => void;
    export let on_event_minute_change: (minute: number) => void;
    export let on_event_description_change: (description: string) => void;
    export let on_dismiss_toast: () => void;
</script>

<LiveGameStartConfirmationDialog
    pending_start_fixture_state={page_state.fixture
        ? { status: "confirming", fixture: page_state.fixture }
        : { status: "idle" }}
    team_names={view_state.team_names}
    on_cancel={on_close_start}
    on_confirm={() => void on_start_confirm()}
/>
<ConfirmationModal
    is_visible={modal_state.show_end_modal}
    title="End Game"
    message={`Are you sure you want to end this game with the current score of ${view_state.home_score} - ${view_state.away_score}?`}
    confirm_text="End Game"
    is_destructive
    is_processing={page_state.is_updating}
    on:confirm={on_end}
    on:cancel={on_close_end}
/>
{#if view_state.period_button_config}<ConfirmationModal
        is_visible={modal_state.show_period_modal}
        title={view_state.period_button_config.is_end_action
            ? "End Period"
            : "Start Period"}
        message={view_state.period_button_config.message}
        confirm_text={view_state.period_button_config.confirm_text}
        is_destructive={view_state.period_button_config.is_end_action}
        is_processing={page_state.is_updating}
        on:confirm={on_confirm_period}
        on:cancel={on_close_period}
    />{/if}
<LiveGameExtraTimeModal
    is_visible={modal_state.show_extra_time_modal}
    extra_minutes_to_add={page_state.extra_minutes_to_add}
    is_updating={page_state.is_updating}
    on_close={on_close_extra_time}
    on_confirm={on_confirm_extra_time}
    on:extraMinutesChange={(event) => on_extra_minutes_change(event.detail)}
/>
<LiveGameEventModal
    is_visible={event_state.show_event_modal}
    selected_event_type={event_state.selected_event_type}
    selected_team_side={event_state.selected_team_side}
    home_team_name={page_state.home_team?.name || "Home"}
    away_team_name={page_state.away_team?.name || "Away"}
    event_minute={event_state.event_minute}
    game_clock_seconds={page_state.game_clock_seconds}
    is_updating={page_state.is_updating}
    player_select_options={view_state.player_select_options}
    players_on_field_options={view_state.players_on_field_options}
    selected_player_id={event_state.selected_player_id}
    secondary_player_id={event_state.secondary_player_id}
    event_description={event_state.event_description}
    is_substitution_event={view_state.is_substitution_event}
    on_cancel={on_cancel_event}
    on_record={on_record_event}
    {on_select_player}
    {on_select_secondary_player}
    {on_event_minute_change}
    {on_event_description_change}
/>
<Toast
    is_visible={toast_state.is_visible}
    message={toast_state.message}
    type={toast_state.type}
    on:dismiss={on_dismiss_toast}
/>
