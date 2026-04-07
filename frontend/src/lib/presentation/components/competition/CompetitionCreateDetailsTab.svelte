<script lang="ts">
    import type { CreateCompetitionInput } from "$lib/core/entities/Competition";
    import EnumSelectField from "$lib/presentation/components/ui/EnumSelectField.svelte";
    import FormField from "$lib/presentation/components/ui/FormField.svelte";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
    import SelectField from "$lib/presentation/components/ui/SelectField.svelte";

    import CompetitionCreateAutoSquadSettings from "./CompetitionCreateAutoSquadSettings.svelte";
    import CompetitionCreateTeamSelection from "./CompetitionCreateTeamSelection.svelte";

    export let form_data: CreateCompetitionInput;
    export let organization_options: SelectOption[];
    export let competition_format_options: SelectOption[];
    export let team_options: SelectOption[];
    export let selected_team_ids: Set<string>;
    export let is_loading_organizations: boolean;
    export let is_loading_formats: boolean;
    export let is_loading_teams: boolean;
    export let is_organization_restricted: boolean;
    export let errors: Record<string, string>;
    export let status_options: { value: string; label: string }[];
    export let format_team_requirements: string;
    export let is_team_count_valid: boolean;
    export let on_organization_change: (
        event: CustomEvent<{ value: string }>,
    ) => Promise<void>;
    export let on_format_change: (
        event: CustomEvent<{ value: string }>,
    ) => void;
    export let on_toggle_team: (team_id: string) => boolean;
    export let on_toggle_auto_squad_submission: (enabled: boolean) => void;
</script>

<div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="md:col-span-2">
            <FormField
                label="Competition Name"
                name="name"
                bind:value={form_data.name}
                placeholder="Enter competition name"
                required={true}
                error={errors.name || ""}
            />
        </div>

        <SelectField
            label="Organization"
            name="organization_id"
            value={form_data.organization_id}
            options={organization_options}
            placeholder="Select an organization..."
            required={true}
            is_loading={is_loading_organizations}
            error={errors.organization_id || ""}
            disabled={is_organization_restricted ||
                organization_options.length === 0}
            on:change={on_organization_change}
        />

        {#if !is_loading_organizations && organization_options.length === 0}
            <div
                class="md:col-span-2 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900"
            >
                <svg
                    class="h-5 w-5 flex-shrink-0 text-yellow-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    ><path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.336-.213 3.005-1.742 3.005H3.48c-1.53 0-2.492-1.669-1.743-3.005L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    /></svg
                >
                <div>
                    <p class="text-sm font-medium">No organizations found.</p>
                    <p class="text-sm text-yellow-800">
                        Create an organization to continue creating a
                        competition.
                    </p>
                </div>
            </div>
        {/if}

        <SelectField
            label="Competition Format"
            name="competition_format_id"
            value={form_data.competition_format_id}
            options={competition_format_options}
            placeholder="Select a format..."
            required={true}
            is_loading={is_loading_formats}
            error={errors.competition_format_id || ""}
            disabled={competition_format_options.length === 0}
            on:change={on_format_change}
        />

        {#if !is_loading_formats && competition_format_options.length === 0}
            <div
                class="md:col-span-2 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900"
            >
                <svg
                    class="h-5 w-5 flex-shrink-0 text-yellow-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    ><path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.336-.213 3.005-1.742 3.005H3.48c-1.53 0-2.492-1.669-1.743-3.005L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    /></svg
                >
                <div>
                    <p class="text-sm font-medium">
                        No competition formats available.
                    </p>
                    <p class="text-sm text-yellow-800">
                        Activate or create a competition format to proceed.
                    </p>
                </div>
            </div>
        {/if}

        <EnumSelectField
            label="Status"
            name="status"
            bind:value={form_data.status}
            options={status_options}
        />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
            label="Start Date"
            name="start_date"
            type="date"
            bind:value={form_data.start_date}
            required={true}
        />
        <FormField
            label="End Date"
            name="end_date"
            type="date"
            bind:value={form_data.end_date}
            required={true}
        />
        <FormField
            label="Registration Deadline"
            name="registration_deadline"
            type="date"
            bind:value={form_data.registration_deadline}
        />
        <FormField
            label="Max Teams"
            name="max_teams"
            type="number"
            bind:value={form_data.max_teams}
            min={2}
            required={true}
        />
    </div>

    <CompetitionCreateTeamSelection
        organization_id={form_data.organization_id}
        {is_loading_teams}
        {team_options}
        {selected_team_ids}
        {format_team_requirements}
        {is_team_count_valid}
        {on_toggle_team}
    />
    <CompetitionCreateAutoSquadSettings
        bind:form_data
        {on_toggle_auto_squad_submission}
    />
</div>
