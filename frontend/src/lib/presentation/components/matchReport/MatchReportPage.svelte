<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";

    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import { match_report_page_dependencies } from "$lib/presentation/logic/matchReportPageDependencies";
    import { download_match_report_for_fixture } from "$lib/presentation/logic/matchReportPageDownload";
    import {
        load_match_report_page_data,
        refresh_match_report_fixture_data,
    } from "$lib/presentation/logic/matchReportPageLoad";
    import type {
        MatchReportPageData,
        MatchReportPageDataState,
        MatchReportRefreshData,
    } from "$lib/presentation/logic/matchReportPageLoadTypes";
    import {
        build_match_report_page_title,
        build_match_report_view_state,
        should_poll_match_report_fixture,
    } from "$lib/presentation/logic/matchReportPageState";
    import { is_public_viewer } from "$lib/presentation/stores/auth";
    import { branding_store } from "$lib/presentation/stores/branding";

    import MatchReportPageShell from "./MatchReportPageShell.svelte";

    const LIVE_POLL_INTERVAL_MS = 10000;
    const MATCH_REPORT_PAGE_TEXT = {
        title_suffix: "Sports Management",
        loading_error_title: "Error Loading Match",
        missing_fixture_id: "No fixture ID provided",
    } as const;

    type MatchReportLivePollState =
        | { status: "stopped" }
        | { status: "active"; interval_id: ReturnType<typeof setInterval> };

    let page_data_state: MatchReportPageDataState = { status: "missing" },
        is_loading = true,
        error_message = "",
        downloading_report = false,
        live_poll_state: MatchReportLivePollState = { status: "stopped" },
        toast_visible = false,
        toast_message = "",
        toast_type: "success" | "error" | "info" = "info";

    $: fixture_id = $page.params.id ?? "";
    $: view_state = build_match_report_view_state({ page_data_state });
    $: page_title = build_match_report_page_title(page_data_state);

    function show_toast(
        message: string,
        type: "success" | "error" | "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }

    function navigate_back(): void {
        if (window.history.length > 1) return window.history.back();
        void goto("/competition-results");
    }

    function stop_live_polling(): void {
        if (live_poll_state.status === "stopped") return;
        clearInterval(live_poll_state.interval_id);
        live_poll_state = { status: "stopped" };
    }

    function start_live_polling_if_needed(): void {
        if (
            live_poll_state.status === "active" ||
            !should_poll_match_report_fixture(page_data_state)
        )
            return;
        live_poll_state = {
            status: "active",
            interval_id: setInterval(refresh_fixture_data, LIVE_POLL_INTERVAL_MS),
        };
    }

    function apply_refreshed_match_report_data(
        refresh_data: MatchReportRefreshData,
    ): void {
        if (page_data_state.status === "missing") return;
        const current_page_data: MatchReportPageData = page_data_state.page_data;

        page_data_state = {
            status: "present",
            page_data: {
                ...current_page_data,
                fixture: refresh_data.fixture,
                home_players: refresh_data.home_players,
                away_players: refresh_data.away_players,
            },
        };
    }

    async function load_match_data(): Promise<boolean> {
        if (!fixture_id) {
            error_message = MATCH_REPORT_PAGE_TEXT.missing_fixture_id;
            is_loading = false;
            return false;
        }
        is_loading = true;
        error_message = "";
        const result = await load_match_report_page_data({
            fixture_id,
            dependencies: match_report_page_dependencies,
        });
        is_loading = false;
        if (!result.success) {
            error_message = result.error;
            return false;
        }
        page_data_state = { status: "present", page_data: result.data };
        return true;
    }

    async function refresh_fixture_data(): Promise<boolean> {
        if (!fixture_id) return false;
        const result = await refresh_match_report_fixture_data({
            fixture_id,
            dependencies: match_report_page_dependencies,
        });
        if (!result.success) return false;
        apply_refreshed_match_report_data(result.data);
        if (!should_poll_match_report_fixture(page_data_state))
            stop_live_polling();
        return true;
    }

    async function handle_download_match_report(): Promise<boolean> {
        if (page_data_state.status === "missing") return false;
        const current_page_data: MatchReportPageData = page_data_state.page_data;
        if (
            current_page_data.home_team_state.status === "missing" ||
            current_page_data.away_team_state.status === "missing"
        )
            return false;
        downloading_report = true;
        const result = await download_match_report_for_fixture({
            fixture: current_page_data.fixture,
            home_team: current_page_data.home_team_state.team,
            away_team: current_page_data.away_team_state.team,
            competition_state: current_page_data.competition_state,
            sport_state: current_page_data.sport_state,
            venue_state: current_page_data.venue_state,
            assigned_officials_data: current_page_data.assigned_officials_data,
            home_players: current_page_data.home_players,
            away_players: current_page_data.away_players,
            organization_logo_url: get(branding_store).organization_logo_url,
            dependencies: match_report_page_dependencies,
        });
        downloading_report = false;
        show_toast(
            result.success ? result.data : result.error,
            result.success ? "success" : "error",
        );
        return result.success;
    }

    onMount(async () => {
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success && !get(is_public_viewer)) {
            error_message = auth_result.error_message;
            is_loading = false;
            return;
        }
        await fetch_public_data_from_convex("match_report");
        const loaded = await load_match_data();
        if (loaded) start_live_polling_if_needed();
    });

    onDestroy(stop_live_polling);
</script>

<svelte:head
    ><title>{page_title} - {MATCH_REPORT_PAGE_TEXT.title_suffix}</title
    ></svelte:head
>

<MatchReportPageShell
    {page_data_state}
    {view_state}
    {is_loading}
    {error_message}
    {downloading_report}
    live_poll_interval_ms={LIVE_POLL_INTERVAL_MS}
    loading_error_title={MATCH_REPORT_PAGE_TEXT.loading_error_title}
    {toast_message}
    {toast_type}
    bind:toast_visible
    on_back={navigate_back}
    on_download={handle_download_match_report}
/>
