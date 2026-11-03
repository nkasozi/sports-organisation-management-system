<script lang="ts">
    import type { Organization } from "$lib/core/entities/Organization";
    import { build_named_record_options } from "$lib/presentation/components/ui/searchable_select_options";
    import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";

    export let organizations: Organization[] = [];
    export let selected_organization_id = "";
    export let can_change_organizations: boolean;
    export let is_loading_fixtures: boolean;
    export let on_organization_change: () => void;
    export let can_start_games: boolean = true;

    $: organization_options = build_named_record_options(organizations);

    function choose_organization(organization_id: string): boolean {
        selected_organization_id = organization_id;
        on_organization_change();
        return true;
    }

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
                {can_start_games ? "Live Game Management" : "Live Games"}
            </h1>
            <p
                class="text-sm sm:text-base text-accent-600 dark:text-accent-300"
            >
                {can_start_games
                    ? "Start and manage fixtures in real-time"
                    : "Follow games as they happen"}
            </p>
        </div>
        {#if organizations.length > 0}
            <div class="flex-shrink-0">
                {#if can_change_organizations}
                    <div class="w-full sm:w-auto sm:min-w-[220px]">
                        <SearchableSelectField
                            name="live_games_organization"
                            value={selected_organization_id}
                            options={organization_options}
                            disabled={is_loading_fixtures}
                            on:change={(event) =>
                                choose_organization(event.detail.value)}
                        />
                    </div>
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
