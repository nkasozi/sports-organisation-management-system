<script lang="ts">
    import type { Competition } from "$lib/core/entities/Competition";
    import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
    import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
    import type { Fixture } from "$lib/core/entities/Fixture";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";

    import CompetitionResultsWorkspaceController from "./CompetitionResultsWorkspaceController.svelte";

    export let organizations: Organization[];
    export let selected_organization_id: string;
    export let competitions: Competition[];
    export let selected_competition_id: string;
    export let selected_competition: Competition | null;
    export let competition_format: CompetitionFormat | null;
    export let competition_stages: CompetitionStage[];
    export let fixtures: Fixture[];
    export let teams: Team[];
    export let team_map: Map<string, Team>;
    export let fixtures_loading: boolean;
    export let can_change_organizations: boolean;
    export let on_organization_change: () => Promise<void>;
    export let on_competition_change: () => void;
</script>

<CompetitionResultsWorkspaceController
    {organizations}
    bind:selected_organization_id
    {competitions}
    bind:selected_competition_id
    {selected_competition}
    {competition_format}
    {competition_stages}
    {fixtures}
    {teams}
    {team_map}
    {fixtures_loading}
    {can_change_organizations}
    {on_organization_change}
    {on_competition_change}
/>
