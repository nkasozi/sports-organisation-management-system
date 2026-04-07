<script lang="ts">
    import type { CreateCompetitionInput } from "$lib/core/entities/Competition";
    import type { Sport } from "$lib/core/entities/Sport";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";

    import CompetitionCreateEditor from "./CompetitionCreateEditor.svelte";

    export let competition_format_options: SelectOption[];
    export let error_message: string;
    export let errors: Record<string, string>;
    export let format_team_requirements: string;
    export let form_data: CreateCompetitionInput;
    export let is_loading_formats: boolean;
    export let is_loading_organizations: boolean;
    export let is_loading_teams: boolean;
    export let is_organization_restricted: boolean;
    export let is_saving: boolean;
    export let is_team_count_valid: boolean;
    export let organization_options: SelectOption[];
    export let selected_sport: Sport | null;
    export let selected_team_ids: Set<string>;
    export let status_options: SelectOption[];
    export let team_options: SelectOption[];
    export let toast_message: string;
    export let toast_type: "success" | "error" | "info";
    export let toast_visible: boolean;
    export let on_cancel: () => void;
    export let on_format_change: (
        event: CustomEvent<{ value: string }>,
    ) => void;
    export let on_organization_change: (
        event: CustomEvent<{ value: string }>,
    ) => Promise<void>;
    export let on_submit: () => Promise<void>;
    export let on_toggle_auto_squad_submission: (enabled: boolean) => void;
    export let on_toggle_team: (team_id: string) => boolean;
</script>

<div class="max-w-2xl mx-auto space-y-6">
    {#if error_message}
        <div
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
            <p class="text-red-600 dark:text-red-400">{error_message}</p>
        </div>
    {/if}
    <CompetitionCreateEditor
        bind:form_data
        {organization_options}
        {competition_format_options}
        {team_options}
        {selected_team_ids}
        {selected_sport}
        {is_loading_organizations}
        {is_loading_formats}
        {is_loading_teams}
        {is_organization_restricted}
        {errors}
        {status_options}
        {format_team_requirements}
        {is_team_count_valid}
        {is_saving}
        {on_cancel}
        {on_organization_change}
        {on_format_change}
        {on_toggle_team}
        {on_toggle_auto_squad_submission}
        {on_submit}
    />
</div>

<Toast
    message={toast_message}
    type={toast_type}
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
