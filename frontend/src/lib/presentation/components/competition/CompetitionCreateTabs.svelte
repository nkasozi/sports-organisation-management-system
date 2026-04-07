<script lang="ts">
    export let active_tab: "details" | "rules";
</script>

<div class="border-b border-accent-200 dark:border-accent-700">
    <nav class="flex -mb-px overflow-x-auto" aria-label="Tabs">
        <button
            type="button"
            class={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${active_tab === "details" ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300 dark:text-accent-400 dark:hover:text-accent-200"}`}
            on:click={() => (active_tab = "details")}>Details</button
        >
        <button
            type="button"
            class={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${active_tab === "rules" ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300 dark:text-accent-400 dark:hover:text-accent-200"}`}
            on:click={() => (active_tab = "rules")}>Rules</button
        >
    </nav>
</div>
