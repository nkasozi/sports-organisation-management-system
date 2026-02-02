<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import "temporal-polyfill/global";
  import {
    createCalendar,
    viewMonthGrid,
    viewWeek,
    viewDay,
    viewList,
  } from "@schedule-x/calendar";
  import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
  import { createEventModalPlugin } from "@schedule-x/event-modal";
  import "@schedule-x/theme-default/dist/index.css";

  import LoadingStateWrapper from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
  import Toast from "$lib/presentation/components/ui/Toast.svelte";
  import CalendarSubscriptionManager from "$lib/presentation/components/calendar/CalendarSubscriptionManager.svelte";
  import { get_use_cases_container } from "$lib/infrastructure/container";
  import { theme_store } from "$lib/presentation/stores/theme";
  import type { Organization } from "$lib/core/entities/Organization";
  import type { Team } from "$lib/core/entities/Team";
  import type { Competition } from "$lib/core/entities/Competition";
  import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
  import type {
    Activity,
    CreateActivityInput,
  } from "$lib/core/entities/Activity";
  import type { CalendarEvent } from "$lib/core/interfaces/ports/ActivityUseCasesPort";
  import { DEFAULT_REMINDERS } from "$lib/core/entities/Activity";
  import {
    is_google_calendar_configured,
    initialize_google_calendar,
    sign_in_to_google_calendar,
    sign_out_of_google_calendar,
    is_signed_in_to_google,
    sync_activity_to_google_calendar,
    type GoogleCalendarAuthStatus,
  } from "$lib/adapters/services/GoogleCalendarService";

  type LoadingState = "idle" | "loading" | "success" | "error";

  let loading_state: LoadingState = $state("idle");
  let error_message: string = $state("");
  let organizations: Organization[] = $state([]);
  let selected_organization_id: string = $state("");
  let teams: Team[] = $state([]);
  let competitions: Competition[] = $state([]);
  let categories: ActivityCategory[] = $state([]);
  let calendar_events: CalendarEvent[] = $state([]);

  let filter_category_id: string = $state("");
  let filter_competition_id: string = $state("");
  let filter_team_id: string = $state("");
  let filter_loading: boolean = $state(false);

  let show_create_modal: boolean = $state(false);
  let show_category_modal: boolean = $state(false);
  let show_subscribe_modal: boolean = $state(false);
  let editing_activity: Activity | null = $state(null);

  let new_activity_title: string = $state("");
  let new_activity_description: string = $state("");
  let new_activity_category_id: string = $state("");
  let new_activity_start_date: string = $state("");
  let new_activity_start_time: string = $state("");
  let new_activity_end_date: string = $state("");
  let new_activity_end_time: string = $state("");
  let new_activity_is_all_day: boolean = $state(false);
  let new_activity_location: string = $state("");
  let new_activity_google_sync: boolean = $state(false);

  let new_category_name: string = $state("");
  let new_category_color: string = $state("#3B82F6");
  let new_category_type: string = $state("custom");

  let google_calendar_configured: boolean = $state(false);
  let google_auth_status: GoogleCalendarAuthStatus = $state({
    is_signed_in: false,
  });

  let calendar_container_element: HTMLDivElement | null = $state(null);
  let calendar_instance: ReturnType<typeof createCalendar> | null = null;
  let calendar_needs_init: boolean = $state(false);
  let is_dark_mode: boolean = $state(false);
  let theme_initialized: boolean = $state(false);

  let modal_position = $state({ x: 0, y: 0 });
  let is_dragging = $state(false);
  let drag_offset = { x: 0, y: 0 };

  let show_event_details_modal: boolean = $state(false);
  let selected_event_details: CalendarEvent | null = $state(null);

  let toast_visible: boolean = $state(false);
  let toast_message: string = $state("");
  let toast_type: "success" | "error" | "warning" | "info" = $state("info");

  function show_toast(
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }

  function get_current_dark_mode(): boolean {
    if (!browser) return false;
    return document.documentElement.classList.contains("dark");
  }

  theme_store.subscribe((config) => {
    const new_dark_mode = config.mode === "dark";
    const dark_mode_changed = is_dark_mode !== new_dark_mode;
    is_dark_mode = new_dark_mode;

    if (
      theme_initialized &&
      dark_mode_changed &&
      calendar_instance &&
      browser
    ) {
      reinitialize_calendar_for_theme();
    }
    theme_initialized = true;
  });

  const use_cases = get_use_cases_container();

  function get_current_year_date_range(): {
    start_date: string;
    end_date: string;
  } {
    const now = new Date();
    const year = now.getFullYear();
    return {
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
    };
  }

  async function load_organizations(): Promise<Organization[]> {
    const result = await use_cases.organization_use_cases.list();
    if (!result.success) {
      throw new Error(result.error_message || "Failed to load organizations");
    }
    return result.data;
  }

  async function load_teams_for_organization(
    organization_id: string,
  ): Promise<Team[]> {
    const result = await use_cases.team_use_cases.list({ organization_id });
    if (!result.success) {
      return [];
    }
    return result.data;
  }

  async function load_competitions_for_organization(
    organization_id: string,
  ): Promise<Competition[]> {
    const result = await use_cases.competition_use_cases.list({
      organization_id,
    });
    if (!result.success) {
      return [];
    }
    return result.data;
  }

  async function load_categories_for_organization(
    organization_id: string,
  ): Promise<ActivityCategory[]> {
    await use_cases.activity_category_use_cases.ensure_default_categories_exist(
      organization_id,
    );
    const result =
      await use_cases.activity_category_use_cases.list_by_organization(
        organization_id,
      );
    if (!result.success) {
      return [];
    }
    return result.data?.items || [];
  }

  async function sync_and_load_calendar_events(
    organization_id: string,
  ): Promise<CalendarEvent[]> {
    console.log("[Calendar] Starting sync for organization:", organization_id);

    const comp_sync_result =
      await use_cases.activity_use_cases.sync_competitions_to_activities(
        organization_id,
      );
    console.log("[Calendar] Competition sync result:", comp_sync_result);

    const fixture_sync_result =
      await use_cases.activity_use_cases.sync_fixtures_to_activities(
        organization_id,
      );
    console.log("[Calendar] Fixture sync result:", fixture_sync_result);

    const date_range = get_current_year_date_range();
    const filter: Record<string, string | undefined> = {};

    if (filter_category_id) {
      filter.category_id = filter_category_id;
    }
    if (filter_competition_id) {
      filter.competition_id = filter_competition_id;
    }
    if (filter_team_id) {
      filter.team_id = filter_team_id;
    }

    console.log(
      "[Calendar] Fetching events with filter:",
      filter,
      "date_range:",
      date_range,
    );

    const result = await use_cases.activity_use_cases.get_calendar_events(
      organization_id,
      date_range,
      filter,
    );

    console.log(
      "[Calendar] Calendar events result:",
      result.success,
      "count:",
      result.data?.length,
    );

    if (!result.success) {
      return [];
    }

    return result.data || [];
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
    const offset_string = `${offset_sign}${String(offset_hours).padStart(2, "0")}:${String(offset_mins).padStart(2, "0")}`;

    const temporal_string = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset_string}[${timezone}]`;
    return Temporal.ZonedDateTime.from(temporal_string);
  }

  function convert_iso_to_plain_date(iso_string: string): Temporal.PlainDate {
    const date_part = iso_string.split("T")[0];
    return Temporal.PlainDate.from(date_part);
  }

  function convert_to_schedule_x_events(events: CalendarEvent[]): Array<{
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

  function build_calendar_colors(): Record<
    string,
    {
      colorName: string;
      lightColors: { main: string; container: string; onContainer: string };
      darkColors: { main: string; container: string; onContainer: string };
    }
  > {
    const colors: Record<
      string,
      {
        colorName: string;
        lightColors: { main: string; container: string; onContainer: string };
        darkColors: { main: string; container: string; onContainer: string };
      }
    > = {};

    for (const category of categories) {
      colors[category.category_type] = {
        colorName: category.name,
        lightColors: {
          main: category.color,
          container: `${category.color}20`,
          onContainer: category.color,
        },
        darkColors: {
          main: category.color,
          container: `${category.color}40`,
          onContainer: "#FFFFFF",
        },
      };
    }

    return colors;
  }

  function initialize_calendar(): void {
    if (!calendar_container_element || !browser) return;

    const today = Temporal.Now.plainDateISO();
    const schedule_x_events = convert_to_schedule_x_events(calendar_events);
    const calendar_colors = build_calendar_colors();
    const current_dark_mode = get_current_dark_mode();

    calendar_instance = createCalendar({
      views: [viewMonthGrid, viewWeek, viewDay, viewList],
      defaultView: viewMonthGrid.name,
      selectedDate: today,
      isDark: current_dark_mode,
      events: schedule_x_events,
      calendars: calendar_colors as any,
      plugins: [createDragAndDropPlugin(), createEventModalPlugin()],
      callbacks: {
        onEventClick: (event_data: any) => {
          handle_event_click(String(event_data.id));
        },
        onClickDate: (date: any) => {
          const date_string = date.toString();
          handle_date_click(date_string);
        },
        onClickDateTime: (dateTime: any) => {
          const date_string = dateTime.toPlainDate().toString();
          const hours = String(dateTime.hour).padStart(2, "0");
          const minutes = String(dateTime.minute).padStart(2, "0");
          new_activity_start_date = date_string;
          new_activity_end_date = date_string;
          new_activity_start_time = `${hours}:${minutes}`;
          const end_hour = (dateTime.hour + 1) % 24;
          new_activity_end_time = `${String(end_hour).padStart(2, "0")}:${minutes}`;
          reset_modal_position();
          show_create_modal = true;
        },
      },
    });

    calendar_instance.render(calendar_container_element);
  }

  function update_calendar_events(): void {
    if (!calendar_instance) return;

    const schedule_x_events = convert_to_schedule_x_events(calendar_events);
    calendar_instance.events.set(schedule_x_events);
  }

  function reinitialize_calendar_for_theme(): void {
    if (calendar_instance) {
      calendar_instance.destroy();
      calendar_instance = null;
    }
    initialize_calendar();
  }

  function handle_event_click(event_id: string): void {
    const clicked_event = calendar_events.find((e) => e.id === event_id);
    if (!clicked_event) return;

    if (clicked_event.is_editable) {
      open_edit_modal(clicked_event.activity);
    } else {
      selected_event_details = clicked_event;
      show_event_details_modal = true;
    }
  }

  function close_event_details_modal(): void {
    show_event_details_modal = false;
    selected_event_details = null;
  }

  function start_modal_drag(e: MouseEvent): void {
    is_dragging = true;
    drag_offset = {
      x: e.clientX - modal_position.x,
      y: e.clientY - modal_position.y,
    };
  }

  function handle_modal_drag(e: MouseEvent): void {
    if (!is_dragging) return;
    modal_position = {
      x: e.clientX - drag_offset.x,
      y: e.clientY - drag_offset.y,
    };
  }

  function stop_modal_drag(): void {
    is_dragging = false;
  }

  function reset_modal_position(): void {
    modal_position = { x: 0, y: 0 };
  }

  function handle_date_click(date_string: string): void {
    new_activity_start_date = date_string;
    new_activity_end_date = date_string;
    new_activity_start_time = "09:00";
    new_activity_end_time = "10:00";
    reset_modal_position();
    show_create_modal = true;
  }

  function open_edit_modal(activity: Activity): void {
    editing_activity = activity;
    new_activity_title = activity.title;
    new_activity_description = activity.description;
    new_activity_category_id = activity.category_id;
    new_activity_start_date = activity.start_datetime.split("T")[0];
    new_activity_start_time =
      activity.start_datetime.split("T")[1]?.substring(0, 5) || "09:00";
    new_activity_end_date = activity.end_datetime.split("T")[0];
    new_activity_end_time =
      activity.end_datetime.split("T")[1]?.substring(0, 5) || "10:00";
    new_activity_is_all_day = activity.is_all_day;
    new_activity_location = activity.location;
    reset_modal_position();
    show_create_modal = true;
  }

  function close_create_modal(): void {
    show_create_modal = false;
    editing_activity = null;
    reset_activity_form();
  }

  function reset_activity_form(): void {
    new_activity_title = "";
    new_activity_description = "";
    new_activity_category_id = "";
    new_activity_start_date = "";
    new_activity_start_time = "09:00";
    new_activity_end_date = "";
    new_activity_end_time = "10:00";
    new_activity_is_all_day = false;
    new_activity_location = "";
    new_activity_google_sync = false;
  }

  async function handle_save_activity(): Promise<void> {
    if (!new_activity_title.trim()) {
      show_toast("Please enter an activity title", "warning");
      return;
    }

    if (!new_activity_category_id) {
      show_toast("Please select a category", "warning");
      return;
    }

    if (!new_activity_start_date || !new_activity_end_date) {
      show_toast("Please select start and end dates", "warning");
      return;
    }

    const selected_category = categories.find(
      (c) => c.id === new_activity_category_id,
    );
    const start_datetime = new_activity_is_all_day
      ? `${new_activity_start_date}T00:00:00`
      : `${new_activity_start_date}T${new_activity_start_time}:00`;
    const end_datetime = new_activity_is_all_day
      ? `${new_activity_end_date}T23:59:59`
      : `${new_activity_end_date}T${new_activity_end_time}:00`;

    let created_or_updated_activity: Activity | undefined;

    if (editing_activity) {
      const update_result = await use_cases.activity_use_cases.update(
        editing_activity.id,
        {
          title: new_activity_title,
          description: new_activity_description,
          category_id: new_activity_category_id,
          category_type: selected_category?.category_type || "custom",
          start_datetime,
          end_datetime,
          is_all_day: new_activity_is_all_day,
          location: new_activity_location,
          google_calendar_sync_enabled: new_activity_google_sync,
        },
      );

      if (!update_result.success) {
        show_toast(
          update_result.error_message || "Failed to update activity",
          "error",
        );
        return;
      }
      created_or_updated_activity = update_result.data;
    } else {
      const create_input: CreateActivityInput = {
        title: new_activity_title,
        description: new_activity_description,
        organization_id: selected_organization_id,
        category_id: new_activity_category_id,
        category_type: selected_category?.category_type || "custom",
        start_datetime,
        end_datetime,
        is_all_day: new_activity_is_all_day,
        location: new_activity_location,
        venue_id: null,
        team_ids: [],
        competition_id: null,
        fixture_id: null,
        source_type: "manual",
        source_id: null,
        status: "scheduled",
        recurrence: null,
        reminders: [...DEFAULT_REMINDERS],
        color_override: null,
        google_calendar_sync_enabled: new_activity_google_sync,
        notes: "",
      };

      const create_result =
        await use_cases.activity_use_cases.create(create_input);

      if (!create_result.success) {
        show_toast(
          create_result.error_message || "Failed to create activity",
          "error",
        );
        return;
      }
      created_or_updated_activity = create_result.data;
    }

    if (
      new_activity_google_sync &&
      google_auth_status.is_signed_in &&
      created_or_updated_activity
    ) {
      const sync_result = await sync_activity_to_google_calendar(
        created_or_updated_activity,
      );
      if (!sync_result.success) {
        show_toast(
          `Activity saved but failed to sync to Google Calendar: ${sync_result.error}`,
          "warning",
        );
      }
    }

    close_create_modal();
    calendar_events = await sync_and_load_calendar_events(
      selected_organization_id,
    );
    update_calendar_events();
  }

  async function handle_delete_activity(): Promise<void> {
    if (!editing_activity) return;

    const confirmed = confirm("Are you sure you want to delete this activity?");
    if (!confirmed) return;

    const delete_result = await use_cases.activity_use_cases.delete(
      editing_activity.id,
    );

    if (!delete_result.success) {
      show_toast(
        delete_result.error_message || "Failed to delete activity",
        "error",
      );
      return;
    }

    close_create_modal();
    calendar_events = await sync_and_load_calendar_events(
      selected_organization_id,
    );
    update_calendar_events();
  }

  async function handle_organization_change(): Promise<void> {
    if (!selected_organization_id) return;

    loading_state = "loading";

    try {
      teams = await load_teams_for_organization(selected_organization_id);
      competitions = await load_competitions_for_organization(
        selected_organization_id,
      );
      categories = await load_categories_for_organization(
        selected_organization_id,
      );
      calendar_events = await sync_and_load_calendar_events(
        selected_organization_id,
      );

      if (calendar_instance) {
        calendar_instance.destroy();
        calendar_instance = null;
      }

      loading_state = "success";

      await tick();
      calendar_needs_init = true;
    } catch (err) {
      error_message =
        err instanceof Error ? err.message : "Failed to load calendar data";
      loading_state = "error";
    }
  }

  async function handle_filter_change(): Promise<void> {
    if (!selected_organization_id) return;

    filter_loading = true;

    try {
      console.log(
        "[Calendar] Filter change - category:",
        filter_category_id,
        "competition:",
        filter_competition_id,
        "team:",
        filter_team_id,
      );
      calendar_events = await sync_and_load_calendar_events(
        selected_organization_id,
      );
      console.log(
        "[Calendar] Loaded events after filter:",
        calendar_events.length,
      );
      update_calendar_events();
    } finally {
      filter_loading = false;
    }
  }

  async function clear_filters(): Promise<void> {
    filter_category_id = "";
    filter_competition_id = "";
    filter_team_id = "";
    await handle_filter_change();
  }

  function open_category_modal(): void {
    show_category_modal = true;
  }

  function close_category_modal(): void {
    show_category_modal = false;
    new_category_name = "";
    new_category_color = "#3B82F6";
    new_category_type = "custom";
  }

  async function handle_create_category(): Promise<void> {
    if (!new_category_name.trim()) {
      show_toast("Please enter a category name", "warning");
      return;
    }

    const create_result = await use_cases.activity_category_use_cases.create({
      name: new_category_name,
      description: "",
      organization_id: selected_organization_id,
      category_type: new_category_type as any,
      color: new_category_color,
      icon: "star",
      is_system_generated: false,
    });

    if (!create_result.success) {
      show_toast(
        create_result.error_message || "Failed to create category",
        "error",
      );
      return;
    }

    categories = await load_categories_for_organization(
      selected_organization_id,
    );

    if (calendar_instance) {
      calendar_instance.destroy();
      calendar_instance = null;
      initialize_calendar();
    }

    close_category_modal();
  }

  async function handle_google_sign_in(): Promise<void> {
    if (!google_calendar_configured) {
      show_toast(
        "Google Calendar is not configured. Please contact your administrator.",
        "warning",
      );
      return;
    }

    google_auth_status = await sign_in_to_google_calendar();

    if (google_auth_status.is_signed_in) {
      show_toast("Successfully signed in to Google Calendar", "success");
    }
  }

  function handle_google_sign_out(): void {
    sign_out_of_google_calendar();
    google_auth_status = { is_signed_in: false };
  }

  $effect(() => {
    if (
      calendar_container_element &&
      calendar_needs_init &&
      !calendar_instance &&
      browser
    ) {
      initialize_calendar();
      calendar_needs_init = false;
    }
  });

  onMount(async () => {
    if (!browser) return;

    is_dark_mode = get_current_dark_mode();
    loading_state = "loading";

    try {
      google_calendar_configured = is_google_calendar_configured();

      if (google_calendar_configured) {
        await initialize_google_calendar();
        google_auth_status = { is_signed_in: is_signed_in_to_google() };
      }

      organizations = await load_organizations();

      if (organizations.length > 0) {
        selected_organization_id = organizations[0].id;
        await handle_organization_change();
      }

      loading_state = "success";
    } catch (err) {
      error_message =
        err instanceof Error ? err.message : "Failed to load data";
      loading_state = "error";
    }
  });

  onDestroy(() => {
    if (calendar_instance) {
      calendar_instance.destroy();
    }
  });
</script>

<svelte:head>
  <title>Calendar - Sports Management</title>
</svelte:head>

<div class="w-full">
  <LoadingStateWrapper
    state={loading_state}
    loading_text="Loading calendar..."
    {error_message}
  >
    {#if organizations.length === 0}
      <div class="card p-8 sm:p-12 text-center">
        <svg
          class="mx-auto h-12 w-12 text-accent-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3
          class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
        >
          No organizations found
        </h3>
        <p class="mt-2 text-accent-600 dark:text-accent-400">
          Create an organization first to use the calendar.
        </p>
        <button
          type="button"
          class="btn btn-primary-action mt-4"
          onclick={() => goto("/organizations")}
        >
          Go to Organizations
        </button>
      </div>
    {:else}
      <div class="card p-4 sm:p-6 space-y-4 overflow-hidden">
        <div
          class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4"
        >
          <div class="flex-1 min-w-0">
            <h2
              class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100"
            >
              Organization Calendar
            </h2>
            <p class="text-sm text-accent-600 dark:text-accent-400">
              View and manage activities, competitions, and fixtures
            </p>
          </div>

          <div
            class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto"
          >
            <select
              bind:value={selected_organization_id}
              onchange={handle_organization_change}
              class="select-styled w-full sm:w-auto min-w-0 sm:min-w-[200px]"
            >
              {#each organizations as org}
                <option value={org.id}>{org.name}</option>
              {/each}
            </select>

            <button
              type="button"
              class="btn btn-primary-action whitespace-nowrap"
              onclick={() => {
                const today = new Date().toISOString().split("T")[0];
                new_activity_start_date = today;
                new_activity_end_date = today;
                show_create_modal = true;
              }}
            >
              + Add Activity
            </button>

            <button
              type="button"
              class="px-4 py-2 text-sm font-medium rounded-lg border-2 border-primary-500 dark:border-primary-400 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 whitespace-nowrap flex items-center gap-2 transition-colors shadow-sm"
              onclick={() => (show_subscribe_modal = true)}
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Subscribe to Calendar
            </button>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700"
        >
          <span class="text-sm font-medium text-accent-700 dark:text-accent-300"
            >Filters:</span
          >

          <select
            bind:value={filter_category_id}
            onchange={() => handle_filter_change()}
            disabled={filter_loading}
            class="select-styled w-full sm:w-auto disabled:opacity-50"
          >
            <option value="">All Categories</option>
            {#each categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>

          <select
            bind:value={filter_competition_id}
            onchange={() => handle_filter_change()}
            disabled={filter_loading}
            class="select-styled w-full sm:w-auto disabled:opacity-50"
          >
            <option value="">All Competitions</option>
            {#each competitions as competition}
              <option value={competition.id}>{competition.name}</option>
            {/each}
          </select>

          <select
            bind:value={filter_team_id}
            onchange={() => handle_filter_change()}
            disabled={filter_loading}
            class="select-styled w-full sm:w-auto disabled:opacity-50"
          >
            <option value="">All Teams</option>
            {#each teams as team}
              <option value={team.id}>{team.name}</option>
            {/each}
          </select>

          {#if filter_category_id || filter_competition_id || filter_team_id}
            <button
              type="button"
              onclick={() => clear_filters()}
              disabled={filter_loading}
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
            >
              Clear Filters
            </button>
          {/if}

          {#if filter_loading}
            <div class="flex items-center gap-2 text-sm text-accent-500">
              <svg
                class="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Filtering...
            </div>
          {/if}

          <button
            type="button"
            onclick={open_category_modal}
            class="ml-auto text-sm text-accent-600 dark:text-accent-400 hover:text-accent-900 dark:hover:text-accent-100"
          >
            + New Category
          </button>
        </div>

        <div class="flex flex-wrap gap-2 pb-2">
          {#each categories as category}
            <span
              class="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full"
              style="background-color: {category.color}20; color: {category.color};"
            >
              <span
                class="w-2 h-2 rounded-full"
                style="background-color: {category.color};"
              ></span>
              {category.name}
            </span>
          {/each}
        </div>

        <div
          bind:this={calendar_container_element}
          class="min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] bg-white dark:bg-gray-900 rounded-lg"
        ></div>
      </div>
    {/if}
  </LoadingStateWrapper>
</div>

{#if show_create_modal}
  <div
    class="fixed inset-0 z-50 overflow-visible pointer-events-none"
    onmousemove={handle_modal_drag}
    onmouseup={stop_modal_drag}
    onmouseleave={stop_modal_drag}
    role="presentation"
  >
    <button
      type="button"
      class="fixed inset-0 bg-black/30 transition-opacity cursor-default border-none p-0 pointer-events-auto"
      onclick={close_create_modal}
      aria-label="Close modal"
      tabindex="-1"
    ></button>

    <div
      class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
      style="transform: translate(calc(-50% + {modal_position.x}px), calc(-50% + {modal_position.y}px));"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div
          class="flex justify-between items-center cursor-move select-none"
          onmousedown={start_modal_drag}
          role="toolbar"
          tabindex="0"
        >
          <h3
            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
          >
            {editing_activity ? "Edit Activity" : "Create Activity"}
          </h3>
          <button
            type="button"
            onclick={close_create_modal}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label
              for="activity_title"
              class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >
              Title *
            </label>
            <input
              id="activity_title"
              type="text"
              bind:value={new_activity_title}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Team Training Session"
            />
          </div>

          <div>
            <label
              for="activity_category"
              class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >
              Category *
            </label>
            <select
              id="activity_category"
              bind:value={new_activity_category_id}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a category</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label
              for="activity_description"
              class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="activity_description"
              bind:value={new_activity_description}
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Optional description"
            ></textarea>
          </div>

          <div class="flex items-center gap-2">
            <input
              id="activity_all_day"
              type="checkbox"
              bind:checked={new_activity_is_all_day}
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label
              for="activity_all_day"
              class="text-sm text-accent-700 dark:text-accent-300"
            >
              All day event
            </label>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="activity_start_date"
                class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
              >
                Start Date *
              </label>
              <input
                id="activity_start_date"
                type="date"
                bind:value={new_activity_start_date}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {#if !new_activity_is_all_day}
              <div>
                <label
                  for="activity_start_time"
                  class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                >
                  Start Time
                </label>
                <input
                  id="activity_start_time"
                  type="time"
                  bind:value={new_activity_start_time}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            {/if}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="activity_end_date"
                class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
              >
                End Date *
              </label>
              <input
                id="activity_end_date"
                type="date"
                bind:value={new_activity_end_date}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {#if !new_activity_is_all_day}
              <div>
                <label
                  for="activity_end_time"
                  class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                >
                  End Time
                </label>
                <input
                  id="activity_end_time"
                  type="time"
                  bind:value={new_activity_end_time}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            {/if}
          </div>

          <div>
            <label
              for="activity_location"
              class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >
              Location
            </label>
            <input
              id="activity_location"
              type="text"
              bind:value={new_activity_location}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Optional location"
            />
          </div>

          {#if google_calendar_configured}
            <div
              class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <input
                id="google_sync"
                type="checkbox"
                bind:checked={new_activity_google_sync}
                class="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
              />
              <label
                for="google_sync"
                class="flex items-center gap-2 text-sm text-accent-700 dark:text-accent-300 cursor-pointer"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sync to Google Calendar
              </label>
            </div>
          {/if}
        </div>

        <div
          class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          {#if editing_activity && editing_activity.source_type === "manual"}
            <button
              type="button"
              onclick={handle_delete_activity}
              class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          {:else}
            <div></div>
          {/if}

          <div class="flex gap-3">
            <button
              type="button"
              onclick={close_create_modal}
              class="px-4 py-2 text-sm font-medium text-accent-700 dark:text-accent-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick={handle_save_activity}
              class="btn btn-primary-action"
            >
              {editing_activity ? "Save Changes" : "Create Activity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if show_event_details_modal && selected_event_details}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4">
      <button
        type="button"
        class="fixed inset-0 bg-black/50 transition-opacity cursor-default border-none p-0"
        onclick={close_event_details_modal}
        aria-label="Close modal"
        tabindex="-1"
      ></button>

      <div
        class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
      >
        <div class="flex justify-between items-center">
          <h3
            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
          >
            {selected_event_details.title}
          </h3>
          <button
            type="button"
            onclick={close_event_details_modal}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full"
              style="background-color: {selected_event_details.color};"
            ></span>
            <span
              class="text-sm font-medium text-accent-700 dark:text-accent-300"
            >
              {selected_event_details.category_name}
            </span>
            <span
              class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 capitalize"
            >
              {selected_event_details.source_type}
            </span>
          </div>

          <div class="text-sm text-accent-600 dark:text-accent-400 space-y-1">
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {new Date(selected_event_details.start).toLocaleDateString(
                  undefined,
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </span>
            </div>
            {#if !selected_event_details.all_day}
              <div class="flex items-center gap-2">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {new Date(selected_event_details.start).toLocaleTimeString(
                    undefined,
                    { hour: "2-digit", minute: "2-digit" },
                  )} - {new Date(selected_event_details.end).toLocaleTimeString(
                    undefined,
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              </div>
            {/if}
            {#if selected_event_details.activity.location}
              <div class="flex items-center gap-2">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{selected_event_details.activity.location}</span>
              </div>
            {/if}
          </div>

          {#if selected_event_details.activity.description}
            <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p class="text-sm text-accent-600 dark:text-accent-400">
                {selected_event_details.activity.description}
              </p>
            </div>
          {/if}

          <div class="pt-2 text-xs text-gray-500 dark:text-gray-500">
            This event is synced from {selected_event_details.source_type} data and
            cannot be edited directly.
          </div>
        </div>

        <div
          class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            type="button"
            onclick={close_event_details_modal}
            class="px-4 py-2 text-sm font-medium text-accent-700 dark:text-accent-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if show_category_modal}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4">
      <button
        type="button"
        class="fixed inset-0 bg-black/50 transition-opacity cursor-default border-none p-0"
        onclick={close_category_modal}
        aria-label="Close modal"
        tabindex="-1"
      ></button>

      <div
        class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
      >
        <div class="flex justify-between items-center">
          <h3
            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
          >
            Create Category
          </h3>
          <button
            type="button"
            onclick={close_category_modal}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label
              for="category_name"
              class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >
              Name *
            </label>
            <input
              id="category_name"
              type="text"
              bind:value={new_category_name}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Team Building"
            />
          </div>

          <div>
            <label
              for="category_color"
              class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >
              Color
            </label>
            <div class="flex items-center gap-3">
              <input
                id="category_color"
                type="color"
                bind:value={new_category_color}
                class="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <span class="text-sm text-accent-600 dark:text-accent-400"
                >{new_category_color}</span
              >
            </div>
          </div>

          <div>
            <label
              for="category_type"
              class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
            >
              Type
            </label>
            <select
              id="category_type"
              bind:value={new_category_type}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-accent-900 dark:text-accent-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="custom">Custom</option>
              <option value="training">Training</option>
              <option value="administrative">Administrative</option>
              <option value="meeting">Meeting</option>
              <option value="medical">Medical</option>
              <option value="travel">Travel</option>
            </select>
          </div>
        </div>

        <div
          class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            type="button"
            onclick={close_category_modal}
            class="px-4 py-2 text-sm font-medium text-accent-700 dark:text-accent-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onclick={handle_create_category}
            class="btn btn-primary-action"
          >
            Create Category
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if show_subscribe_modal}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4">
      <button
        type="button"
        class="fixed inset-0 bg-black/50 transition-opacity cursor-default border-none p-0"
        onclick={() => (show_subscribe_modal = false)}
        aria-label="Close modal"
        tabindex="-1"
      ></button>

      <div
        class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-modal-title"
      >
        <div
          class="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
        >
          <h3
            id="subscribe-modal-title"
            class="text-lg font-semibold text-accent-900 dark:text-accent-100"
          >
            Subscribe to Calendar
          </h3>
          <button
            type="button"
            onclick={() => (show_subscribe_modal = false)}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close subscription modal"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <CalendarSubscriptionManager
            organization_id={selected_organization_id}
            user_id="default-user"
          />
        </div>
      </div>
    </div>
  </div>
{/if}

<Toast
  bind:is_visible={toast_visible}
  message={toast_message}
  type={toast_type}
  on:dismiss={() => (toast_visible = false)}
/>

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

  :global(.sx__date-picker__day--is-today) {
    font-weight: 700;
  }

  :global(.sx__month-grid-day--is-today .sx__month-grid-day__header-date) {
    background-color: var(--sx-color-primary, #3b82f6);
    color: white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.sx__month-grid-day:hover),
  :global(.sx__time-grid-day__click-target:hover) {
    cursor: pointer;
    background-color: rgba(59, 130, 246, 0.05);
  }

  :global(.dark .sx__month-grid-day:hover),
  :global(.dark .sx__time-grid-day__click-target:hover) {
    background-color: rgba(96, 165, 250, 0.1);
  }

  :global(.sx__month-grid-day__header) {
    font-weight: 500;
  }

  :global(.sx__event) {
    border-radius: 4px;
    font-size: 0.75rem;
  }
</style>
