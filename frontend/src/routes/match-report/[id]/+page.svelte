<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";

    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";
    import MatchReportHeader from "$lib/presentation/components/matchReport/MatchReportHeader.svelte";
    import MatchReportPageContent from "$lib/presentation/components/matchReport/MatchReportPageContent.svelte";
    import { ErrorDisplay } from "$lib/presentation/components/ui";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import { match_report_page_dependencies } from "$lib/presentation/logic/matchReportPageDependencies";
    import { download_match_report_for_fixture } from "$lib/presentation/logic/matchReportPageDownload";
    import {
        load_match_report_page_data,
        type MatchReportPageData,
        type MatchReportRefreshData,
        refresh_match_report_fixture_data,
    } from "$lib/presentation/logic/matchReportPageLoad";
    import {
        build_match_report_page_title,
        build_match_report_view_state,
        should_poll_match_report_fixture,
    } from "$lib/presentation/logic/matchReportPageState";
    import { is_public_viewer } from "$lib/presentation/stores/auth";
    import { branding_store } from "$lib/presentation/stores/branding";

    const LIVE_POLL_INTERVAL_MS = 10000;
    const MATCH_REPORT_PAGE_TEXT = {
        title_suffix: "Sports Management",
        loading_error_title: "Error Loading Match",
        missing_fixture_id: "No fixture ID provided",
    } as const;

    let page_data: MatchReportPageData | null = null;
    let is_loading: boolean = true;
    let error_message: string = "";
    let downloading_report: boolean = false;
    let live_poll_interval: ReturnType<typeof setInterval> | null = null;
    let toast_visible: boolean = false;
    let toast_message: string = "";
    let toast_type: "success" | "error" | "info" = "info";
    $: fixture_id = $page.params.id ?? "";
    $: view_state = build_match_report_view_state({
        fixture: page_data?.fixture ?? null,
        home_players: page_data?.home_players ?? [],
        away_players: page_data?.away_players ?? [],
    });
    $: page_title = build_match_report_page_title(
        page_data?.fixture ?? null,
        page_data?.home_team?.name ?? null,
        page_data?.away_team?.name ?? null,
    );
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
        if (!live_poll_interval) return;
        clearInterval(live_poll_interval);
        live_poll_interval = null;
    }

    function start_live_polling_if_needed(): void {
        if (live_poll_interval) return;
        if (!should_poll_match_report_fixture(page_data?.fixture ?? null))
            return;
        live_poll_interval = setInterval(
            refresh_fixture_data,
            LIVE_POLL_INTERVAL_MS,
        );
    }

    function apply_refreshed_match_report_data(
        refresh_data: MatchReportRefreshData,
    ): void {
        if (!page_data) return;
        page_data = {
            ...page_data,
            fixture: refresh_data.fixture,
            home_players: refresh_data.home_players,
            away_players: refresh_data.away_players,
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
        page_data = result.data;
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
        if (!should_poll_match_report_fixture(result.data.fixture))
            stop_live_polling();
        return true;
    }

    async function handle_download_match_report(): Promise<boolean> {
        if (!page_data?.home_team || !page_data.away_team) return false;
        downloading_report = true;
        const result = await download_match_report_for_fixture({
            fixture: page_data.fixture,
            home_team: page_data.home_team,
            away_team: page_data.away_team,
            competition: page_data.competition,
            sport: page_data.sport,
            venue: page_data.venue,
            assigned_officials_data: page_data.assigned_officials_data,
            home_players: page_data.home_players,
            away_players: page_data.away_players,
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
        if (loaded) {
            start_live_polling_if_needed();
        }
    });

    onDestroy(stop_live_polling);
</script>

<svelte:head>
    <title>{page_title} - {MATCH_REPORT_PAGE_TEXT.title_suffix}</title>
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
            <ErrorDisplay
                variant="page"
                title={MATCH_REPORT_PAGE_TEXT.loading_error_title}
                message={error_message}
                on_back={navigate_back}
            />
        </div>
    {:else if page_data}
        <div class="flex flex-col min-h-screen">
            <MatchReportHeader
                fixture={page_data.fixture}
                home_team={page_data.home_team}
                away_team={page_data.away_team}
                competition={page_data.competition}
                organization_name={page_data.organization_name}
                venue={page_data.venue}
                {view_state}
                live_poll_interval_ms={LIVE_POLL_INTERVAL_MS}
                {downloading_report}
                on_back={navigate_back}
                on_download={handle_download_match_report}
            />
            <MatchReportPageContent
                fixture={page_data.fixture}
                home_team={page_data.home_team}
                away_team={page_data.away_team}
                venue={page_data.venue}
                assigned_officials_data={page_data.assigned_officials_data}
                home_players={page_data.home_players}
                away_players={page_data.away_players}
                {view_state}
            />
        </div>
    {/if}
</div>

{#if toast_visible}
    <Toast
        message={toast_message}
        type={toast_type}
        bind:is_visible={toast_visible}
    />
{/if}
