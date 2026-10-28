<script lang="ts">
    import type {
        CreateCompetitionInput,
        UpdateCompetitionInput,
    } from "$lib/core/entities/Competition";
    import {
        MAXIMUM_MAX_EVENT_EDITS_PER_GAME,
        MINIMUM_MAX_EVENT_EDITS_PER_GAME,
    } from "$lib/core/entities/CompetitionConstants";
    import {
        build_max_event_edits_hint,
        COMPETITION_EVENT_EDIT_SETTINGS_TEXT,
    } from "$lib/presentation/logic/competitionEventEditSettings";

    export let form_data: CreateCompetitionInput | UpdateCompetitionInput;

    $: event_edits_hint = build_max_event_edits_hint(
        form_data.max_event_edits_per_game,
    );
</script>

<div class="border-t border-accent-200 dark:border-accent-700 pt-6 space-y-2">
    <label
        class="block text-sm font-medium text-accent-900 dark:text-accent-100"
        for="max_event_edits_per_game"
    >
        {COMPETITION_EVENT_EDIT_SETTINGS_TEXT.label}
    </label>
    <p
        id="max_event_edits_per_game_help"
        class="text-xs text-accent-500 dark:text-accent-400"
    >
        {COMPETITION_EVENT_EDIT_SETTINGS_TEXT.help}
    </p>
    <input
        id="max_event_edits_per_game"
        name="max_event_edits_per_game"
        type="number"
        step={1}
        bind:value={form_data.max_event_edits_per_game}
        min={MINIMUM_MAX_EVENT_EDITS_PER_GAME}
        max={MAXIMUM_MAX_EVENT_EDITS_PER_GAME}
        aria-describedby="max_event_edits_per_game_help max_event_edits_per_game_hint"
        class="block w-full sm:w-32 px-3 py-2 border border-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
    />
    <p
        id="max_event_edits_per_game_hint"
        class="text-xs text-accent-500 dark:text-accent-400"
        aria-live="polite"
    >
        {event_edits_hint}
    </p>
</div>
