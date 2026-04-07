<script lang="ts">
    import SelectField from "$lib/presentation/components/ui/SelectField.svelte";

    export let selected_organization_id: string;
    export let organization_select_options: Array<{
        value: string;
        label: string;
    }>;
    export let loading: boolean;
    export let saving: boolean;
    export let organization_is_restricted: boolean;
    export let validation_error: string;
    export let organizations_count: number;
    export let on_change: (organization_id: string) => void;
</script>

<div>
    <SelectField
        label="Organization"
        name="organization"
        value={selected_organization_id}
        options={organization_select_options}
        placeholder={loading
            ? "Loading organizations..."
            : "Select organization..."}
        required={true}
        disabled={loading || saving || organization_is_restricted}
        is_loading={loading}
        error={validation_error}
        on:change={(event) => on_change(event.detail.value)}
    />
</div>
{#if organizations_count === 0 && !loading}<div
        class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg whitespace-pre-line text-red-700 dark:text-red-300"
    >
        No organizations available. Please contact an administrator.
    </div>{/if}
