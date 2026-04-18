<script lang="ts">
    import TeamLogoThumbnail from "$lib/presentation/components/ui/TeamLogoThumbnail.svelte";
    import type { TeamStanding } from "$lib/presentation/logic/competitionStageResults";

    export let standing: TeamStanding;
    export let index: number;
    export let selected_team_id: string;
    export let highlight_top_count: number;
    export let live_team_ids: Set<string>;
    export let on_team_click: (team_id: string, team_name: string) => void;
</script>

<tr
    class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors {selected_team_id ===
    standing.team_id
        ? 'bg-primary-50 dark:bg-primary-900/20'
        : ''}"
    on:click={() => on_team_click(standing.team_id, standing.team_name)}
>
    <td
        class="sticky left-0 z-10 border-r border-gray-200 dark:border-gray-700 px-3 py-3 text-sm {selected_team_id ===
        standing.team_id
            ? 'bg-primary-50 dark:bg-primary-900/20'
            : 'bg-white dark:bg-gray-900'}"
    >
        <span class="flex items-center gap-2">
            <span
                class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full {index <
                highlight_top_count
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}"
                >{index + 1}</span
            >
            {#if live_team_ids.has(standing.team_id)}
                <span class="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span
                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                    ></span>
                    <span
                        class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"
                    ></span>
                </span>
            {/if}
            <TeamLogoThumbnail
                logo_url={standing.team_logo_url}
                team_name={standing.team_name}
                size="sm"
            />
            <span
                class="font-medium text-accent-900 dark:text-accent-100 hover:text-primary-600 dark:hover:text-primary-400 truncate max-w-[120px]"
            >
                {standing.team_name}
            </span>
            <svg
                class="w-3.5 h-3.5 flex-shrink-0 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
            </svg>
        </span>
    </td>
    <td
        class="px-3 py-3 text-sm text-center whitespace-nowrap text-gray-600 dark:text-gray-400"
        >{standing.played}</td
    >
    <td
        class="px-3 py-3 text-sm text-center whitespace-nowrap text-gray-600 dark:text-gray-400"
        >{standing.won}</td
    >
    <td
        class="px-3 py-3 text-sm text-center whitespace-nowrap text-gray-600 dark:text-gray-400"
        >{standing.drawn}</td
    >
    <td
        class="px-3 py-3 text-sm text-center whitespace-nowrap text-gray-600 dark:text-gray-400"
        >{standing.lost}</td
    >
    <td
        class="px-3 py-3 text-sm text-center whitespace-nowrap text-gray-600 dark:text-gray-400"
        >{standing.goals_for}</td
    >
    <td
        class="px-3 py-3 text-sm text-center whitespace-nowrap text-gray-600 dark:text-gray-400"
        >{standing.goals_against}</td
    >
    <td
        class="px-3 py-3 text-sm text-center whitespace-nowrap {standing.goal_difference >
        0
            ? 'text-green-600'
            : standing.goal_difference < 0
              ? 'text-red-600'
              : 'text-gray-600 dark:text-gray-400'}"
        >{standing.goal_difference > 0 ? "+" : ""}{standing.goal_difference}</td
    >
    <td
        class="px-3 py-3 text-sm text-center whitespace-nowrap font-bold text-accent-900 dark:text-accent-100"
        >{standing.points}</td
    >
    <td class="px-3 py-3 text-center whitespace-nowrap">
        <div class="flex items-center justify-center gap-1.5">
            {#each standing.form as form_result}
                <span
                    class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold {form_result ===
                    'W'
                        ? 'bg-green-500 text-white'
                        : form_result === 'D'
                          ? 'bg-gray-400 text-white'
                          : 'bg-red-500 text-white'}"
                    >{form_result === "L" ? "✕" : form_result}</span
                >
            {/each}
        </div>
    </td>
</tr>
