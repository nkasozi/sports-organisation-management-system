<script lang="ts">
    import type { Competition } from "$lib/core/entities/Competition";
    import {
        get_competition_initials,
        get_status_class,
    } from "$lib/presentation/logic/dashboardPageLogic";

    export let loading: boolean;
    export let recent_competitions: Competition[];
    export let user_has_org_admin_access: boolean;
    export let get_sport_name_for_competition: (
        competition_id: string,
    ) => string;
</script>

<div class="card p-6">
    <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4">
        Recent Competitions
    </h2>
    <div class="space-y-4">
        {#if loading}
            {#each Array(3) as _}
                <div class="animate-pulse">
                    <div class="flex items-center space-x-4">
                        <div
                            class="h-10 w-10 bg-accent-200 dark:bg-accent-700 rounded-lg"
                        ></div>
                        <div class="flex-1 space-y-2">
                            <div
                                class="h-4 bg-accent-200 dark:bg-accent-700 rounded w-3/4"
                            ></div>
                            <div
                                class="h-3 bg-accent-200 dark:bg-accent-700 rounded w-1/2"
                            ></div>
                        </div>
                    </div>
                </div>
            {/each}
        {:else if recent_competitions.length === 0}
            <div class="text-center py-4">
                <p class="text-sm text-accent-500 dark:text-accent-400">
                    No competitions yet.
                    {#if user_has_org_admin_access}
                        <a
                            href="/competitions/create"
                            class="text-primary-500 hover:underline"
                            >Create one</a
                        >
                    {/if}
                </p>
            </div>
        {:else}
            {#each recent_competitions as competition, index}
                <svelte:element
                    this={user_has_org_admin_access ? "a" : "div"}
                    href={user_has_org_admin_access
                        ? "/competitions"
                        : void 0}
                    class="flex items-center space-x-4 p-2 -mx-2 rounded-lg {user_has_org_admin_access
                        ? 'hover:bg-accent-50 dark:hover:bg-accent-700/50 cursor-pointer'
                        : ''} transition-colors"
                >
                    <div
                        class="h-10 w-10 rounded-lg flex items-center justify-center {index %
                            3 ===
                        0
                            ? 'bg-sky-100 dark:bg-sky-900/60'
                            : index % 3 === 1
                              ? 'bg-teal-100 dark:bg-teal-900/60'
                              : 'bg-fuchsia-100 dark:bg-fuchsia-900/60'}"
                    >
                        <span
                            class="{index % 3 === 0
                                ? 'text-sky-600'
                                : index % 3 === 1
                                  ? 'text-teal-500'
                                  : 'text-fuchsia-500'} font-semibold text-sm"
                        >
                            {get_competition_initials(competition.name)}
                        </span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p
                            class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
                        >
                            {competition.name}
                        </p>
                        <div class="flex flex-wrap items-center gap-1 mt-0.5">
                            <span
                                class="inline-flex items-center px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded text-xs"
                            >
                                {get_sport_name_for_competition(competition.id)}
                            </span>
                            <span
                                class="text-xs text-accent-500 dark:text-accent-400"
                                >{competition.team_ids?.length || 0} teams</span
                            >
                        </div>
                    </div>
                    <span
                        class="{get_status_class(
                            competition.status,
                        )} px-2 py-1 text-xs rounded-full"
                    >
                        {competition.status.charAt(0).toUpperCase() +
                            competition.status.slice(1)}
                    </span>
                </svelte:element>
            {/each}
        {/if}
    </div>
</div>
