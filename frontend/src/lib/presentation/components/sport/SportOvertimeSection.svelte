<script lang="ts">
    import type { CreateSportInput } from "$lib/core/entities/Sport";
    import {
        SPORT_OVERTIME_TRIGGER_OPTIONS,
        SPORT_OVERTIME_TYPE_OPTIONS,
    } from "$lib/presentation/logic/sportFormEditorState";

    export let form_data: CreateSportInput;
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
                        for="sport-overtime-trigger"
                        class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                        >Trigger Condition</label
                    >
                    <select
                        id="sport-overtime-trigger"
                        class="input w-full"
                        bind:value={form_data.overtime_rules.trigger_condition}
                    >
                        {#each SPORT_OVERTIME_TRIGGER_OPTIONS as current_option}
                            <option value={current_option.value}
                                >{current_option.label}</option
                            >
                        {/each}
                    </select>
                </div>

                <div>
                    <label
                        for="sport-overtime-type"
                        class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                        >Overtime Type</label
                    >
                    <select
                        id="sport-overtime-type"
                        class="input w-full"
                        bind:value={form_data.overtime_rules.overtime_type}
                    >
                        {#each SPORT_OVERTIME_TYPE_OPTIONS as current_option}
                            <option value={current_option.value}
                                >{current_option.label}</option
                            >
                        {/each}
                    </select>
                </div>
            </div>

            {#if form_data.overtime_rules.overtime_type === "penalties" || form_data.overtime_rules.overtime_type === "shootout"}
                {#if form_data.overtime_rules.penalties_config}
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
                                        form_data.overtime_rules
                                            .penalties_config.initial_rounds
                                    }
                                    min="1"
                                />
                            </div>
                            <label class="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    bind:checked={
                                        form_data.overtime_rules
                                            .penalties_config.sudden_death_after
                                    }
                                    class="rounded"
                                />
                                <span
                                    class="text-accent-700 dark:text-accent-300"
                                    >Sudden death after initial rounds</span
                                >
                            </label>
                        </div>
                    </div>
                {/if}
            {/if}
        {/if}
    </div>
</div>
