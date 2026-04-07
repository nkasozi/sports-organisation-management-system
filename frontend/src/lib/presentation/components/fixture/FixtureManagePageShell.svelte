<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import {
        type Fixture,
        type GamePeriod,
        get_period_display_name,
        get_quick_event_buttons,
        type QuickEventButton,
    } from "$lib/core/entities/Fixture";
    import type { Team } from "$lib/core/entities/Team";
    import {
        get_fixture_lineup_use_cases,
        get_fixture_use_cases,
        get_player_position_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_team_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import FixtureManageEventModal from "$lib/presentation/components/fixture/FixtureManageEventModal.svelte";
    import GameManagePageContent from "$lib/presentation/components/game/GameManagePageContent.svelte";
    import ConfirmationModal from "$lib/presentation/components/ui/ConfirmationModal.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import { load_fixture_manage_bundle } from "$lib/presentation/logic/fixtureManageData";
    import {
        has_team_submitted_lineup,
        type TeamPlayer,
    } from "$lib/presentation/logic/fixtureManageState";
    import {
        change_game_period,
        end_game_period,
        end_game_session,
        record_game_manage_event,
        start_game_session,
    } from "$lib/presentation/logic/gameManageActions";
    import {
        build_game_clock_state,
        sort_game_events,
    } from "$lib/presentation/logic/gameManageState";

    const fixture_use_cases = get_fixture_use_cases();
    const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
    const team_use_cases = get_team_use_cases();
    const player_use_cases = get_player_use_cases();
    const player_team_membership_use_cases =
        get_player_team_membership_use_cases();
    const player_position_use_cases = get_player_position_use_cases();
    const quick_events = get_quick_event_buttons();
    const primary_events = quick_events.slice(0, 8);
    const secondary_events = quick_events.slice(8);

    let fixture: Fixture | null = null,
        home_team: Team | null = null,
        away_team: Team | null = null;
    let home_players: TeamPlayer[] = [],
        away_players: TeamPlayer[] = [];
    let is_loading = true,
        error_message = "",
        is_updating = false;
    let game_clock_seconds = 0,
        clock_interval: ReturnType<typeof setInterval> | null = null,
        is_clock_running = false;
    let show_start_modal = false,
        show_end_modal = false,
        show_event_modal = false;
    let selected_event_type: QuickEventButton | null = null,
        selected_team_side: "home" | "away" = "home";
    let event_player_name = "",
        event_description = "",
        event_minute = 0;
    let toast_visible = false,
        toast_message = "",
        toast_type: "success" | "error" | "info" = "info";

    $: fixture_id = $page.params.id ?? "";
    $: clock_state = build_game_clock_state(
        game_clock_seconds,
        fixture?.current_period ?? "first_half",
    );
    $: home_score = fixture?.home_team_score ?? 0;
    $: away_score = fixture?.away_team_score ?? 0;
    $: sorted_events = sort_game_events(fixture?.game_events ?? []);
    $: is_game_active = fixture?.status === "in_progress";
    $: available_players =
        selected_team_side === "home" ? home_players : away_players;

    onMount(async () => {
        if (!browser) return;
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success)
            return fail_loading(auth_result.error_message);
        if (!fixture_id) return fail_loading("No fixture ID provided");
        await load_fixture();
    });

    onDestroy(stop_clock);

    async function load_fixture(): Promise<void> {
        is_loading = true;
        error_message = "";
        const result = await load_fixture_manage_bundle(fixture_id, {
            fixture_use_cases,
            team_use_cases,
            player_use_cases,
            player_team_membership_use_cases,
            player_position_use_cases,
        });
        if (!result.success) return fail_loading(result.error_message);
        ({
            fixture,
            home_team,
            away_team,
            home_players,
            away_players,
            game_clock_seconds,
        } = result.data);
        is_loading = false;
    }

    function fail_loading(message: string): void {
        error_message = message;
        is_loading = false;
    }

    function start_clock(): void {
        if (clock_interval) return;
        is_clock_running = true;
        clock_interval = setInterval(() => (game_clock_seconds += 1), 1000);
    }

    function stop_clock(): void {
        if (clock_interval) clearInterval(clock_interval);
        clock_interval = null;
        is_clock_running = false;
    }

    const toggle_clock = (): void => {
        is_clock_running ? stop_clock() : start_clock();
    };

    async function ensure_lineups_submitted(): Promise<boolean> {
        if (!fixture) return false;
        const result = await fixture_lineup_use_cases.get_lineups_for_fixture(
            fixture.id,
        );
        if (!result.success) {
            show_toast(
                `Unable to verify fixture lineups: ${result.error}`,
                "error",
            );
            return false;
        }
        const home_lineup_ready = has_team_submitted_lineup(
            result.data ?? [],
            fixture.home_team_id,
        );
        const away_lineup_ready = has_team_submitted_lineup(
            result.data ?? [],
            fixture.away_team_id,
        );
        if (home_lineup_ready && away_lineup_ready) return true;
        show_toast(
            "Submit both team lineups before starting the game.",
            "info",
        );
        void goto(`/fixture-lineups?fixture_id=${fixture.id}`);
        return false;
    }

    async function handle_start_click(): Promise<void> {
        if (await ensure_lineups_submitted()) show_start_modal = true;
    }

    async function start_game(): Promise<void> {
        if (!fixture) return;
        is_updating = true;
        const result = await start_game_session(fixture.id, fixture_use_cases);
        is_updating = false;
        show_start_modal = false;
        if (!result.success)
            return show_toast(`Failed to start game: ${result.error}`, "error");
        fixture = result.data;
        game_clock_seconds = 0;
        start_clock();
        show_toast("Game started! Clock is running.", "success");
    }

    async function end_game(): Promise<void> {
        if (!fixture) return;
        is_updating = true;
        stop_clock();
        const result = await end_game_session(fixture.id, fixture_use_cases);
        is_updating = false;
        show_end_modal = false;
        if (!result.success)
            return show_toast(`Failed to end game: ${result.error}`, "error");
        fixture = result.data;
        show_toast("Game completed!", "success");
    }

    function open_event_modal(
        event_button: QuickEventButton,
        team_side: "home" | "away",
    ): void {
        if (!is_game_active) return;
        selected_event_type = event_button;
        selected_team_side = team_side;
        event_player_name = "";
        event_description = "";
        event_minute = clock_state.elapsed_minutes;
        show_event_modal = true;
    }

    function cancel_event(): void {
        show_event_modal = false;
        selected_event_type = null;
        event_player_name = "";
        event_description = "";
        event_minute = 0;
    }

    async function record_event(): Promise<void> {
        if (!fixture || !selected_event_type) return;
        is_updating = true;
        const result = await record_game_manage_event(
            {
                fixture_id: fixture.id,
                selected_event_type,
                event_minute,
                selected_team_side,
                event_player_name,
                event_description,
            },
            fixture_use_cases,
        );
        is_updating = false;
        if (!result.success)
            return show_toast(
                `Failed to record event: ${result.error}`,
                "error",
            );
        fixture = result.data;
        cancel_event();
        show_toast(`${selected_event_type.label} recorded!`, "success");
    }

    async function change_period(new_period: GamePeriod): Promise<void> {
        if (!fixture) return;
        is_updating = true;
        const new_minute =
            new_period === "second_half"
                ? 45
                : new_period === "extra_time_first"
                  ? 90
                  : clock_state.elapsed_minutes;
        game_clock_seconds = new_minute * 60;
        const result = await change_game_period(
            fixture,
            new_period,
            new_minute,
            fixture_use_cases,
        );
        is_updating = false;
        if (!result.success)
            return show_toast(
                `Failed to change period: ${result.error}`,
                "error",
            );
        fixture = result.data;
        start_clock();
        show_toast(`${get_period_display_name(new_period)} started!`, "info");
    }

    async function end_current_period(): Promise<void> {
        if (!fixture) return;
        stop_clock();
        is_updating = true;
        const result = await end_game_period(
            fixture,
            clock_state.elapsed_minutes,
            fixture_use_cases,
        );
        is_updating = false;
        if (!result.success)
            return show_toast(`Failed to end period: ${result.error}`, "error");
        fixture = result.data.fixture;
        show_toast(`${result.data.completed_period_label} ended`, "info");
    }

    function navigate_back(): void {
        void goto("/fixtures");
    }

    function show_toast(
        message: string,
        type: "success" | "error" | "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }
</script>

<svelte:head>
    <title
        >{fixture
            ? `${home_team?.name ?? "Home"} vs ${away_team?.name ?? "Away"}`
            : "Game Management"} - Sports Management</title
    >
</svelte:head>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    {#if is_loading}
        <div class="flex justify-center items-center min-h-screen">
            <div
                class="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"
            ></div>
        </div>
    {:else if error_message}
        <div class="max-w-2xl mx-auto p-6">
            <div
                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
            >
                <h3
                    class="text-lg font-medium text-red-800 dark:text-red-200 mb-2"
                >
                    Error Loading Game
                </h3>
                <p class="text-red-600 dark:text-red-400">{error_message}</p>
                <button
                    type="button"
                    class="btn btn-outline mt-4"
                    on:click={navigate_back}>Back to Fixtures</button
                >
            </div>
        </div>
    {:else if fixture}
        <GameManagePageContent
            {fixture}
            home_team_name={home_team?.name ?? "Home"}
            away_team_name={away_team?.name ?? "Away"}
            {home_score}
            {away_score}
            current_period_label={get_period_display_name(
                fixture.current_period,
            )}
            clock_display={clock_state.clock_display}
            {is_clock_running}
            {is_game_active}
            {primary_events}
            {secondary_events}
            {sorted_events}
            on_back={navigate_back}
            on_start={() => void handle_start_click()}
            on_toggle_clock={toggle_clock}
            on_end={() => (show_end_modal = true)}
            on_end_current_period={end_current_period}
            on_change_period={change_period}
            on_open_event_modal={open_event_modal}
        />
    {/if}
</div>

<ConfirmationModal
    is_visible={show_start_modal}
    title="Start Game"
    message="Are you sure you want to start this game? The match clock will begin."
    confirm_text="Start Game"
    is_processing={is_updating}
    on:confirm={start_game}
    on:cancel={() => (show_start_modal = false)}
/>
<ConfirmationModal
    is_visible={show_end_modal}
    title="End Game"
    message={`Are you sure you want to end this game with the current score of ${home_score} - ${away_score}?`}
    confirm_text="End Game"
    is_destructive
    is_processing={is_updating}
    on:confirm={end_game}
    on:cancel={() => (show_end_modal = false)}
/>
{#if show_event_modal && selected_event_type}
    <FixtureManageEventModal
        bind:event_minute
        bind:event_player_name
        bind:event_description
        {selected_event_type}
        {selected_team_side}
        home_team_name={home_team?.name ?? "Home"}
        away_team_name={away_team?.name ?? "Away"}
        {game_clock_seconds}
        {is_updating}
        {available_players}
        on_cancel={cancel_event}
        on_record={record_event}
    />
{/if}
<Toast
    bind:is_visible={toast_visible}
    message={toast_message}
    type={toast_type}
    on:dismiss={() => (toast_visible = false)}
/>
