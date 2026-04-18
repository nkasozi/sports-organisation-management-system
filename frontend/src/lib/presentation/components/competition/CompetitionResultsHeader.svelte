<script lang="ts">
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Organization } from "$lib/core/entities/Organization";

    export let organizations: Organization[];
    export let selected_organization_id: string;
    export let competitions: Competition[];
    export let selected_competition_id: string;
    export let selected_competition_format_name = "";
    export let can_change_organizations: boolean;
    export let share_link_copied: boolean;
    export let on_organization_change: () => Promise<void>;
    export let on_competition_change: () => void;
    export let on_copy_share_link: () => boolean;
</script>

<div
    class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4"
>
    <div class="min-w-0">
        <h2
            class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100"
        >
            Competition Results
        </h2>
        <p class="text-xs sm:text-sm text-accent-600 dark:text-accent-400">
            View standings, fixtures, and statistics
        </p>
    </div>

    <div
        class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto"
    >
        {#if can_change_organizations}
            <select
                bind:value={selected_organization_id}
                on:change={() => void on_organization_change()}
                class="select-styled w-full sm:w-auto min-w-0 sm:min-w-[200px]"
            >
                {#each organizations as organization}
                    <option value={organization.id}>{organization.name}</option>
                {/each}
            </select>
        {:else}
            <span
                class="text-sm font-medium text-accent-700 dark:text-accent-300 px-3 py-2 bg-accent-100 dark:bg-accent-800 rounded-lg"
            >
                {organizations.find(
                    (organization: Organization) =>
                        organization.id === selected_organization_id,
                )?.name || "Organization"}
            </span>
        {/if}

        <select
            id="competition_select"
            bind:value={selected_competition_id}
            on:change={on_competition_change}
            class="select-styled w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]"
        >
            {#each competitions as competition}
                <option value={competition.id}>{competition.name}</option>
            {/each}
        </select>

        <button
            type="button"
            class={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[0.175rem] transition-colors ${share_link_copied ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-accent-100 text-accent-700 dark:bg-accent-800 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-700"}`}
            on:click={on_copy_share_link}
            title="Copy shareable link"
        >
            {#if share_link_copied}
                <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                    /></svg
                >
                <span class="hidden sm:inline">Copied</span>
            {:else}
                <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    /></svg
                >
                <span class="hidden sm:inline">Share</span>
            {/if}
        </button>
    </div>
</div>

{#if selected_competition_format_name}
    <div class="flex flex-wrap items-center gap-2">
        <span
            class="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded-full"
        >
            {selected_competition_format_name}
        </span>
    </div>
{/if}
