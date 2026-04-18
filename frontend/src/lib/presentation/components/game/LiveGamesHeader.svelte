<script lang="ts">
    import type { Organization } from "$lib/core/entities/Organization";

    export let organizations: Organization[] = [];
    export let selected_organization_id = "";
    export let can_change_organizations: boolean;
    export let is_loading_fixtures: boolean;
    export let on_organization_change: () => void;

    function get_current_organization_name(): string {
        return (
            organizations.find(
                (organization) => organization.id === selected_organization_id,
            )?.name || "Organization"
        );
    }
</script>

<div class="mb-6 sm:mb-8">
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1 sm:mb-2 pb-4 border-b border-accent-200 dark:border-accent-700"
    >
        <div>
            <h1
                class="text-2xl sm:text-3xl font-bold text-accent-900 dark:text-white"
            >
                Live Game Management
            </h1>
            <p
                class="text-sm sm:text-base text-accent-600 dark:text-accent-300"
            >
                Start and manage fixtures in real-time
            </p>
        </div>
        {#if organizations.length > 0}
            <div class="flex-shrink-0">
                {#if can_change_organizations}
                    <select
                        bind:value={selected_organization_id}
                        on:change={on_organization_change}
                        class="select-styled w-full sm:w-auto sm:min-w-[220px]"
                        disabled={is_loading_fixtures}
                    >
                        {#each organizations as organization}
                            <option value={organization.id}
                                >{organization.name}</option
                            >
                        {/each}
                    </select>
                {:else}
                    <span
                        class="inline-block text-sm font-medium text-accent-700 dark:text-accent-300 px-3 py-2 bg-accent-100 dark:bg-accent-800 rounded-[0.175rem]"
                    >
                        {get_current_organization_name()}
                    </span>
                {/if}
            </div>
        {/if}
    </div>
</div>
