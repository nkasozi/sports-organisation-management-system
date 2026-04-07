<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { page } from "$app/stores";
    import {
        type Activity,
        type CreateActivityInput,
    } from "$lib/core/entities/Activity";
    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import {
        ANY_VALUE,
        get_scope_value,
        type UserScopeProfile,
    } from "$lib/core/interfaces/ports";
    import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
    import { get_use_cases_container } from "$lib/infrastructure/container";
    import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";
    import CalendarActivityFormModal from "$lib/presentation/components/calendar/CalendarActivityFormModal.svelte";
    import CalendarCategoryModal from "$lib/presentation/components/calendar/CalendarCategoryModal.svelte";
    import CalendarEventDetailsModal from "$lib/presentation/components/calendar/CalendarEventDetailsModal.svelte";
    import CalendarPageContent from "$lib/presentation/components/calendar/CalendarPageContent.svelte";
    import CalendarSubscribeModal from "$lib/presentation/components/calendar/CalendarSubscribeModal.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
    import {
        type ActivityFormValues,
        build_activity_datetime_range,
        build_manual_activity_input,
        create_activity_form_values_from_activity,
        create_empty_activity_form_values,
        get_current_year_date_range,
    } from "$lib/presentation/logic/calendarPageState";
    import {
        auth_store,
        is_public_viewer,
    } from "$lib/presentation/stores/auth";
    import { public_organization_store } from "$lib/presentation/stores/publicOrganization";
    type LoadingState = "idle" | "loading" | "success" | "error";
    const use_cases = get_use_cases_container();
    let loading_state: LoadingState = "idle",
        error_message = "",
        is_using_cached_data = false;
    let organizations: Organization[] = [],
        selected_organization_id = "",
        teams: Team[] = [],
        competitions: Competition[] = [],
        categories: ActivityCategory[] = [],
        calendar_events: CalendarEvent[] = [];
    let filter_category_id = "",
        filter_competition_id = "",
        filter_team_id = "",
        filter_loading = false;
    let show_create_modal = false,
        show_category_modal = false,
        show_subscribe_modal = false;
    let editing_activity: Activity | null = null,
        selected_event_details: CalendarEvent | null = null;
    let activity_form_values: ActivityFormValues =
        create_empty_activity_form_values();
    let toast_visible = false,
        toast_message = "",
        toast_type: "success" | "error" | "warning" | "info" = "info";
    $: selected_organization_name =
        organizations.find(
            (organization) => organization.id === selected_organization_id,
        )?.name || "Organization";

    function can_user_add_activities(): boolean {
        const profile = get(auth_store)
            .current_profile as UserScopeProfile | null;
        if (!profile) return false;
        if (profile.organization_id === ANY_VALUE) return true;
        return (
            !!get_scope_value(profile, "organization_id") &&
            !get_scope_value(profile, "team_id")
        );
    }
    function extract_url_org_id(): string {
        return get(page).url.searchParams.get("org") ?? "";
    }
    function can_user_change_organizations(): boolean {
        const profile = get(auth_store)
            .current_profile as UserScopeProfile | null;
        if (!profile) return extract_url_org_id().length === 0;
        if (profile.organization_id === ANY_VALUE) return true;
        return !profile.organization_id && extract_url_org_id().length === 0;
    }
    function show_toast(
        message: string,
        type: "success" | "error" | "warning" | "info" = "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }
    async function load_organizations(): Promise<Organization[]> {
        const profile = get(auth_store)
            .current_profile as UserScopeProfile | null;
        const org_scope = get_scope_value(profile, "organization_id");
        const result = await use_cases.organization_use_cases.list({});
        if (!result.success) return [];
        return org_scope
            ? result.data.items.filter(
                  (organization) => organization.id === org_scope,
              )
            : result.data.items;
    }
    async function load_teams_for_organization(
        organization_id: string,
    ): Promise<Team[]> {
        const result = await use_cases.team_use_cases.list({ organization_id });
        return result.success ? result.data.items : [];
    }
    async function load_competitions_for_organization(
        organization_id: string,
    ): Promise<Competition[]> {
        const result = await use_cases.competition_use_cases.list({
            organization_id,
        });
        return result.success ? result.data.items : [];
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
        return result.success ? result.data.items : [];
    }
    async function sync_and_load_calendar_events(
        organization_id: string,
    ): Promise<CalendarEvent[]> {
        await use_cases.activity_use_cases.sync_competitions_to_activities(
            organization_id,
        );
        await use_cases.activity_use_cases.sync_fixtures_to_activities(
            organization_id,
        );
        const filter: Record<string, string> = {};
        if (filter_category_id) filter.category_id = filter_category_id;
        if (filter_competition_id)
            filter.competition_id = filter_competition_id;
        if (filter_team_id) filter.team_id = filter_team_id;
        const result = await use_cases.activity_use_cases.get_calendar_events(
            organization_id,
            get_current_year_date_range(),
            filter,
        );
        return result.success ? result.data || [] : [];
    }
    function open_create_modal(): void {
        const today = new Date().toISOString().split("T")[0];
        activity_form_values = {
            ...create_empty_activity_form_values(),
            start_date: today,
            end_date: today,
        };
        editing_activity = null;
        show_create_modal = true;
    }
    function handle_date_click(date_string: string): void {
        activity_form_values = {
            ...create_empty_activity_form_values(),
            start_date: date_string,
            end_date: date_string,
        };
        editing_activity = null;
        show_create_modal = true;
    }
    function handle_date_time_click(
        date_string: string,
        time_string: string,
    ): void {
        const start_hour = Number(time_string.split(":")[0]);
        activity_form_values = {
            ...create_empty_activity_form_values(),
            start_date: date_string,
            end_date: date_string,
            start_time: time_string,
            end_time: `${String((start_hour + 1) % 24).padStart(2, "0")}:${time_string.split(":")[1]}`,
        };
        editing_activity = null;
        show_create_modal = true;
    }
    function open_edit_modal(activity: Activity): void {
        editing_activity = activity;
        activity_form_values =
            create_activity_form_values_from_activity(activity);
        show_create_modal = true;
    }
    function handle_event_click(event_id: string): void {
        const selected_event = calendar_events.find(
            (event) => event.id === event_id,
        );
        if (!selected_event) return;
        if (selected_event.is_editable)
            return open_edit_modal(selected_event.activity);
        selected_event_details = selected_event;
    }
    function close_create_modal(): void {
        show_create_modal = false;
        editing_activity = null;
        activity_form_values = create_empty_activity_form_values();
    }
    function close_event_details_modal(): void {
        selected_event_details = null;
    }
    async function handle_save_activity(): Promise<void> {
        if (!activity_form_values.title.trim())
            return show_toast("Please enter an activity title", "warning");
        if (!activity_form_values.category_id)
            return show_toast("Please select a category", "warning");
        if (!activity_form_values.start_date || !activity_form_values.end_date)
            return show_toast("Please select start and end dates", "warning");
        const selected_category = categories.find(
            (category) => category.id === activity_form_values.category_id,
        );
        if (!selected_category)
            return show_toast("Please select a category", "warning");
        if (editing_activity) {
            const datetime_range =
                build_activity_datetime_range(activity_form_values);
            const result = await use_cases.activity_use_cases.update(
                editing_activity.id,
                {
                    title: activity_form_values.title,
                    description: activity_form_values.description,
                    category_id: activity_form_values.category_id,
                    category_type: selected_category.category_type,
                    start_datetime: datetime_range.start_datetime,
                    end_datetime: datetime_range.end_datetime,
                    is_all_day: activity_form_values.is_all_day,
                    location: activity_form_values.location,
                },
            );
            if (!result.success)
                return show_toast(
                    result.error || "Failed to update activity",
                    "error",
                );
        } else {
            const create_input: CreateActivityInput =
                build_manual_activity_input(
                    activity_form_values,
                    selected_organization_id,
                    selected_category,
                );
            const result =
                await use_cases.activity_use_cases.create(create_input);
            if (!result.success)
                return show_toast(
                    result.error || "Failed to create activity",
                    "error",
                );
        }
        close_create_modal();
        calendar_events = await sync_and_load_calendar_events(
            selected_organization_id,
        );
    }
    async function handle_delete_activity(): Promise<void> {
        if (!editing_activity) return;
        if (!confirm("Are you sure you want to delete this activity?")) return;
        const result = await use_cases.activity_use_cases.delete(
            editing_activity.id,
        );
        if (!result.success)
            return show_toast(
                result.error || "Failed to delete activity",
                "error",
            );
        close_create_modal();
        calendar_events = await sync_and_load_calendar_events(
            selected_organization_id,
        );
    }
    async function handle_organization_change(): Promise<void> {
        if (!selected_organization_id) return;
        if (get(is_public_viewer) && extract_url_org_id().length === 0)
            await public_organization_store.set_organization(
                selected_organization_id,
                selected_organization_name,
            );
        loading_state = "loading";
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
        loading_state = "success";
    }
    async function handle_filter_change(): Promise<void> {
        if (!selected_organization_id) return;
        filter_loading = true;
        calendar_events = await sync_and_load_calendar_events(
            selected_organization_id,
        );
        filter_loading = false;
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
    async function handle_create_category(
        category_name: string,
        category_color: string,
        category_type: string,
    ): Promise<void> {
        if (!category_name.trim())
            return show_toast("Please enter a category name", "warning");
        const result = await use_cases.activity_category_use_cases.create({
            name: category_name,
            description: "",
            organization_id: selected_organization_id,
            category_type: category_type as ActivityCategory["category_type"],
            color: category_color,
            icon: "star",
            is_system_generated: false,
        });
        if (!result.success)
            return show_toast(
                result.error || "Failed to create category",
                "error",
            );
        categories = await load_categories_for_organization(
            selected_organization_id,
        );
        show_category_modal = false;
    }
    onMount(async () => {
        const auth_result = await ensure_auth_profile();
        const is_public = get(is_public_viewer);
        if (!auth_result.success && !is_public) {
            error_message = auth_result.error_message;
            loading_state = "error";
            return;
        }
        loading_state = "loading";
        const fetch_result = await fetch_public_data_from_convex("calendar");
        is_using_cached_data = !fetch_result.success;
        organizations = await load_organizations();
        if (organizations.length > 0) {
            const preferred_id =
                extract_url_org_id() ||
                get(public_organization_store).organization_id;
            selected_organization_id =
                organizations.find(
                    (organization) => organization.id === preferred_id,
                )?.id || organizations[0].id;
            await handle_organization_change();
        }
        loading_state = "success";
    });
</script>

<svelte:head>
    <title>Calendar - Sports Management</title>
</svelte:head>

<CalendarPageContent
    bind:selected_organization_id
    bind:filter_category_id
    bind:filter_competition_id
    bind:filter_team_id
    {loading_state}
    {error_message}
    {is_using_cached_data}
    {organizations}
    {selected_organization_name}
    {teams}
    {competitions}
    {categories}
    {calendar_events}
    {filter_loading}
    can_user_change_organizations={can_user_change_organizations()}
    can_user_add_activities={can_user_add_activities()}
    on_organization_change={handle_organization_change}
    on_open_create_modal={open_create_modal}
    on_open_subscribe_modal={() => (show_subscribe_modal = true)}
    on_filter_change={handle_filter_change}
    on_clear_filters={clear_filters}
    on_open_category_modal={open_category_modal}
    on_event_click={handle_event_click}
    on_date_click={handle_date_click}
    on_date_time_click={handle_date_time_click}
/>
<CalendarActivityFormModal
    bind:activity_form_values
    is_visible={show_create_modal}
    {editing_activity}
    {categories}
    on_close={close_create_modal}
    on_save={handle_save_activity}
    on_delete={handle_delete_activity}
/>
<CalendarEventDetailsModal
    {selected_event_details}
    on_close={close_event_details_modal}
/>
<CalendarCategoryModal
    is_visible={show_category_modal}
    on_close={() => (show_category_modal = false)}
    on_create={handle_create_category}
/>
<CalendarSubscribeModal
    is_visible={show_subscribe_modal}
    organization_id={selected_organization_id}
    on_close={() => (show_subscribe_modal = false)}
/>
<Toast
    bind:is_visible={toast_visible}
    message={toast_message}
    type={toast_type}
    on:dismiss={() => (toast_visible = false)}
/>
