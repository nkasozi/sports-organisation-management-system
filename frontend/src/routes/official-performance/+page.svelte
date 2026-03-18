<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import { get_official_performance_rating_use_cases } from "$lib/core/usecases/OfficialPerformanceRatingUseCases";
    import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
    import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
    import { get_competition_stage_use_cases } from "$lib/core/usecases/CompetitionStageUseCases";
    import { get_tier_label } from "$lib/core/entities/OfficialPerformanceRating";
    import {
        build_leaderboard_entries,
        get_tier_badge_classes,
        get_score_bar_width,
        type OfficialLeaderboardEntry,
    } from "$lib/presentation/logic/officialLeaderboardLogic";

    const rating_use_cases = get_official_performance_rating_use_cases();
    const official_use_cases = get_official_use_cases();
    const fixture_use_cases = get_fixture_use_cases();
    const stage_use_cases = get_competition_stage_use_cases();

    let entries: OfficialLeaderboardEntry[] = [];
    let is_loading = true;
    let error_message = "";
    let selected_official: OfficialLeaderboardEntry | null = null;

    async function load_leaderboard(): Promise<void> {
        const auth_result = await ensure_auth_profile();
        if (!auth_result.success || !auth_result.profile) {
            goto("/sign-in");
            return;
        }

        const org_id = auth_result.profile.organization_id;

        const [
            ratings_result,
            officials_result,
            fixtures_result,
            stages_result,
        ] = await Promise.all([
            rating_use_cases.list({ organization_id: org_id }),
            official_use_cases.list({ organization_id: org_id }),
            fixture_use_cases.list({ organization_id: org_id }),
            stage_use_cases.list({}),
        ]);

        if (!ratings_result.success || !ratings_result.data) {
            error_message = !ratings_result.success ? ratings_result.error : "Failed to load ratings";
            is_loading = false;
            return;
        }

        const officials =
            officials_result.success && officials_result.data
                ? officials_result.data.items
                : [];
        const fixtures =
            fixtures_result.success && fixtures_result.data
                ? fixtures_result.data.items
                : [];
        const stages =
            stages_result.success && stages_result.data
                ? stages_result.data.items
                : [];

        const official_name_map = new Map(
            officials.map((o) => [
                o.id,
                `${o.first_name} ${o.last_name}`.trim(),
            ]),
        );

        entries = build_leaderboard_entries(
            ratings_result.data.items,
            fixtures,
            stages,
            official_name_map,
        );

        is_loading = false;
    }

    onMount(load_leaderboard);
</script>

<svelte:head>
    <title>Official Performance - Sports Management</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-6">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">
            Official Performance Leaderboard
        </h1>
        <p class="text-sm text-gray-500 mt-1">
            Weighted scores accounting for game importance
        </p>
    </div>

    {#if is_loading}
        <p class="text-center text-gray-500 py-16">Loading leaderboard...</p>
    {:else if error_message}
        <p class="text-center text-red-500 py-10">{error_message}</p>
    {:else if entries.length === 0}
        <div class="text-center py-16 text-gray-400">
            <p class="text-lg mb-2">No ratings yet</p>
            <p class="text-sm">
                Rate officials from the fixture detail page after games are
                completed.
            </p>
        </div>
    {:else}
        <div class="space-y-3">
            {#each entries as entry, index (entry.official_id)}
                <button
                    type="button"
                    class="w-full text-left bg-white border border-gray-200 rounded-lg p-4 cursor-pointer"
                    on:click={() => {
                        selected_official =
                            selected_official?.official_id === entry.official_id
                                ? null
                                : entry;
                    }}
                >
                    <div class="flex items-center gap-3">
                        <span
                            class="w-8 text-center font-bold text-gray-400 text-sm"
                            >{index + 1}</span
                        >
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="font-semibold text-gray-900">
                                    {entry.official_name}
                                </p>
                                <span
                                    class="text-xs px-2 py-0.5 rounded-full {get_tier_badge_classes(
                                        entry.tier,
                                    )}"
                                >
                                    {get_tier_label(entry.tier)}
                                </span>
                            </div>
                            <p class="text-xs text-gray-500 mt-0.5">
                                {entry.rating_count} ratings
                            </p>
                        </div>
                        <div class="text-right shrink-0">
                            <p class="text-2xl font-bold text-gray-900">
                                {entry.composite_score}
                            </p>
                            <p class="text-xs text-gray-400">/ 10</p>
                        </div>
                    </div>

                    {#if selected_official?.official_id === entry.official_id}
                        <div
                            class="mt-4 pt-4 border-t border-gray-100 space-y-2"
                        >
                            {#each [{ label: "Overall", value: entry.overall }, { label: "Decision Accuracy", value: entry.decision_accuracy }, { label: "Game Control", value: entry.game_control }, { label: "Communication", value: entry.communication }, { label: "Fitness", value: entry.fitness }] as dim}
                                <div class="flex items-center gap-2">
                                    <span
                                        class="w-36 text-xs text-gray-600 shrink-0"
                                        >{dim.label}</span
                                    >
                                    <div
                                        class="flex-1 bg-gray-100 rounded-full h-2"
                                    >
                                        <div
                                            class="bg-emerald-500 h-2 rounded-full"
                                            style="width: {get_score_bar_width(
                                                dim.value,
                                            )}"
                                        ></div>
                                    </div>
                                    <span
                                        class="w-8 text-right text-xs font-medium text-gray-700"
                                        >{dim.value}</span
                                    >
                                </div>
                            {/each}
                        </div>
                    {/if}
                </button>
            {/each}
        </div>
    {/if}
</div>
