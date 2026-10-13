<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { FixtureUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/FixtureUseCasesPort";
    import { create_managed_game_controller_runtime } from "$lib/presentation/logic/managedGamePageControllerRuntime";
    import {
        build_managed_game_page_title,
        create_managed_game_page_state,
        derive_managed_game_view_state,
        managed_game_primary_events,
        managed_game_secondary_events,
    } from "$lib/presentation/logic/managedGamePageControllerState";
    import {
        close_managed_game_confirmation_modals,
        derive_managed_game_open_modal,
        MANAGED_GAME_MODAL,
        open_managed_game_confirmation_modal,
    } from "$lib/presentation/logic/managedGamePageStateMachine";
    import type {
        ManagedGameLoadResult,
        ManagedGameStartCheck,
    } from "$lib/presentation/logic/managedGamePageTypes";

    import { MANAGED_GAME_TEXT } from "./managedGameMessages";
    import ManagedGamePageView from "./ManagedGamePageView.svelte";
    import { build_managed_game_view_status } from "./managedGameViewStatus";

    export let back_path: string;
    export let back_button_label: string;
    export let error_title: string;
    export let event_modal_component: any;
    export let fixture_use_cases: Pick<
        FixtureUseCasesPort,
        "start_fixture" | "end_fixture" | "record_game_event" | "update_period"
    >;
    export let load_bundle: (
        fixture_id: string,
    ) => Promise<ManagedGameLoadResult>;
    export let before_start: (
        fixture: Fixture,
    ) => Promise<ManagedGameStartCheck>;

    let state = create_managed_game_page_state();

    const runtime = create_managed_game_controller_runtime({
        before_start,
        fixture_use_cases,
        get_fixture_id: () => $page.params.id ?? "",
        get_state: () => state,
        goto,
        load_bundle,
        set_state: (next_state) => (state = next_state),
    });

    $: view_state = derive_managed_game_view_state(state);
    $: page_title = build_managed_game_page_title(state);

    onMount(runtime.initialize);

    onDestroy(runtime.cleanup);
</script>

<svelte:head>
    <title>{page_title} - {MANAGED_GAME_TEXT.PAGE_TITLE_SUFFIX}</title>
</svelte:head>

<ManagedGamePageView
    view_status_state={build_managed_game_view_status(state)}
    home_team_name={view_state.home_team_name}
    away_team_name={view_state.away_team_name}
    home_score={view_state.home_score}
    away_score={view_state.away_score}
    current_period_label={view_state.current_period_label}
    clock_display={view_state.clock_state.clock_display}
    is_clock_running={state.is_clock_running}
    is_game_active={view_state.is_game_active}
    is_updating={state.is_updating}
    primary_events={managed_game_primary_events}
    secondary_events={managed_game_secondary_events}
    sorted_events={view_state.sorted_events}
    open_modal={derive_managed_game_open_modal(state)}
    selected_event_type_state={state.selected_event_type}
    selected_team_side={state.selected_team_side}
    bind:event_minute={state.event_minute}
    bind:event_player_name={state.event_player_name}
    bind:event_description={state.event_description}
    game_clock_seconds={state.game_clock_seconds}
    available_players={view_state.available_players}
    bind:toast_visible={state.toast_visible}
    toast_message={state.toast_message}
    toast_type={state.toast_type}
    {error_title}
    {back_button_label}
    {event_modal_component}
    on_back={() => void goto(back_path)}
    on_start={runtime.handle_start_click}
    on_toggle_clock={runtime.toggle_clock}
    on_end={() =>
        (state = open_managed_game_confirmation_modal(
            state,
            MANAGED_GAME_MODAL.END,
        ))}
    on_end_current_period={runtime.end_current_period}
    on_change_period={runtime.change_period}
    on_open_event_modal={runtime.open_event_modal}
    on_confirm_start={runtime.start_game}
    on_cancel_start={() =>
        (state = close_managed_game_confirmation_modals(state))}
    on_confirm_end={runtime.end_game}
    on_cancel_end={() =>
        (state = close_managed_game_confirmation_modals(state))}
    on_cancel_event={runtime.cancel_event}
    on_record_event={runtime.record_event}
/>
