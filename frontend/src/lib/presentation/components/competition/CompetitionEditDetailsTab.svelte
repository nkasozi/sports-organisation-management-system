<script lang="ts">
    import type {
        Competition,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import FormField from "$lib/presentation/components/ui/FormField.svelte";
    import type { SelectOption } from "$lib/presentation/components/ui/SelectField.svelte";
    import SelectField from "$lib/presentation/components/ui/SelectField.svelte";

    import CompetitionCreateActions from "./CompetitionCreateActions.svelte";

    export let competition: Competition;
    export let form_data: UpdateCompetitionInput;
    export let organization_options: SelectOption[];
    export let competition_format_options: SelectOption[];
    export let can_edit_competition: boolean;
    export let is_saving: boolean;
    export let on_cancel: () => void;
    export let on_submit: () => Promise<void>;
    export let on_organization_change: (
        event: CustomEvent<{ value: string }>,
    ) => Promise<void>;
    export let on_format_change: (
        event: CustomEvent<{ value: string }>,
    ) => void;
</script>

<form class="space-y-6" on:submit|preventDefault={() => void on_submit()}>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="md:col-span-2">
            <FormField
                label="Competition Name"
                name="name"
                bind:value={form_data.name}
                placeholder="Enter competition name"
                required={true}
            />
        </div>
        <SelectField
            label="Organization"
            name="organization_id"
            value={form_data.organization_id ?? ""}
            options={organization_options}
            placeholder="Select an organization..."
            required={true}
            disabled={organization_options.length === 0}
            on:change={on_organization_change}
        />
        {#if organization_options.length === 0}
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
                        Create an organization to manage competitions.
                    </p>
                </div>
            </div>
        {/if}
        <SelectField
            label="Competition Format"
            name="competition_format_id"
            value={form_data.competition_format_id ?? ""}
            options={competition_format_options}
            placeholder="Select a format..."
            required={true}
            disabled={!!(
                competition.competition_format_id &&
                competition.competition_format_id.trim() &&
                competition_format_options.some(
                    (option: SelectOption) =>
                        option.value === competition.competition_format_id,
                )
            )}
            on:change={on_format_change}
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
        <div class="md:col-span-2">
            <FormField
                label="Location"
                name="location"
                bind:value={form_data.location}
                placeholder="Enter the competition location"
            />
        </div>
        <div class="md:col-span-2">
            <FormField
                label="Description"
                name="description"
                type="textarea"
                bind:value={form_data.description}
                placeholder="Enter a description of the competition"
                rows={3}
            />
        </div>
    </div>

    {#if can_edit_competition}
        <div class="mt-8">
            <CompetitionCreateActions
                {is_saving}
                submit_label="Save Changes"
                {on_cancel}
            />
        </div>
    {/if}
</form>
