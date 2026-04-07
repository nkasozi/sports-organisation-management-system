<script lang="ts">
    import type { CreateCompetitionInput } from "$lib/core/entities/Competition";
    import type { Sport } from "$lib/core/entities/Sport";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";

    import CompetitionCreateActions from "./CompetitionCreateActions.svelte";
    import CompetitionCreateDetailsTab from "./CompetitionCreateDetailsTab.svelte";
    import CompetitionCreateHeader from "./CompetitionCreateHeader.svelte";
    import CompetitionCreateRulesTab from "./CompetitionCreateRulesTab.svelte";
    import CompetitionCreateTabs from "./CompetitionCreateTabs.svelte";

    export let form_data: CreateCompetitionInput;
    export let organization_options: SelectOption[];
    export let competition_format_options: SelectOption[];
    export let team_options: SelectOption[];
    export let selected_team_ids: Set<string>;
    export let selected_sport: Sport | null;
    export let is_loading_organizations: boolean;
    export let is_loading_formats: boolean;
    export let is_loading_teams: boolean;
    export let is_organization_restricted: boolean;
    export let errors: Record<string, string>;
    export let status_options: { value: string; label: string }[];
    export let format_team_requirements: string;
    export let is_team_count_valid: boolean;
    export let is_saving: boolean;
    export let on_cancel: () => void;
    export let on_organization_change: (
        event: CustomEvent<{ value: string }>,
    ) => Promise<void>;
    export let on_format_change: (
        event: CustomEvent<{ value: string }>,
    ) => void;
    export let on_toggle_team: (team_id: string) => boolean;
    export let on_toggle_auto_squad_submission: (enabled: boolean) => void;
    export let on_submit: () => Promise<void>;

    let active_tab: "details" | "rules" = "details";
</script>

<div class="space-y-6">
    <CompetitionCreateHeader {on_cancel} />
    <div
        class="bg-white dark:bg-accent-800 shadow-sm border-y border-accent-200 dark:border-accent-700 -mx-4 sm:mx-0 sm:border sm:rounded-lg"
    >
        <CompetitionCreateTabs bind:active_tab />
        <form
            class="px-4 py-6 space-y-6 sm:px-6"
            on:submit|preventDefault={() => void on_submit()}
        >
            {#if active_tab === "details"}
                <CompetitionCreateDetailsTab
                    bind:form_data
                    {organization_options}
                    {competition_format_options}
                    {team_options}
                    {selected_team_ids}
                    {is_loading_organizations}
                    {is_loading_formats}
                    {is_loading_teams}
                    {is_organization_restricted}
                    {errors}
                    {status_options}
                    {format_team_requirements}
                    {is_team_count_valid}
                    {on_organization_change}
                    {on_format_change}
                    {on_toggle_team}
                    {on_toggle_auto_squad_submission}
                />
            {:else}
                <CompetitionCreateRulesTab
                    organization_id={form_data.organization_id}
                    {selected_sport}
                    bind:rule_overrides={form_data.rule_overrides}
                />
            {/if}
            <CompetitionCreateActions {is_saving} {on_cancel} />
        </form>
    </div>
</div>
