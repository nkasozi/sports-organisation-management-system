<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Official } from "$lib/core/entities/Official";
    import type { OfficialPerformanceRating } from "$lib/core/entities/OfficialPerformanceRating";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { UserScopeProfile } from "$lib/core/interfaces/ports";
    import {
        create_none_option,
        create_some_option,
        type Option,
    } from "$lib/core/types/Option";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import type {
        OfficialLeaderboardEntry,
        PerFixtureRating,
    } from "$lib/presentation/logic/officialLeaderboardLogic";
    import { official_leaderboard_page_dependencies } from "$lib/presentation/logic/officialLeaderboardPageDependencies";
    import {
        load_official_leaderboard_page_state,
        type OfficialLeaderboardPageData,
    } from "$lib/presentation/logic/officialLeaderboardPageLoad";
    import {
        rebuild_official_leaderboard_view,
        select_official_leaderboard_entry,
    } from "$lib/presentation/logic/officialLeaderboardPageState";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
    import { auth_store } from "$lib/presentation/stores/auth";

    import { OFFICIAL_LEADERBOARD_MESSAGES } from "./officialLeaderboardMessages";
    import OfficialLeaderboardPageShell from "./OfficialLeaderboardPageShell.svelte";
    import {
        create_official_leaderboard_failed_state,
        create_official_leaderboard_loading_state,
        create_official_leaderboard_ready_state,
        type OfficialLeaderboardPageStatusState,
    } from "./officialLeaderboardPageStatus";

    let page_status_state: OfficialLeaderboardPageStatusState =
            create_official_leaderboard_loading_state(),
        organizations: Organization[] = [],
        selected_organization_id = "",
        leaderboard_entries: OfficialLeaderboardEntry[] = [],
        selected_entry: OfficialLeaderboardEntry | undefined = undefined,
        selected_breakdown: PerFixtureRating[] = [],
        user_official_id = "",
        all_ratings: OfficialPerformanceRating[] = [],
        all_officials: Official[] = [],
        all_fixtures: Fixture[] = [],
        all_stages: CompetitionStage[] = [];

    async function load_all_data(): Promise<void> {
        page_status_state = create_official_leaderboard_loading_state();
        const current_profile_state = get(auth_store).current_profile;
        const load_result = await load_official_leaderboard_page_state({
            profile_state:
                current_profile_state.status === PRESENCE_STATUS.PRESENT
                    ? {
                          status: PRESENCE_STATUS.PRESENT,
                          profile:
                              current_profile_state.profile as unknown as UserScopeProfile,
                      }
                    : { status: PRESENCE_STATUS.MISSING },
            dependencies: official_leaderboard_page_dependencies,
        });
        if (!load_result.success) {
            page_status_state = create_official_leaderboard_failed_state(
                load_result.error_message,
            );
            return;
        }
        apply_page_state(load_result.data);
        page_status_state = create_official_leaderboard_ready_state();
    }

    function apply_page_state(page_state: OfficialLeaderboardPageData): void {
        organizations = page_state.organizations;
        selected_organization_id = page_state.selected_organization_id;
        leaderboard_entries = page_state.leaderboard_entries;
        selected_entry = page_state.selected_entry;
        selected_breakdown = page_state.selected_breakdown;
        user_official_id = page_state.user_official_id;
        all_ratings = page_state.all_ratings;
        all_officials = page_state.all_officials;
        all_fixtures = page_state.all_fixtures;
        all_stages = page_state.all_stages;
    }

    $: selected_entry_option = to_selected_entry_option(selected_entry);

    function to_selected_entry_option(
        entry: OfficialLeaderboardEntry | undefined,
    ): Option<OfficialLeaderboardEntry> {
        return entry ? create_some_option(entry) : create_none_option();
    }

    function rebuild_entries(): void {
        ({ leaderboard_entries, selected_entry, selected_breakdown } =
            rebuild_official_leaderboard_view({
                all_ratings,
                all_officials,
                all_fixtures,
                all_stages,
                selected_organization_id,
                user_official_id,
            }));
    }

    function select_official(entry: OfficialLeaderboardEntry): void {
        ({ selected_entry, selected_breakdown } =
            select_official_leaderboard_entry({
                all_ratings,
                all_fixtures,
                selected_organization_id,
                entry,
            }));
    }

    function close_breakdown(): void {
        selected_entry = void 0;
        selected_breakdown = [];
    }

    function handle_organization_change(): void {
        if (selected_entry && !user_official_id) close_breakdown();
        rebuild_entries();
    }

    onMount(async () => {
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            console.warn("[OfficialLeaderboard] Auth profile unavailable", {
                event: "official_leaderboard_auth_profile_missing",
            });
            page_status_state = create_official_leaderboard_failed_state(
                auth_result.error_message,
            );
            return;
        }
        await load_all_data();
    });
</script>

<svelte:head
    ><title>{OFFICIAL_LEADERBOARD_MESSAGES.PAGE_TITLE}</title></svelte:head
>

<OfficialLeaderboardPageShell
    {organizations}
    bind:selected_organization_id
    {leaderboard_entries}
    {selected_entry_option}
    {selected_breakdown}
    {user_official_id}
    {page_status_state}
    on_close_breakdown={close_breakdown}
    on_organization_change={handle_organization_change}
    on_select_official={select_official}
/>
