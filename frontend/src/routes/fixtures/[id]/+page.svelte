<script lang="ts">
    import { onMount } from "svelte";

    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { get_fixture_use_cases } from "$lib/infrastructure/registry/useCaseFactories";
    import OfficialRatingPanel from "$lib/presentation/components/OfficialRatingPanel.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
    import { auth_store } from "$lib/presentation/stores/auth";

    import {
        can_role_manage_game,
        can_role_rate_officials,
        FIXTURE_DETAIL_PAGE_STATUS,
        FIXTURE_DETAIL_PATHS,
        type FixtureDetailPageState,
        get_fixture_status_badge_class,
        is_completed_fixture,
        load_fixture_detail,
    } from "./fixtureDetailPageState";

    const fixture_use_cases = get_fixture_use_cases();

    let page_state: FixtureDetailPageState = {
        status: FIXTURE_DETAIL_PAGE_STATUS.LOADING,
    };

    $: fixture_id = $page.params.id;
    $: current_profile_state = $auth_store.current_profile;
    $: current_profile_id =
        current_profile_state.status === PRESENCE_STATUS.PRESENT
            ? current_profile_state.profile.id
            : "";
    $: current_profile_role =
        current_profile_state.status === PRESENCE_STATUS.PRESENT
            ? current_profile_state.profile.role
            : "";
    $: can_rate_officials = can_role_rate_officials(current_profile_role);

    async function load_fixture(): Promise<void> {
        const auth_result = await ensure_auth_profile();
        if (
            !auth_result.success ||
            auth_result.profile_state.status !== PRESENCE_STATUS.PRESENT
        ) {
            await goto(FIXTURE_DETAIL_PATHS.SIGN_IN);
            return;
        }
        page_state = await load_fixture_detail(fixture_id, (id: string) =>
            fixture_use_cases.get_by_id(id),
        );
    }

    function format_date(date_string: string): string {
        if (!date_string) return "—";
        return new Date(date_string).toLocaleDateString([], {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    onMount(load_fixture);
</script>

<svelte:head>
    <title>Fixture Details - Sports Management</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-6">
    {#if page_state.status === FIXTURE_DETAIL_PAGE_STATUS.LOADING}
        <p class="text-center text-gray-500 py-10">Loading fixture...</p>
    {:else if page_state.status === FIXTURE_DETAIL_PAGE_STATUS.FAILED}
        <p class="text-center text-red-500 py-10" role="alert">
            {page_state.message}
        </p>
    {:else}
        {@const fixture = page_state.fixture}
        {@const is_completed = is_completed_fixture(fixture)}
        <div class="mb-6">
            <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
                <h1 class="text-xl font-bold text-gray-900">Fixture Details</h1>
                <span
                    class="text-xs px-2 py-1 rounded-full font-medium {get_fixture_status_badge_class(
                        fixture.status,
                    )}"
                >
                    {fixture.status.replace("_", " ")}
                </span>
            </div>

            <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div
                    class="flex items-center justify-between gap-2 text-center"
                >
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800">
                            {fixture.home_team_name ?? "Home Team"}
                        </p>
                        {#if is_completed}
                            <p class="text-3xl font-bold text-gray-900">
                                {fixture.home_team_score ?? 0}
                            </p>
                        {/if}
                    </div>
                    <div class="text-gray-400 font-medium text-sm">vs</div>
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800">
                            {fixture.away_team_name ?? "Away Team"}
                        </p>
                        {#if is_completed}
                            <p class="text-3xl font-bold text-gray-900">
                                {fixture.away_team_score ?? 0}
                            </p>
                        {/if}
                    </div>
                </div>
                <div class="mt-3 text-sm text-gray-500 text-center space-y-1">
                    <p>
                        {format_date(fixture.scheduled_date)} · {fixture.scheduled_time}
                    </p>
                    {#if fixture.venue}<p>{fixture.venue}</p>{/if}
                    {#if fixture.round_name}<p>
                            Round: {fixture.round_name}
                        </p>{/if}
                </div>
            </div>

            {#if fixture.assigned_officials.length > 0}
                <div
                    class="bg-white border border-gray-200 rounded-lg p-4 mb-4"
                >
                    <h3 class="text-sm font-medium text-gray-700 mb-2">
                        Assigned Officials
                    </h3>
                    <ul class="space-y-1">
                        {#each fixture.assigned_officials as ao}
                            <li class="text-sm text-gray-600">
                                {ao.role_name}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </div>

        {#if can_rate_officials && is_completed && current_profile_state.status === PRESENCE_STATUS.PRESENT}
            <div class="mb-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    Rate Officials
                </h2>
                <OfficialRatingPanel
                    {fixture_id}
                    organization_id={fixture.organization_id}
                    rater_user_id={current_profile_id}
                    rater_role={current_profile_role}
                    assigned_official_ids={fixture.assigned_officials.map(
                        (assignment) => assignment.official_id,
                    )}
                />
            </div>
        {:else if can_rate_officials && !is_completed}
            <p class="text-sm text-gray-400 text-center py-4">
                Ratings can be submitted after the fixture is marked as
                completed.
            </p>
        {/if}

        <div class="flex gap-3">
            <a
                href={FIXTURE_DETAIL_PATHS.FIXTURES}
                class="text-sm text-blue-600 underline">← Back to Fixtures</a
            >
            {#if can_role_manage_game(current_profile_role)}
                <a
                    href="/fixtures/{fixture_id}/manage"
                    class="text-sm text-blue-600 underline">Manage Game →</a
                >
            {/if}
        </div>
    {/if}
</div>
