<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";

    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import {
        get_competition_use_cases,
        get_fixture_lineup_use_cases,
        get_fixture_use_cases,
        get_official_use_cases,
        get_organization_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_sport_use_cases,
        get_team_use_cases,
        get_venue_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import { type LiveGameDetailDataDependencies } from "$lib/presentation/logic/liveGameDetailData";
    import { type LiveGameDetailPageActionDependencies } from "$lib/presentation/logic/liveGameDetailPageActions";
    import {
        create_live_game_detail_event_state,
        create_live_game_detail_modal_state,
        create_live_game_detail_page_state,
        create_live_game_detail_toast_state,
        derive_live_game_detail_view_state,
        get_live_game_page_title,
        type LiveGameDetailEventState,
        type LiveGameDetailModalState,
        type LiveGameDetailPageState,
        type LiveGameDetailToastState,
    } from "$lib/presentation/logic/liveGameDetailPageState";
    import { auth_store } from "$lib/presentation/stores/auth";
    import { branding_store } from "$lib/presentation/stores/branding";

    import { create_live_game_detail_controller_runtime } from "../../logic/liveGameDetailControllerRuntime";
    import LiveGameDetailPageOverlays from "./LiveGameDetailPageOverlays.svelte";
    import LiveGameDetailPageView from "./LiveGameDetailPageView.svelte";

    const data_dependencies: LiveGameDetailDataDependencies = {
        fixture_use_cases: get_fixture_use_cases(),
        team_use_cases: get_team_use_cases(),
        fixture_lineup_use_cases: get_fixture_lineup_use_cases(),
        competition_use_cases: get_competition_use_cases(),
        organization_use_cases: get_organization_use_cases(),
        sport_use_cases: get_sport_use_cases(),
        venue_use_cases: get_venue_use_cases(),
        official_use_cases: get_official_use_cases(),
    };
    const action_dependencies: LiveGameDetailPageActionDependencies = {
        ...data_dependencies,
        player_membership_use_cases: get_player_team_membership_use_cases(),
        player_use_cases: get_player_use_cases(),
    };
    let page_state = create_live_game_detail_page_state(),
        modal_state = create_live_game_detail_modal_state(),
        event_state = create_live_game_detail_event_state(),
        toast_state = create_live_game_detail_toast_state();

    const runtime = create_live_game_detail_controller_runtime({
        action_dependencies,
        data_dependencies,
        fixture_id: () => $page.params.id ?? "",
        get_branding_logo_url: () => get(branding_store).organization_logo_url,
        get_event_state: () => event_state,
        get_modal_state: () => modal_state,
        get_page_state: () => page_state,
        get_view_state: () => view_state,
        goto,
        raw_token: () => {
            const current_token_state = get(auth_store).current_token;

            return current_token_state.status === "present"
                ? current_token_state.token.raw_token
                : "";
        },
        set_event_state: (state: LiveGameDetailEventState) =>
            (event_state = state),
        set_modal_state: (state: LiveGameDetailModalState) =>
            (modal_state = state),
        set_page_state: (state: LiveGameDetailPageState) =>
            (page_state = state),
        set_toast_state: (state: LiveGameDetailToastState) =>
            (toast_state = state),
    });

    $: view_state = derive_live_game_detail_view_state({
        page_state,
        event_state,
    });
    $: page_title = get_live_game_page_title(page_state);
    $: if (
        view_state.remaining_seconds_in_period <= 0 &&
        page_state.is_clock_running
    )
        runtime.stop_clock();

    function navigate_back(): void {
        void goto("/live-games");
    }
    onMount(runtime.initialize);

    onDestroy(runtime.cleanup);
</script>

<svelte:head><title>{page_title} - Sports Management</title></svelte:head>

<LiveGameDetailPageView
    {page_state}
    {view_state}
    on_back={navigate_back}
    on_start={() => (modal_state = { ...modal_state, show_start_modal: true })}
    on_toggle_clock={runtime.toggle_clock}
    on_period_action={() =>
        (modal_state = { ...modal_state, show_period_modal: true })}
    on_extra_time={() =>
        (modal_state = { ...modal_state, show_extra_time_modal: true })}
    on_end={() => (modal_state = { ...modal_state, show_end_modal: true })}
    on_download_match_report={runtime.download_report}
    on_open_event_modal={runtime.open_event_modal}
    on_toggle_home_lineup={() =>
        (page_state = {
            ...page_state,
            home_lineup_expanded: !page_state.home_lineup_expanded,
        })}
    on_toggle_away_lineup={() =>
        (page_state = {
            ...page_state,
            away_lineup_expanded: !page_state.away_lineup_expanded,
        })}
    on_home_time_on_change={(player_id, new_time_on) =>
        runtime.update_player_time_on("home", player_id, new_time_on)}
    on_away_time_on_change={(player_id, new_time_on) =>
        runtime.update_player_time_on("away", player_id, new_time_on)}
/>
<LiveGameDetailPageOverlays
    {page_state}
    {modal_state}
    {event_state}
    {toast_state}
    {view_state}
    on_close_start={() =>
        (modal_state = { ...modal_state, show_start_modal: false })}
    on_start_confirm={runtime.start_game}
    on_end={runtime.end_game}
    on_close_end={() =>
        (modal_state = { ...modal_state, show_end_modal: false })}
    on_confirm_period={runtime.confirm_period_action}
    on_close_period={() =>
        (modal_state = { ...modal_state, show_period_modal: false })}
    on_close_extra_time={() =>
        (modal_state = { ...modal_state, show_extra_time_modal: false })}
    on_confirm_extra_time={runtime.confirm_extra_time}
    on_extra_minutes_change={(minutes) =>
        (page_state = { ...page_state, extra_minutes_to_add: minutes })}
    on_cancel_event={() =>
        (event_state = create_live_game_detail_event_state())}
    on_record_event={runtime.record_event}
    on_select_player={runtime.select_event_player}
    on_select_secondary_player={runtime.select_secondary_player}
    on_event_minute_change={(minute) =>
        (event_state = { ...event_state, event_minute: minute })}
    on_event_description_change={(description) =>
        (event_state = { ...event_state, event_description: description })}
    on_dismiss_toast={() =>
        (toast_state = { ...toast_state, is_visible: false })}
/>
