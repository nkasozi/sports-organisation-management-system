<script lang="ts">
    export let active_tab:
        | "details"
        | "teams"
        | "stages"
        | "rules"
        | "settings"
        | "official_jerseys";
    export let team_count: number;
    export let max_teams: number;

    const tab_labels = {
        details: "Details",
        teams: "Teams",
        stages: "Stages",
        rules: "Rules",
        settings: "Settings",
        official_jerseys: "Official Jerseys",
    } as const;

    function get_tab_label(tab_key: keyof typeof tab_labels): string {
        if (tab_key !== "teams") return tab_labels[tab_key];
        return `${tab_labels.teams} (${team_count}/${max_teams})`;
    }

    function get_tab_classes(tab_key: keyof typeof tab_labels): string {
        const inactive_classes =
            "border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300 dark:text-accent-400 dark:hover:text-accent-200";
        const active_classes =
            "border-primary-500 text-primary-600 dark:text-primary-400";
        return `px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${active_tab === tab_key ? active_classes : inactive_classes}`;
    }
</script>

<div class="border-b border-accent-200 dark:border-accent-700">
    <nav class="flex -mb-px overflow-x-auto" aria-label="Tabs">
        {#each Object.keys(tab_labels) as tab_key}
            <button
                type="button"
                class={get_tab_classes(tab_key as keyof typeof tab_labels)}
                on:click={() => (active_tab = tab_key as typeof active_tab)}
            >
                {get_tab_label(tab_key as keyof typeof tab_labels)}
            </button>
        {/each}
    </nav>
</div>
