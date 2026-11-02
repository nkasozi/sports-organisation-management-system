<script lang="ts">
    import { onMount } from "svelte";

    import { get_app_settings_storage } from "$lib/infrastructure/container";
    import {
        load_results_view_mode,
        RESULTS_VIEW_MODE,
        type ResultsViewMode,
        type ResultsViewSurface,
        save_results_view_mode,
    } from "$lib/presentation/logic/competitionResultsViewMode";

    import { RESULTS_VIEW_MODE_TEXT } from "./competitionResultsDisplayConstants";

    export let surface: ResultsViewSurface;
    export let view_mode: ResultsViewMode;

    const view_mode_options: ResultsViewMode[] =
        Object.values(RESULTS_VIEW_MODE);

    onMount(async (): Promise<boolean> => {
        const result = await load_results_view_mode({
            storage: get_app_settings_storage(),
            surface,
        });
        if (!result.success) return false;
        view_mode = result.data;
        return true;
    });

    async function choose_view_mode(
        next_view_mode: ResultsViewMode,
    ): Promise<boolean> {
        view_mode = next_view_mode;
        const result = await save_results_view_mode({
            storage: get_app_settings_storage(),
            surface,
            view_mode: next_view_mode,
        });
        return result.success;
    }
</script>

<div
    class="inline-flex rounded-[0.175rem] border border-accent-200 dark:border-accent-700 overflow-hidden shrink-0"
    role="group"
    aria-label={RESULTS_VIEW_MODE_TEXT.GROUP_LABEL}
>
    {#each view_mode_options as option}
        <button
            type="button"
            class="flex items-center justify-center w-9 h-8 transition-colors {view_mode ===
            option
                ? 'bg-primary-600 text-white'
                : 'text-accent-600 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-700'}"
            title={RESULTS_VIEW_MODE_TEXT[option]}
            aria-label={RESULTS_VIEW_MODE_TEXT[option]}
            aria-pressed={view_mode === option}
            on:click={() => void choose_view_mode(option)}
        >
            <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d={option === RESULTS_VIEW_MODE.LIST
                        ? "M4 6h16M4 12h16M4 18h16"
                        : "M3 5h5v4H3zM3 15h5v4H3zM8 7h3v10H8M11 12h4M15 10h6v4h-6z"}
                /></svg
            >
        </button>
    {/each}
</div>
