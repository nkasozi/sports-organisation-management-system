<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Team } from "$lib/core/entities/Team";
    import { get_team_logo } from "$lib/core/entities/Team";
    import TeamLogoThumbnail from "$lib/presentation/components/ui/TeamLogoThumbnail.svelte";
    import type { PeriodButtonConfig } from "$lib/presentation/logic/liveGameDetailState";

    export let organization_name: string;
    export let competition_name: string;
    export let fixture_status: Fixture["status"];
    export let scheduled_time: string;
    export let home_team: Team | undefined;
    export let away_team: Team | undefined;
    export let home_score: number;
    export let away_score: number;
    export let current_period_label: string;
    export let clock_display: string;
    export let is_clock_running: boolean;
    export let can_modify_game: boolean;
    export let is_game_active: boolean;
    export let is_game_completed: boolean;
    export let show_extra_time_button: boolean;
    export let downloading_report: boolean;
    export let period_button_config: PeriodButtonConfig | undefined;
    export let on_back: () => void;
    export let on_start: () => void;
    export let on_toggle_clock: () => void;
    export let on_period_action: () => void;
    export let on_extra_time: () => void;
    export let on_end: () => void;
    export let on_download_match_report: () => Promise<boolean>;
</script>

<div class="bg-gray-900 text-white px-4 py-3 sticky top-0 z-40">
    {#if organization_name || competition_name}<div
            class="text-center max-w-4xl mx-auto pb-2"
        >
            {#if organization_name}<p
                    class="text-xs uppercase tracking-widest text-gray-400 font-medium"
                >
                    {organization_name}
                </p>{/if}{#if competition_name}<p
                    class="text-sm font-semibold text-gray-200"
                >
                    {competition_name}
                </p>{/if}
        </div>{/if}
    <div class="flex items-center justify-between max-w-4xl mx-auto relative">
        <button
            type="button"
            class="p-2 hover:bg-gray-800 rounded-[0.175rem] absolute left-4 top-1/2 -translate-y-1/2 md:static md:translate-y-0"
            on:click={on_back}
            aria-label="Go back"
            ><svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                /></svg
            ></button
        >
        <div class="flex flex-col items-center flex-1">
            <div class="flex items-center gap-4 sm:gap-6 justify-center">
                <div class="text-center">
                    <div class="flex justify-center mb-1">
                        <TeamLogoThumbnail
                            logo_url={home_team ? get_team_logo(home_team) : ""}
                            team_name={home_team?.name ?? "HOME"}
                            size="md"
                        />
                    </div>
                    <div
                        class="text-xs text-gray-400 mb-1 truncate max-w-20 sm:max-w-none"
                    >
                        {home_team?.name ?? "HOME"}
                    </div>
                    <div class="text-3xl sm:text-4xl font-bold tabular-nums">
                        {home_score}
                    </div>
                </div>
                <div class="text-center min-w-24 sm:min-w-32">
                    <div class="text-xs text-gray-400 mb-1">
                        {#if fixture_status === "in_progress"}{current_period_label}{:else if fixture_status === "completed"}Full
                            Time{:else}{scheduled_time}{/if}
                    </div>
                    {#if fixture_status === "in_progress"}<div
                            class="text-xl sm:text-2xl font-mono font-bold text-primary-400"
                        >
                            {clock_display}
                        </div>
                        {#if is_clock_running}<div
                                class="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1 animate-pulse"
                            ></div>{/if}{:else}<div
                            class="text-xl font-semibold text-gray-400"
                        >
                            VS
                        </div>{/if}
                </div>
                <div class="text-center">
                    <div class="flex justify-center mb-1">
                        <TeamLogoThumbnail
                            logo_url={away_team ? get_team_logo(away_team) : ""}
                            team_name={away_team?.name ?? "AWAY"}
                            size="md"
                        />
                    </div>
                    <div
                        class="text-xs text-gray-400 mb-1 truncate max-w-20 sm:max-w-none"
                    >
                        {away_team?.name ?? "AWAY"}
                    </div>
                    <div class="text-3xl sm:text-4xl font-bold tabular-nums">
                        {away_score}
                    </div>
                </div>
            </div>
            <div class="flex gap-2 mt-3 flex-wrap justify-center">
                {#if can_modify_game}{#if fixture_status === "scheduled"}<button
                            class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-[0.175rem] text-sm font-medium"
                            on:click={on_start}>▶️ Start</button
                        >{:else if is_game_active}<button
                            class="px-3 py-2 rounded-[0.175rem] text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                            on:click={on_toggle_clock}
                            >{is_clock_running
                                ? "⏸️ Pause Time"
                                : "▶️ Resume"}</button
                        >{#if period_button_config}<button
                                class="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-[0.175rem] text-sm font-medium"
                                on:click={on_period_action}
                                >{period_button_config.icon}
                                {period_button_config.label}</button
                            >{/if}{#if show_extra_time_button}<button
                                class="px-3 py-2 rounded-[0.175rem] text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                                on:click={on_extra_time}>⏱️ Add Time</button
                            >{/if}<button
                            class="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-[0.175rem] text-sm font-medium"
                            on:click={on_end}>🏁 End Game</button
                        >{/if}{/if}{#if is_game_completed}<button
                        class="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-[0.175rem] text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        disabled={downloading_report}
                        on:click={() => void on_download_match_report()}
                        >{#if downloading_report}<svg
                                class="w-4 h-4 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                                ><circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle><path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path></svg
                            >Generating...{:else}📄 Match Report{/if}</button
                    >{/if}
            </div>
        </div>
    </div>
</div>
