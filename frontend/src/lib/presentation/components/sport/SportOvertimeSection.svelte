<script lang="ts">
    import type {
        CreateSportInput,
        OvertimeRule,
    } from "$lib/core/entities/Sport";
    import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";
    import {
        SPORT_OVERTIME_TRIGGER_OPTIONS,
        SPORT_OVERTIME_TYPE_OPTIONS,
    } from "$lib/presentation/logic/sportFormEditorState";

    import { is_penalty_based_overtime } from "./sportFormSectionConstants";

    export let form_data: CreateSportInput;

    function choose_trigger_condition(selected_value: string): boolean {
        form_data.overtime_rules.trigger_condition =
            selected_value as OvertimeRule["trigger_condition"];
        return true;
    }

    function choose_overtime_type(selected_value: string): boolean {
        form_data.overtime_rules.overtime_type =
            selected_value as OvertimeRule["overtime_type"];
        return true;
    }
</script>

<div class="space-y-6">
    <h3 class="text-lg font-medium text-accent-900 dark:text-accent-100">
        Overtime Rules
    </h3>
    <div class="space-y-4">
        <label class="flex items-center gap-3">
            <input
                type="checkbox"
                bind:checked={form_data.overtime_rules.is_enabled}
                class="rounded"
            />
            <span class="text-accent-700 dark:text-accent-300"
                >Overtime enabled</span
            >
        </label>

        {#if form_data.overtime_rules.is_enabled}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label
                        for="searchable-select-sport-overtime-trigger"
                        class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                        >Trigger Condition</label
                    >
                    <SearchableSelectField
                        name="sport-overtime-trigger"
                        value={form_data.overtime_rules.trigger_condition}
                        options={SPORT_OVERTIME_TRIGGER_OPTIONS}
                        on:change={(event) =>
                            choose_trigger_condition(event.detail.value)}
                    />
                </div>

                <div>
                    <label
                        for="searchable-select-sport-overtime-type"
                        class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                        >Overtime Type</label
                    >
                    <SearchableSelectField
                        name="sport-overtime-type"
                        value={form_data.overtime_rules.overtime_type}
                        options={SPORT_OVERTIME_TYPE_OPTIONS}
                        on:change={(event) =>
                            choose_overtime_type(event.detail.value)}
                    />
                </div>
            </div>

            {#if is_penalty_based_overtime(form_data.overtime_rules.overtime_type)}
                <div
                    class="p-4 bg-accent-50 dark:bg-accent-700/50 rounded-lg space-y-4"
                >
                    <h4
                        class="text-sm font-medium text-accent-900 dark:text-accent-100"
                    >
                        Penalties Configuration
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                for="sport-initial-rounds"
                                class="block text-sm text-accent-600 dark:text-accent-400 mb-1"
                                >Initial Rounds</label
                            >
                            <input
                                id="sport-initial-rounds"
                                type="number"
                                class="input w-full"
                                bind:value={
                                    form_data.overtime_rules.penalties_config
                                        .initial_rounds
                                }
                                min="1"
                            />
                        </div>
                        <label class="flex items-center gap-3">
                            <input
                                type="checkbox"
                                bind:checked={
                                    form_data.overtime_rules.penalties_config
                                        .sudden_death_after
                                }
                                class="rounded"
                            />
                            <span class="text-accent-700 dark:text-accent-300"
                                >Sudden death after initial rounds</span
                            >
                        </label>
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>
