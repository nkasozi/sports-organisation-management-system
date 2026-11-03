<script lang="ts">
    import {
        CALENDAR_FEED_TYPE,
        type CalendarFeedType,
    } from "$lib/core/entities/CalendarToken";
    import {
        build_named_record_options_with_blank,
        build_numeric_select_options,
        parse_numeric_select_value,
    } from "$lib/presentation/components/ui/searchable_select_options";
    import SearchableSelectField from "$lib/presentation/components/ui/SearchableSelectField.svelte";

    const FEED_TYPE_OPTIONS = [
        { value: CALENDAR_FEED_TYPE.ALL, label: "All Events" },
        { value: CALENDAR_FEED_TYPE.TEAM, label: "Team Schedule" },
        {
            value: CALENDAR_FEED_TYPE.COMPETITION,
            label: "Competition Schedule",
        },
    ];

    export let show_create_form: boolean = false;
    export let selected_feed_type: CalendarFeedType = CALENDAR_FEED_TYPE.ALL;
    export let selected_entity_id: string = "";
    export let reminder_minutes: number = 60;
    export let reminder_options: Array<{ value: number; label: string }> = [];
    export let is_creating: boolean = false;
    export let get_entity_options: () => Array<{
        id: string;
        name: string;
    }> = () => [];
    export let on_show_form: () => void = () => {};
    export let on_hide_form: () => void = () => {};
    export let on_feed_type_change: () => void = () => {};
    export let on_create: () => void = () => {};

    $: entity_options = build_named_record_options_with_blank(
        "-- Select --",
        get_entity_options(),
    );
    $: reminder_select_options = build_numeric_select_options(reminder_options);

    function is_feed_type(value: string): value is CalendarFeedType {
        return (Object.values(CALENDAR_FEED_TYPE) as string[]).includes(value);
    }

    function choose_feed_type(selected_value: string): boolean {
        if (!is_feed_type(selected_value)) return false;
        selected_feed_type = selected_value;
        on_feed_type_change();
        return true;
    }

    function choose_reminder(selected_value: string): boolean {
        reminder_minutes = parse_numeric_select_value(selected_value);
        return true;
    }
</script>

<div class="create-section mt-6">
    {#if !show_create_form}
        <button
            type="button"
            class="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-accent-300 dark:border-accent-600 rounded-[0.175rem] text-accent-600 dark:text-accent-400 hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-colors"
            on:click={on_show_form}
        >
            <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                /></svg
            >
            Create New Subscription
        </button>
    {:else}
        <div class="create-form p-4 bg-accent-50 dark:bg-accent-800 rounded-lg">
            <h4 class="font-medium text-accent-900 dark:text-accent-100 mb-4">
                New Calendar Subscription
            </h4>

            <div class="form-fields space-y-4">
                <div>
                    <label
                        for="searchable-select-feed-type-select"
                        class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                        >Feed Type</label
                    >
                    <SearchableSelectField
                        name="feed-type-select"
                        value={selected_feed_type}
                        options={FEED_TYPE_OPTIONS}
                        on:change={(event) =>
                            choose_feed_type(event.detail.value)}
                    />
                </div>

                {#if selected_feed_type !== CALENDAR_FEED_TYPE.ALL}
                    <div>
                        <label
                            for="searchable-select-entity-select"
                            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                            >{selected_feed_type === CALENDAR_FEED_TYPE.TEAM
                                ? "Select Team"
                                : "Select Competition"}</label
                        >
                        <SearchableSelectField
                            name="entity-select"
                            bind:value={selected_entity_id}
                            options={entity_options}
                            placeholder="-- Select --"
                        />
                    </div>
                {/if}

                <div>
                    <label
                        for="searchable-select-reminder-select"
                        class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                        >Default Reminder</label
                    >
                    <SearchableSelectField
                        name="reminder-select"
                        value={String(reminder_minutes)}
                        options={reminder_select_options}
                        on:change={(event) =>
                            choose_reminder(event.detail.value)}
                    />
                    <p
                        class="text-xs text-accent-500 dark:text-accent-400 mt-1"
                    >
                        Your calendar app will show notifications before each
                        event
                    </p>
                </div>
            </div>

            <div class="form-actions mt-6 flex gap-3">
                <button
                    type="button"
                    class="flex-1 px-4 py-2 bg-accent-200 hover:bg-accent-300 dark:bg-accent-600 dark:hover:bg-accent-500 text-accent-700 dark:text-accent-200 rounded-[0.175rem] transition-colors"
                    on:click={on_hide_form}>Cancel</button
                >
                <button
                    type="button"
                    class="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-[0.175rem] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={is_creating ||
                        (selected_feed_type !== CALENDAR_FEED_TYPE.ALL &&
                            !selected_entity_id)}
                    on:click={on_create}
                >
                    {#if is_creating}Creating...{:else}Create Subscription{/if}
                </button>
            </div>
        </div>
    {/if}
</div>
