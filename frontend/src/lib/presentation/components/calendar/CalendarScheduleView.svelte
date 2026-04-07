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

    export let calendar_events: CalendarEvent[];
    export let categories: ActivityCategory[];
    export let on_event_click: (event_id: string) => void;
    export let on_date_click: (date_string: string) => void;
    export let on_date_time_click: (
        date_string: string,
        time_string: string,
    ) => void;

    let calendar_container_element: HTMLDivElement | null = null;
    let calendar_instance: ReturnType<typeof createCalendar> | null = null;
    let previous_event_signature: string = "";
    let previous_category_signature: string = "";
    let is_dark_mode: boolean = false;

    function get_current_dark_mode(): boolean {
        return document.documentElement.classList.contains("dark");
    }

    function convert_iso_to_zoned_datetime(
        iso_string: string,
    ): Temporal.ZonedDateTime {
        const date = new Date(iso_string);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        const offset_minutes = -date.getTimezoneOffset();
        const offset_hours = Math.floor(Math.abs(offset_minutes) / 60);
        const offset_mins = Math.abs(offset_minutes) % 60;
        const offset_sign = offset_minutes >= 0 ? "+" : "-";
        return Temporal.ZonedDateTime.from(
            `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset_sign}${String(offset_hours).padStart(2, "0")}:${String(offset_mins).padStart(2, "0")}[${timezone}]`,
        );
    }

    function convert_iso_to_plain_date(iso_string: string): Temporal.PlainDate {
        return Temporal.PlainDate.from(iso_string.split("T")[0]);
    }

    function convert_to_schedule_x_events(
        events: CalendarEvent[],
    ): Array<{
        id: string;
        title: string;
        start: Temporal.ZonedDateTime | Temporal.PlainDate;
        end: Temporal.ZonedDateTime | Temporal.PlainDate;
        description?: string;
        calendarId?: string;
    }> {
        return events.map((event) => ({
            id: event.id,
            title: event.title,
            start: event.all_day
                ? convert_iso_to_plain_date(event.start)
                : convert_iso_to_zoned_datetime(event.start),
            end: event.all_day
                ? convert_iso_to_plain_date(event.end)
                : convert_iso_to_zoned_datetime(event.end),
            description: `${event.category_name} - ${event.activity.description || ""}`,
            calendarId: event.category_type,
        }));
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
                onClickDate: (date_value: Temporal.PlainDate) =>
                    on_date_click(date_value.toString()),
                onClickDateTime: (date_time: Temporal.ZonedDateTime) =>
                    on_date_time_click(
                        date_time.toPlainDate().toString(),
                        `${String(date_time.hour).padStart(2, "0")}:${String(date_time.minute).padStart(2, "0")}`,
                    ),
            },
        });
        calendar_instance.render(calendar_container_element);
        previous_event_signature = get_event_signature();
        previous_category_signature = get_category_signature();
    }

    function destroy_calendar(): void {
        calendar_instance?.destroy();
        calendar_instance = null;
    }

    function get_event_signature(): string {
        return calendar_events
            .map(
                (event) =>
                    `${event.id}:${event.start}:${event.end}:${event.category_type}`,
            )
            .join("|");
    }

    function get_category_signature(): string {
        return categories
            .map(
                (category) =>
                    `${category.id}:${category.color}:${category.category_type}`,
            )
            .join("|");
    }

    theme_store.subscribe((theme_config) => {
        const next_dark_mode = theme_config.mode === "dark";
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
        get_category_signature() !== previous_category_signature
    ) {
        destroy_calendar();
        initialize_calendar();
    }
    $: if (
        calendar_instance &&
        get_event_signature() !== previous_event_signature
    ) {
        previous_event_signature = get_event_signature();
        calendar_instance.events.set(
            convert_to_schedule_x_events(calendar_events),
        );
    }

    onDestroy(destroy_calendar);
</script>

<div
    bind:this={calendar_container_element}
    class="min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] bg-white dark:bg-gray-900 rounded-lg"
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
