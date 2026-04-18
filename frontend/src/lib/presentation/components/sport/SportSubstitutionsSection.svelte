<script lang="ts">
    import type { CreateSportInput } from "$lib/core/entities/Sport";
    import FormField from "$lib/presentation/components/ui/FormField.svelte";

    export let form_data: CreateSportInput;
</script>

<div class="space-y-6">
    <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100">
        Substitution Rules
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
            label="Max Substitutions Per Game"
            name="max_substitutions_per_game"
            type="number"
            bind:value={form_data.substitution_rules.max_substitutions_per_game}
        />
        <FormField
            label="Max Substitution Windows"
            name="max_substitution_windows"
            type="number"
            bind:value={form_data.substitution_rules.max_substitution_windows}
            placeholder="Use -1 for unlimited windows"
        />
        <label class="flex items-center gap-3">
            <input
                type="checkbox"
                bind:checked={
                    form_data.substitution_rules.rolling_substitutions_allowed
                }
                class="rounded"
            />
            <span class="text-accent-700 dark:text-accent-300"
                >Rolling substitutions allowed</span
            >
        </label>
        <label class="flex items-center gap-3">
            <input
                type="checkbox"
                bind:checked={
                    form_data.substitution_rules
                        .return_after_substitution_allowed
                }
                class="rounded"
            />
            <span class="text-accent-700 dark:text-accent-300"
                >Return after substitution allowed</span
            >
        </label>
    </div>
</div>
