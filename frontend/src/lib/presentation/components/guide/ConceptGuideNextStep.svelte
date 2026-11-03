<script lang="ts">
    import type { ConceptNextStep } from "$lib/presentation/logic/conceptGuideTypes";

    export let next_step: ConceptNextStep;
    export let route: string;
    export let can_open_route: boolean;
    export let on_show_concept: () => void;
</script>

<div
    class="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 flex flex-wrap items-center gap-3"
>
    <svg
        class="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
        /></svg
    >
    <div class="flex-1 min-w-[12rem]">
        <div
            class="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
        >
            Your next step
        </div>
        <p class="text-sm text-emerald-900 dark:text-emerald-100">
            {next_step.message}
        </p>
    </div>
    <div class="flex gap-2">
        <button
            type="button"
            class="px-3 py-1.5 text-sm text-emerald-700 dark:text-emerald-300 hover:underline"
            on:click={on_show_concept}>Explain</button
        >
        {#if can_open_route}
            <a
                href={route}
                class="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-[0.175rem]"
                >{next_step.action_label}</a
            >
        {/if}
    </div>
</div>
