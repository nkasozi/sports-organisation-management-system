<script lang="ts">
    import type { CompetitionRuleOverrides } from "$lib/core/entities/Competition";
    import type { CompetitionCreateSelectedSportState } from "$lib/presentation/logic/competitionCreatePageFlow";

    import SportRulesCustomizer from "./SportRulesCustomizer.svelte";

    export let organization_id = "";
    export let selected_sport_state: CompetitionCreateSelectedSportState = {
        status: "missing",
    };
    export let rule_overrides: CompetitionRuleOverrides =
        {} as CompetitionRuleOverrides;
</script>

<div class="space-y-6">
    <div class="border-b border-accent-200 dark:border-accent-700 pb-4 mb-4">
        <h2 class="text-lg font-medium text-accent-900 dark:text-accent-100">
            Sport Rules
        </h2>
        <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
            Customize competition-specific rules inherited from the sport
        </p>
    </div>
    {#if organization_id && selected_sport_state.status === "present"}
        <SportRulesCustomizer
            sport={selected_sport_state.sport}
            bind:rule_overrides
        />
    {:else}
        <div
            class="rounded-lg border border-accent-200 dark:border-accent-700 p-4"
        >
            <p class="text-sm text-accent-600 dark:text-accent-400">
                Select an organization and sport to customize competition rules.
            </p>
        </div>
    {/if}
</div>
