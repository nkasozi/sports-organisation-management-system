<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { Competition } from "$lib/core/entities/Competition";
    import {
        create_game_event,
        type Fixture,
        type GamePeriod,
        get_quick_event_buttons,
        type QuickEventButton,
    } from "$lib/core/entities/Fixture";
    import type {
        LineupPlayer,
        PlayerTimeOnStatus,
    } from "$lib/core/entities/FixtureLineup";
    import type { Official } from "$lib/core/entities/Official";
    import type { Sport } from "$lib/core/entities/Sport";
    import type { SportGamePeriod } from "$lib/core/entities/Sport";
    import type { Team } from "$lib/core/entities/Team";
    import type { Venue } from "$lib/core/entities/Venue";
    import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
    import {
        get_competition_use_cases,
        get_fixture_lineup_use_cases,
        get_fixture_use_cases,
        get_official_use_cases,
        get_organization_use_cases,
        get_player_team_membership_use_cases,
        get_player_use_cases,
        get_sport_use_cases,
        get_team_staff_use_cases,
        get_team_use_cases,
        get_venue_use_cases,
    } from "$lib/infrastructure/registry/useCaseFactories";
    import { download_match_report } from "$lib/infrastructure/utils/MatchReportPdfGenerator";
    import LiveGameDetailPageContent from "$lib/presentation/components/game/LiveGameDetailPageContent.svelte";
    import LiveGameEventModal from "$lib/presentation/components/game/LiveGameEventModal.svelte";
    import LiveGameExtraTimeModal from "$lib/presentation/components/game/LiveGameExtraTimeModal.svelte";
    import LiveGameStartConfirmationDialog from "$lib/presentation/components/game/LiveGameStartConfirmationDialog.svelte";
    import ConfirmationModal from "$lib/presentation/components/ui/ConfirmationModal.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import {
        change_game_period,
        end_game_period,
        end_game_session,
        start_game_session,
    } from "$lib/presentation/logic/gameManageActions";
    import {
        ensure_live_game_lineups_before_start,
        record_live_game_detail_event,
        record_live_game_extra_time_event,
        update_live_game_player_time_on,
    } from "$lib/presentation/logic/liveGameDetailActions";
    import { load_live_game_detail_bundle } from "$lib/presentation/logic/liveGameDetailData";
    import { build_live_game_detail_report } from "$lib/presentation/logic/liveGameDetailReport";
    import {
        build_period_button_config,
        build_player_select_options_for_team,
        build_players_on_field_options,
        check_is_playing_period,
        get_effective_periods_for,
        get_sport_period_display_name,
        get_starters_from_lineup,
        get_substitutes_from_lineup,
        type LiveGameDetailBundle,
    } from "$lib/presentation/logic/liveGameDetailState";
    import { access_denial_store } from "$lib/presentation/stores/accessDenial";
    import { auth_store } from "$lib/presentation/stores/auth";
    import { branding_store } from "$lib/presentation/stores/branding";

    const fixture_use_cases = get_fixture_use_cases(),
        team_use_cases = get_team_use_cases(),
        fixture_lineup_use_cases = get_fixture_lineup_use_cases(),
        competition_use_cases = get_competition_use_cases(),
        organization_use_cases = get_organization_use_cases(),
        sport_use_cases = get_sport_use_cases(),
        player_membership_use_cases = get_player_team_membership_use_cases(),
        player_use_cases = get_player_use_cases(),
        venue_use_cases = get_venue_use_cases(),
        team_staff_use_cases = get_team_staff_use_cases();
    let fixture: Fixture | null = null,
        home_team: Team | null = null,
        away_team: Team | null = null,
        competition: Competition | null = null,
        sport: Sport | null = null,
        venue: Venue | null = null,
        organization_name = "",
        assigned_officials_data: Array<{
            official: Official;
            role_name: string;
        }> = [],
        home_players: LineupPlayer[] = [],
        away_players: LineupPlayer[] = [],
        home_lineup_id = "",
        away_lineup_id = "";
    let is_loading = true,
        error_message = "",
        is_updating = false,
        game_clock_seconds = 0,
        clock_interval: ReturnType<typeof setInterval> | null = null,
        is_clock_running = false,
        extra_time_added_seconds = 0,
        extra_minutes_to_add = 5,
        break_elapsed_seconds = 0;
    let show_start_modal = false,
        show_end_modal = false,
        show_period_modal = false,
        show_extra_time_modal = false,
        show_event_modal = false,
        selected_event_type: QuickEventButton | null = null,
        selected_team_side: "home" | "away" = "home",
        selected_player_id = "",
        secondary_player_id = "",
        event_player_name = "",
        secondary_player_name = "",
        event_description = "",
        event_minute = 0,
        toast_visible = false,
        toast_message = "",
        toast_type: "success" | "error" | "info" = "info",
        downloading_report = false,
        can_modify_game = false,
        permission_info_message = "",
        home_lineup_expanded = false,
        away_lineup_expanded = false;

    $: effective_periods = get_effective_periods_for(sport, competition);
    $: playing_periods = effective_periods.filter(
        (period: SportGamePeriod) => !period.is_break,
    );
    $: fixture_id = $page.params.id ?? "";
    $: elapsed_minutes = Math.floor(game_clock_seconds / 60);
    $: current_period_id = fixture?.current_period ?? null;
    $: current_period_label = current_period_id
        ? get_sport_period_display_name(current_period_id, effective_periods)
        : fixture?.status === "completed"
          ? "Full Time"
          : fixture?.scheduled_time || "";
    $: home_starters = get_starters_from_lineup(home_players);
    $: home_substitutes = get_substitutes_from_lineup(home_players);
    $: away_starters = get_starters_from_lineup(away_players);
    $: away_substitutes = get_substitutes_from_lineup(away_players);
    $: current_period_duration =
        current_period_id &&
        check_is_playing_period(current_period_id, effective_periods)
            ? (playing_periods.find((period) => period.id === current_period_id)
                  ?.duration_minutes || 45) * 60
            : (effective_periods.find(
                  (period) => period.id === current_period_id,
              )?.duration_minutes || 5) * 60;
    $: current_period_index = playing_periods.findIndex(
        (period) => period.id === current_period_id,
    );
    $: period_elapsed_seconds =
        current_period_id &&
        !check_is_playing_period(current_period_id, effective_periods)
            ? break_elapsed_seconds
            : game_clock_seconds -
              playing_periods.reduce(
                  (seconds, period, index) =>
                      index < current_period_index
                          ? seconds + period.duration_minutes * 60
                          : seconds,
                  0,
              );
    $: remaining_seconds_in_period = Math.max(
        0,
        current_period_duration +
            extra_time_added_seconds -
            period_elapsed_seconds,
    );
    $: if (remaining_seconds_in_period <= 0 && is_clock_running) stop_clock();
    $: clock_display = `${String(Math.floor(remaining_seconds_in_period / 60)).padStart(2, "0")}:${String(remaining_seconds_in_period % 60).padStart(2, "0")}`;
    $: home_score = fixture?.home_team_score ?? 0;
    $: away_score = fixture?.away_team_score ?? 0;
    $: sorted_events = [...(fixture?.game_events ?? [])].sort(
        (left, right) =>
            left.minute - right.minute ||
            new Date(left.recorded_at).getTime() -
                new Date(right.recorded_at).getTime(),
    );
    $: is_game_active = fixture?.status === "in_progress";
    $: is_game_completed = fixture?.status === "completed";
    $: period_button_config = build_period_button_config(
        fixture?.current_period,
        is_game_active,
        effective_periods,
    );
    $: show_extra_time_button =
        is_game_active && remaining_seconds_in_period <= 300;
    $: all_event_buttons = get_quick_event_buttons();
    $: player_select_options = build_player_select_options_for_team(
        selected_team_side,
        home_players,
        away_players,
    );
    $: players_on_field_options = build_players_on_field_options(
        selected_team_side,
        home_players,
        away_players,
    );
    $: is_substitution_event = selected_event_type?.id === "substitution";
    $: assigned_officials = assigned_officials_data.map((assignment) => ({
        name: `${assignment.official.first_name} ${assignment.official.last_name}`,
        role_name: assignment.role_name,
    }));
    $: team_names = {
        [fixture?.home_team_id || "home"]: home_team?.name || "Home",
        [fixture?.away_team_id || "away"]: away_team?.name || "Away",
    };
    $: if (is_game_completed) {
        home_lineup_expanded = true;
        away_lineup_expanded = true;
    }

    function apply_bundle(bundle: LiveGameDetailBundle): void {
        fixture = bundle.fixture;
        home_team = bundle.home_team;
        away_team = bundle.away_team;
        competition = bundle.competition;
        sport = bundle.sport;
        venue = bundle.venue as Venue | null;
        organization_name = bundle.organization_name;
        assigned_officials_data = bundle.assigned_officials_data as Array<{
            official: Official;
            role_name: string;
        }>;
        home_players = bundle.home_players;
        away_players = bundle.away_players;
        home_lineup_id = bundle.home_lineup_id;
        away_lineup_id = bundle.away_lineup_id;
        game_clock_seconds = bundle.game_clock_seconds;
    }
    function start_clock(): void {
        if (
            clock_interval ||
            (fixture?.status === "completed" && extra_time_added_seconds <= 0)
        )
            return;
        is_clock_running = true;
        clock_interval = setInterval(() => {
            const current_period = fixture?.current_period;
            if (
                current_period &&
                !check_is_playing_period(current_period, effective_periods)
            ) {
                break_elapsed_seconds += 1;
                return;
            }
            game_clock_seconds += 1;
        }, 1000);
    }
    function stop_clock(): void {
        if (clock_interval) clearInterval(clock_interval);
        clock_interval = null;
        is_clock_running = false;
    }
    function toggle_clock(): void {
        is_clock_running ? stop_clock() : start_clock();
    }
    function show_toast(
        message: string,
        type: "success" | "error" | "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }
    function navigate_back(): void {
        void goto("/live-games");
    }
    function open_event_modal(
        event_button: QuickEventButton,
        team_side: "home" | "away",
    ): void {
        if (!is_game_active) return;
        selected_event_type = event_button;
        selected_team_side = team_side;
        selected_player_id = "";
        secondary_player_id = "";
        event_player_name = "";
        secondary_player_name = "";
        event_description = "";
        event_minute = elapsed_minutes;
        show_event_modal = true;
    }
    function cancel_event(): void {
        show_event_modal = false;
        selected_event_type = null;
        selected_player_id = "";
        secondary_player_id = "";
        event_player_name = "";
        secondary_player_name = "";
        event_description = "";
        event_minute = 0;
    }
    function select_event_player(player_id: string): void {
        selected_player_id = player_id;
        const player = (
            selected_team_side === "home" ? home_players : away_players
        ).find((current_player) => current_player.id === player_id);
        event_player_name = player
            ? `${player.first_name} ${player.last_name}`
            : "";
    }
    function select_secondary_player(player_id: string): void {
        secondary_player_id = player_id;
        const player = (
            selected_team_side === "home" ? home_players : away_players
        ).find((current_player) => current_player.id === player_id);
        secondary_player_name = player
            ? `${player.first_name} ${player.last_name}`
            : "";
    }

    async function load_fixture(): Promise<void> {
        is_loading = true;
        error_message = "";
        const result = await load_live_game_detail_bundle(fixture_id, {
            fixture_use_cases,
            team_use_cases,
            fixture_lineup_use_cases,
            competition_use_cases,
            organization_use_cases,
            sport_use_cases,
            venue_use_cases,
            official_use_cases: get_official_use_cases(),
        });
        if (!result.success) {
            error_message = result.error_message;
            is_loading = false;
            return;
        }
        apply_bundle(result.data);
        is_loading = false;
        if (result.data.fixture.status === "in_progress") start_clock();
    }
    async function update_player_time_on_wrapper(
        team_side: "home" | "away",
        player_id: string,
        new_time_on: PlayerTimeOnStatus,
    ): Promise<boolean> {
        const is_home = team_side === "home";
        const result = await update_live_game_player_time_on(
            is_home ? home_lineup_id : away_lineup_id,
            is_home ? home_players : away_players,
            player_id,
            new_time_on,
            fixture_lineup_use_cases,
        );
        if (!result.success) show_toast(result.error_message, "error");
        if (is_home) home_players = result.updated_players;
        else away_players = result.updated_players;
        return result.success;
    }
    async function start_game(): Promise<void> {
        if (!fixture) return;
        const lineup_result = await ensure_live_game_lineups_before_start(
            fixture,
            home_players,
            away_players,
            home_team,
            away_team,
            competition?.allow_auto_squad_submission ?? false,
            player_membership_use_cases,
            player_use_cases,
            fixture_lineup_use_cases,
        );
        if (!lineup_result.success) {
            show_toast(lineup_result.error_message, "error");
            show_start_modal = false;
            return;
        }
        if (lineup_result.reloaded_required) await load_fixture();
        if (!fixture) return;
        is_updating = true;
        const start_result = await start_game_session(
            fixture.id,
            fixture_use_cases,
        );
        is_updating = false;
        show_start_modal = false;
        if (!start_result.success)
            return show_toast(
                `Failed to start game: ${start_result.error}`,
                "error",
            );
        fixture = start_result.data;
        const first_period_id = playing_periods[0]?.id ?? "first_half";
        if (first_period_id !== "first_half") {
            const period_result = await fixture_use_cases.update_period(
                fixture.id,
                first_period_id as GamePeriod,
                0,
            );
            if (period_result.success)
                fixture = {
                    ...fixture,
                    current_period: first_period_id as GamePeriod,
                } as Fixture;
        }
        game_clock_seconds = 0;
        start_clock();
        show_toast("Game started! Clock is running.", "success");
    }
    async function end_game(): Promise<void> {
        if (!fixture) return;
        is_updating = true;
        stop_clock();
        await fixture_use_cases.record_game_event(
            fixture.id,
            create_game_event(
                "period_end",
                elapsed_minutes,
                "match",
                "",
                `Match ended. Final score: ${home_score}-${away_score}`,
            ),
        );
        const result = await end_game_session(fixture.id, fixture_use_cases);
        is_updating = false;
        show_end_modal = false;
        if (!result.success)
            return show_toast(`Failed to end game: ${result.error}`, "error");
        fixture = result.data;
        show_toast("Game completed!", "success");
    }
    async function handle_download_match_report(): Promise<boolean> {
        if (!fixture || !home_team || !away_team) return false;
        downloading_report = true;
        const report = await build_live_game_detail_report(
            fixture,
            competition,
            sport,
            home_team,
            away_team,
            venue,
            home_players,
            away_players,
            assigned_officials_data,
            get(branding_store).organization_logo_url,
            { organization_use_cases, team_staff_use_cases },
        );
        download_match_report(report.report_data, report.filename);
        downloading_report = false;
        show_toast("Match report downloaded!", "success");
        return true;
    }
    async function record_event(): Promise<void> {
        if (!fixture || !selected_event_type) return;
        is_updating = true;
        const result = await record_live_game_detail_event(
            fixture.id,
            selected_event_type,
            event_minute,
            selected_team_side,
            event_player_name,
            event_description,
            secondary_player_name,
            fixture_use_cases,
        );
        if (!result.success) {
            is_updating = false;
            return show_toast(
                `Failed to record event: ${result.error}`,
                "error",
            );
        }
        if (is_substitution_event && selected_player_id)
            await update_player_time_on_wrapper(
                selected_team_side,
                selected_player_id,
                String(event_minute) as PlayerTimeOnStatus,
            );
        is_updating = false;
        fixture = result.data;
        cancel_event();
        show_toast(`${selected_event_type.label} recorded!`, "success");
    }
    async function confirm_period_action(): Promise<void> {
        if (!fixture || !period_button_config) return;
        show_period_modal = false;
        if (period_button_config.is_end_action) {
            stop_clock();
            is_updating = true;
            extra_time_added_seconds = 0;
            break_elapsed_seconds = 0;
            const result = await end_game_period(
                fixture,
                elapsed_minutes,
                fixture_use_cases,
            );
            is_updating = false;
            if (!result.success)
                return show_toast(
                    "Failed to end period: failed to record event",
                    "error",
                );
            fixture = result.data.fixture;
            await fixture_use_cases.update_period(
                fixture.id,
                fixture.current_period,
                elapsed_minutes,
            );
            if (
                !check_is_playing_period(
                    fixture.current_period,
                    effective_periods,
                )
            )
                start_clock();
            return show_toast(
                `${result.data.completed_period_label} ended`,
                "info",
            );
        }
        is_updating = true;
        game_clock_seconds = playing_periods
            .filter((period) => period.id !== period_button_config.next_period)
            .reduce(
                (seconds, period, index) =>
                    index <
                    playing_periods.findIndex(
                        (candidate) =>
                            candidate.id === period_button_config.next_period,
                    )
                        ? seconds + period.duration_minutes * 60
                        : seconds,
                0,
            );
        const result = await change_game_period(
            fixture,
            period_button_config.next_period,
            Math.floor(game_clock_seconds / 60),
            fixture_use_cases,
        );
        is_updating = false;
        if (!result.success)
            return show_toast(
                `Failed to change period: ${result.error}`,
                "error",
            );
        fixture = result.data;
        extra_time_added_seconds = 0;
        break_elapsed_seconds = 0;
        start_clock();
        show_toast(
            `${get_sport_period_display_name(period_button_config.next_period, effective_periods)} started!`,
            "info",
        );
    }
    async function confirm_extra_time(): Promise<void> {
        if (!fixture || extra_minutes_to_add < 1) return;
        show_extra_time_modal = false;
        is_updating = true;
        const result = await record_live_game_extra_time_event(
            fixture.id,
            elapsed_minutes,
            extra_minutes_to_add,
            get_sport_period_display_name(
                fixture.current_period ?? "first_half",
                effective_periods,
            ),
            fixture_use_cases,
        );
        is_updating = false;
        if (!result.success)
            return show_toast("Failed to record extra time event", "error");
        fixture = result.data;
        extra_time_added_seconds += extra_minutes_to_add * 60;
        if (!is_clock_running) start_clock();
        show_toast(
            `${extra_minutes_to_add} min added time - ${get_sport_period_display_name(fixture.current_period ?? "first_half", effective_periods)}`,
            "success",
        );
        extra_minutes_to_add = 5;
    }

    onMount(async () => {
        if (!browser) return;
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            is_loading = false;
            return;
        }
        const auth_state = get(auth_store);
        if (auth_state.current_token) {
            const read_result =
                await get_authorization_adapter().check_entity_authorized(
                    auth_state.current_token.raw_token,
                    "fixture",
                    "read",
                );
            if (read_result.success && !read_result.data.is_authorized) {
                access_denial_store.set_denial(
                    `/live-games/${fixture_id}`,
                    "You do not have permission to view this live game.",
                );
                void goto("/");
                return;
            }
            const update_result =
                await get_authorization_adapter().check_entity_authorized(
                    auth_state.current_token.raw_token,
                    "fixture",
                    "update",
                );
            can_modify_game =
                update_result.success && update_result.data.is_authorized;
            permission_info_message = can_modify_game
                ? ""
                : "You have view-only access to this live game. Game management actions are not available.";
        }
        if (!fixture_id) {
            error_message = "No fixture ID provided";
            is_loading = false;
            return;
        }
        await load_fixture();
    });
    onDestroy(stop_clock);
</script>

<svelte:head
    ><title
        >{fixture
            ? `${home_team?.name ?? "Home"} vs ${away_team?.name ?? "Away"}`
            : "Live Game Management"} - Sports Management</title
    ></svelte:head
>

<LiveGameDetailPageContent
    {fixture}
    {home_team}
    {away_team}
    {organization_name}
    competition_name={competition?.name || ""}
    {home_score}
    {away_score}
    {current_period_label}
    {clock_display}
    {is_clock_running}
    {can_modify_game}
    {is_game_active}
    {is_game_completed}
    {show_extra_time_button}
    {downloading_report}
    {period_button_config}
    {permission_info_message}
    {all_event_buttons}
    {home_players}
    {away_players}
    {home_starters}
    {home_substitutes}
    {away_starters}
    {away_substitutes}
    {home_lineup_expanded}
    {away_lineup_expanded}
    {elapsed_minutes}
    venue_name={venue?.name || fixture?.venue || ""}
    venue_location={`${venue?.city || ""}${venue?.country ? `${venue?.city ? ", " : ""}${venue.country}` : ""}`}
    home_team_short_name={home_team?.name?.slice(0, 3).toUpperCase() || "HOM"}
    away_team_short_name={away_team?.name?.slice(0, 3).toUpperCase() || "AWY"}
    home_team_color={fixture?.home_team_jersey?.main_color || "#3b82f6"}
    away_team_color={fixture?.away_team_jersey?.main_color || "#ef4444"}
    officials_color={fixture?.officials_jersey?.main_color || ""}
    {assigned_officials}
    {sorted_events}
    {is_loading}
    {error_message}
    on_back={navigate_back}
    on_start={() => (show_start_modal = true)}
    on_toggle_clock={toggle_clock}
    on_period_action={() => (show_period_modal = true)}
    on_extra_time={() => (show_extra_time_modal = true)}
    on_end={() => (show_end_modal = true)}
    on_download_match_report={handle_download_match_report}
    on_open_event_modal={open_event_modal}
    on_toggle_home_lineup={() => (home_lineup_expanded = !home_lineup_expanded)}
    on_toggle_away_lineup={() => (away_lineup_expanded = !away_lineup_expanded)}
    on_home_time_on_change={(player_id, new_time_on) =>
        update_player_time_on_wrapper("home", player_id, new_time_on)}
    on_away_time_on_change={(player_id, new_time_on) =>
        update_player_time_on_wrapper("away", player_id, new_time_on)}
/>
<LiveGameStartConfirmationDialog
    {fixture}
    {team_names}
    on_cancel={() => (show_start_modal = false)}
    on_confirm={() => void start_game()}
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
{#if period_button_config}<ConfirmationModal
        is_visible={show_period_modal}
        title={period_button_config.is_end_action
            ? "End Period"
            : "Start Period"}
        message={period_button_config.message}
        confirm_text={period_button_config.confirm_text}
        is_destructive={period_button_config.is_end_action}
        is_processing={is_updating}
        on:confirm={confirm_period_action}
        on:cancel={() => (show_period_modal = false)}
    />{/if}
<LiveGameExtraTimeModal
    is_visible={show_extra_time_modal}
    bind:extra_minutes_to_add
    {is_updating}
    on_close={() => (show_extra_time_modal = false)}
    on_confirm={confirm_extra_time}
/>
<LiveGameEventModal
    is_visible={show_event_modal}
    {selected_event_type}
    {selected_team_side}
    home_team_name={home_team?.name || "Home"}
    away_team_name={away_team?.name || "Away"}
    {event_minute}
    {game_clock_seconds}
    {is_updating}
    {player_select_options}
    {players_on_field_options}
    {selected_player_id}
    {secondary_player_id}
    {event_description}
    {is_substitution_event}
    on_cancel={cancel_event}
    on_record={record_event}
    on_select_player={select_event_player}
    on_select_secondary_player={select_secondary_player}
    on_event_minute_change={(minute) => (event_minute = minute)}
    on_event_description_change={(description) =>
        (event_description = description)}
/>
<Toast
    bind:is_visible={toast_visible}
    message={toast_message}
    type={toast_type}
    on:dismiss={() => (toast_visible = false)}
/>
