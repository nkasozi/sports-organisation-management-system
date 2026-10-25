<script lang="ts">
    import type { ConceptNextStep } from "$lib/presentation/logic/conceptGuideTypes";

    export let next_step: ConceptNextStep;
    export let route: string;
    export let can_open_route: boolean;
    export let on_show_concept: () => void;
</script>

<div
    class="rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 px-4 py-3 flex flex-wrap items-center gap-3"
>
    <svg
        class="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0"
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
            class="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300"
        >
            Your next step
        </div>
        <p class="text-sm text-primary-900 dark:text-primary-100">
            {next_step.message}
        </p>
    </div>
    <div class="flex gap-2">
        <button
            type="button"
            class="px-3 py-1.5 text-sm text-primary-700 dark:text-primary-300 hover:underline"
            on:click={on_show_concept}>Explain</button
        >
        {#if can_open_route}
            <a
                href={route}
                class="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-[0.175rem]"
                >{next_step.action_label}</a
            >
        {/if}
    </div>
</div>
