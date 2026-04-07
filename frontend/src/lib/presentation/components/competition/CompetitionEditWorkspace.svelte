<script lang="ts">
    import type {
        Competition,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
    import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Sport } from "$lib/core/entities/Sport";
    import type { Team } from "$lib/core/entities/Team";

    import CompetitionEditWorkspaceController from "./CompetitionEditWorkspaceController.svelte";

    export let competition_id: string;
    export let competition: Competition;
    export let organizations: Organization[];
    export let competition_formats: CompetitionFormat[];
    export let all_teams: Team[];
    export let competition_team_entries: CompetitionTeam[];
    export let form_data: UpdateCompetitionInput;
    export let selected_format: CompetitionFormat | null;
    export let selected_sport: Sport | null;
    export let is_customizing_scoring: boolean;
    export let can_edit_competition: boolean;
    export let permission_info_message: string;
</script>

<CompetitionEditWorkspaceController
    {competition_id}
    {competition}
    {organizations}
    {competition_formats}
    {all_teams}
    {competition_team_entries}
    bind:form_data
    bind:selected_format
    bind:selected_sport
    bind:is_customizing_scoring
    {can_edit_competition}
    {permission_info_message}
/>
