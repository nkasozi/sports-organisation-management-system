<script lang="ts">
    import "temporal-polyfill/global";
    import "@schedule-x/theme-default/dist/index.css";

    import {
        createCalendar,
        viewDay,
        viewList,
        viewMonthGrid,
        viewWeek,
    } from "@schedule-x/calendar";
    import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
    import { createEventModalPlugin } from "@schedule-x/event-modal";
    import { onDestroy } from "svelte";

    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
    import { build_calendar_colors } from "$lib/presentation/logic/calendarPageState";
    import { theme_store } from "$lib/presentation/stores/theme";
    import { THEME_MODE } from "$lib/presentation/stores/themeConstants";

    import {
        build_calendar_category_signature,
        build_calendar_event_signature,
        convert_to_schedule_x_events,
        format_schedule_clock_time,
    } from "./calendarScheduleViewLogic";

    export let calendar_events: CalendarEvent[];
    export let categories: ActivityCategory[];
    export let can_user_add_activities: boolean;
    export let on_event_click: (event_id: string) => void;
    export let on_date_click: (date_string: string) => void;
    export let on_date_time_click: (
        date_string: string,
        time_string: string,
    ) => void;

    let calendar_container_element: HTMLDivElement | undefined = undefined;
    let calendar_instance: ReturnType<typeof createCalendar> | undefined =
        undefined;
    let previous_event_signature: string = "";
    let previous_category_signature: string = "";
    let is_dark_mode: boolean = false;

    function get_current_dark_mode(): boolean {
        return document.documentElement.classList.contains("dark");
    }

    function initialize_calendar(): void {
        if (!calendar_container_element) return;
        calendar_instance = createCalendar({
            views: [viewMonthGrid, viewWeek, viewDay, viewList],
            defaultView: viewMonthGrid.name,
            selectedDate: Temporal.Now.plainDateISO(),
            isDark: get_current_dark_mode(),
            events: convert_to_schedule_x_events(calendar_events),
            calendars: build_calendar_colors(categories) as any,
            plugins: [createDragAndDropPlugin(), createEventModalPlugin()],
            callbacks: {
                onEventClick: (event_data: unknown) =>
                    on_event_click(String((event_data as { id: string }).id)),
                onClickDate: (date_value: Temporal.PlainDate) => {
                    if (!can_user_add_activities) {
                        return;
                    }

                    on_date_click(date_value.toString());
                },
                onClickDateTime: (date_time: Temporal.ZonedDateTime) => {
                    if (!can_user_add_activities) {
                        return;
                    }

                    on_date_time_click(
                        date_time.toPlainDate().toString(),
                        format_schedule_clock_time(date_time),
                    );
                },
            },
        });
        calendar_instance.render(calendar_container_element);
        previous_event_signature =
            build_calendar_event_signature(calendar_events);
        previous_category_signature =
            build_calendar_category_signature(categories);
    }

    function destroy_calendar(): void {
        calendar_instance?.destroy();
        calendar_instance = void 0;
    }

    const unsubscribe_theme = theme_store.subscribe((theme_config) => {
        const next_dark_mode = theme_config.mode === THEME_MODE.DARK;
        if (calendar_instance && is_dark_mode !== next_dark_mode) {
            is_dark_mode = next_dark_mode;
            destroy_calendar();
            initialize_calendar();
            return;
        }
        is_dark_mode = next_dark_mode;
    });

    $: if (calendar_container_element && !calendar_instance)
        initialize_calendar();
    $: if (
        calendar_instance &&
        build_calendar_category_signature(categories) !==
            previous_category_signature
    ) {
        destroy_calendar();
        initialize_calendar();
    }
    $: if (
        calendar_instance &&
        build_calendar_event_signature(calendar_events) !==
            previous_event_signature
    ) {
        previous_event_signature =
            build_calendar_event_signature(calendar_events);
        calendar_instance.events.set(
            convert_to_schedule_x_events(calendar_events),
        );
    }

    onDestroy(() => {
        unsubscribe_theme();
        destroy_calendar();
    });
</script>

<div
    bind:this={calendar_container_element}
    class="min-h-[500px] rounded-lg bg-white dark:bg-gray-900 sm:min-h-[600px] lg:min-h-[700px]"
></div>

<style>
    :global(.sx__calendar-wrapper) {
        --sx-color-surface: var(--color-bg-secondary, #ffffff);
        --sx-color-on-surface: var(--color-text-primary, #1f2937);
        --sx-color-surface-dim: var(--color-bg-tertiary, #f9fafb);
        --sx-color-on-surface-variant: var(--color-text-secondary, #6b7280);
        --sx-color-primary: var(--color-primary-500, #3b82f6);
        --sx-color-on-primary: #ffffff;
        border-radius: 0.5rem;
        overflow: hidden;
    }
    :global(.dark .sx__calendar-wrapper) {
        --sx-color-surface: #1f2937;
        --sx-color-on-surface: #f3f4f6;
        --sx-color-surface-dim: #111827;
        --sx-color-on-surface-variant: #9ca3af;
        --sx-color-primary: #60a5fa;
        --sx-color-on-primary: #ffffff;
    }
    :global(.sx__view-selection-item--is-selected),
    :global(.sx__date-picker__day--selected),
    :global(.sx__range-heading--is-selected) {
        color: white !important;
        background-color: var(--sx-color-primary, #3b82f6) !important;
    }
    :global(.dark .sx__view-selection-item--is-selected),
    :global(.dark .sx__date-picker__day--selected),
    :global(.dark .sx__range-heading--is-selected) {
        color: white !important;
        background-color: #60a5fa !important;
    }
    :global(.sx__month-grid-day__header) {
        font-weight: 500;
    }
    :global(.sx__event) {
        border-radius: 4px;
        font-size: 0.75rem;
    }
</style>
