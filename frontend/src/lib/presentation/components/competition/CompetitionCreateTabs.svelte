<script lang="ts">
    import {
        COMPETITION_CREATE_TAB,
        type CompetitionCreateTab,
    } from "./competitionTabConstants";
    export let active_tab: CompetitionCreateTab;
</script>

<div class="border-b border-accent-200 dark:border-accent-700">
    <nav class="flex -mb-px overflow-x-auto" aria-label="Tabs">
        <button
            type="button"
            class={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${active_tab === COMPETITION_CREATE_TAB.DETAILS ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300 dark:text-accent-400 dark:hover:text-accent-200"}`}
            on:click={() => (active_tab = COMPETITION_CREATE_TAB.DETAILS)}
            >Details</button
        >
        <button
            type="button"
            class={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${active_tab === COMPETITION_CREATE_TAB.RULES ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300 dark:text-accent-400 dark:hover:text-accent-200"}`}
            on:click={() => (active_tab = COMPETITION_CREATE_TAB.RULES)}
            >Rules</button
        >
    </nav>
</div>
