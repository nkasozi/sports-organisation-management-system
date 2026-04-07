<script lang="ts">
    import type { UpdateCompetitionInput } from "$lib/core/entities/Competition";
    import FormField from "$lib/presentation/components/ui/FormField.svelte";

    import CompetitionCreateAutoSquadSettings from "./CompetitionCreateAutoSquadSettings.svelte";

    export let form_data: UpdateCompetitionInput;
    export let can_edit_competition: boolean;
    export let is_saving: boolean;
    export let on_cancel: () => void;
    export let on_submit: () => Promise<void>;
    export let on_toggle_auto_squad_submission: (enabled: boolean) => void;
</script>

<form class="space-y-6" on:submit|preventDefault={() => void on_submit()}>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <FormField
            label="Entry Fee ($)"
            name="entry_fee"
            type="number"
            bind:value={form_data.entry_fee}
            min={0}
        />
        <FormField
            label="Prize Pool ($)"
            name="prize_pool"
            type="number"
            bind:value={form_data.prize_pool}
            min={0}
        />
    </div>

    <CompetitionCreateAutoSquadSettings
        bind:form_data
        {on_toggle_auto_squad_submission}
    />

    <div class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
            type="button"
            class="btn btn-outline w-full sm:w-auto"
            disabled={is_saving}
            on:click={on_cancel}>Cancel</button
        >
        {#if can_edit_competition}
            <button
                type="submit"
                class="btn btn-primary-action w-full sm:w-auto"
                disabled={is_saving}
            >
                {#if is_saving}
                    <span class="flex items-center justify-center"
                        ><span
                            class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"
                        ></span>Saving...</span
                    >
                {:else}
                    Save Settings
                {/if}
            </button>
        {/if}
    </div>
</form>
