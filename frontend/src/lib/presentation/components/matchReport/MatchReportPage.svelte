<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";

    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import { match_report_page_dependencies } from "$lib/presentation/logic/matchReportPageDependencies";
    import { refresh_match_report_fixture_data } from "$lib/presentation/logic/matchReportPageLoad";
    import type { MatchReportPageDataState } from "$lib/presentation/logic/matchReportPageLoadTypes";
    import {
        build_match_report_page_title,
        build_match_report_view_state,
        should_poll_match_report_fixture,
    } from "$lib/presentation/logic/matchReportPageState";
    import { apply_match_report_refresh_data } from "$lib/presentation/logic/matchReportPageTransitions";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
    import { build_public_organization_scope } from "$lib/presentation/logic/publicDataOrganizationScope";
    import type { ToastType } from "$lib/presentation/logic/toastConfig";
    import { is_public_viewer } from "$lib/presentation/stores/auth";
    import { branding_store } from "$lib/presentation/stores/branding";
    import { public_organization_store } from "$lib/presentation/stores/publicOrganization";

    import {
        download_match_report_for_page,
        load_match_report_page,
        MATCH_REPORT_DOWNLOAD_OUTCOME,
    } from "./matchReportPageActions";
    import {
        MATCH_REPORT_LIVE_POLL_INTERVAL_MS,
        MATCH_REPORT_LOG_EVENTS,
        MATCH_REPORT_PAGE_TEXT,
    } from "./matchReportPageMessages";
    import MatchReportPageShell from "./MatchReportPageShell.svelte";
    import {
        create_match_report_failed_state,
        MATCH_REPORT_LIVE_POLL_STATUS,
        MATCH_REPORT_LOADING_STATE,
        MATCH_REPORT_PAGE_STATUS,
        type MatchReportLivePollState,
        type MatchReportPageStatusState,
        stop_match_report_live_poll,
    } from "./matchReportPageStatus";

    let page_data_state: MatchReportPageDataState = {
            status: PRESENCE_STATUS.MISSING,
        },
        page_status_state: MatchReportPageStatusState =
            MATCH_REPORT_LOADING_STATE,
        downloading_report = false,
        live_poll_state: MatchReportLivePollState = {
            status: MATCH_REPORT_LIVE_POLL_STATUS.STOPPED,
        },
        toast_visible = false,
        toast_message = "",
        toast_type: ToastType = "info";

    $: fixture_id = $page.params.id ?? "";
    $: view_state = build_match_report_view_state({ page_data_state });
    $: page_title = build_match_report_page_title(page_data_state);

    function show_toast(message: string, type: ToastType): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }

    function navigate_back(): void {
        if (window.history.length > 1) return window.history.back();
        void goto(MATCH_REPORT_PAGE_TEXT.fallback_back_path);
    }

    function stop_live_polling(): void {
        live_poll_state = stop_match_report_live_poll(live_poll_state);
    }

    function start_live_polling_if_needed(): void {
        if (
            live_poll_state.status === MATCH_REPORT_LIVE_POLL_STATUS.ACTIVE ||
            !should_poll_match_report_fixture(page_data_state)
        )
            return;
        live_poll_state = {
            status: MATCH_REPORT_LIVE_POLL_STATUS.ACTIVE,
            interval_id: setInterval(
                () => void refresh_fixture_data(),
                MATCH_REPORT_LIVE_POLL_INTERVAL_MS,
            ),
        };
    }

    async function load_match_data(): Promise<boolean> {
        page_status_state = MATCH_REPORT_LOADING_STATE;
        const outcome = await load_match_report_page(
            fixture_id,
            page_data_state,
        );
        page_status_state = outcome.page_status_state;
        page_data_state = outcome.page_data_state;
        return page_status_state.status === MATCH_REPORT_PAGE_STATUS.READY;
    }

    async function refresh_fixture_data(): Promise<boolean> {
        if (!fixture_id) return false;
        const result = await refresh_match_report_fixture_data({
            fixture_id,
            dependencies: match_report_page_dependencies,
        });
        if (!result.success) {
            console.warn("[MatchReport] Live refresh failed", {
                event: MATCH_REPORT_LOG_EVENTS.REFRESH_FAILED,
                fixture_id,
                error: result.error,
            });
            return false;
        }
        page_data_state = apply_match_report_refresh_data(
            page_data_state,
            result.data,
        );
        if (!should_poll_match_report_fixture(page_data_state))
            stop_live_polling();
        return true;
    }

    async function handle_download_match_report(): Promise<boolean> {
        downloading_report = true;
        const outcome = await download_match_report_for_page(
            page_data_state,
            get(branding_store).organization_logo_url,
            fixture_id,
        );
        downloading_report = false;
        switch (outcome.status) {
            case MATCH_REPORT_DOWNLOAD_OUTCOME.SKIPPED:
                return false;
            case MATCH_REPORT_DOWNLOAD_OUTCOME.FAILED:
                show_toast(outcome.message, "error");
                return false;
            case MATCH_REPORT_DOWNLOAD_OUTCOME.SUCCEEDED:
                show_toast(outcome.message, "success");
                return true;
        }
    }

    onMount(async () => {
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success && !get(is_public_viewer)) {
            console.warn("[MatchReport] Auth profile unavailable", {
                event: MATCH_REPORT_LOG_EVENTS.AUTH_PROFILE_MISSING,
                fixture_id,
            });
            page_status_state = create_match_report_failed_state(
                auth_result.error_message,
            );
            return;
        }
        const public_data_result = await fetch_public_data_from_convex(
            MATCH_REPORT_PAGE_TEXT.public_data_scope,
            build_public_organization_scope(
                get(public_organization_store).organization_id,
            ),
        );
        if (!public_data_result.success)
            console.warn("[MatchReport] Public data refresh skipped", {
                event: MATCH_REPORT_LOG_EVENTS.PUBLIC_DATA_FETCH_FAILED,
                fixture_id,
                error: public_data_result.error,
            });
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
    {page_status_state}
    {downloading_report}
    live_poll_interval_ms={MATCH_REPORT_LIVE_POLL_INTERVAL_MS}
    loading_error_title={MATCH_REPORT_PAGE_TEXT.loading_error_title}
    {toast_message}
    {toast_type}
    bind:toast_visible
    on_back={navigate_back}
    on_download={handle_download_match_report}
/>
