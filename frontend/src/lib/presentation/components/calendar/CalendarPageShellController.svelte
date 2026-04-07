<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    import { page } from "$app/stores";
    import type { Activity } from "$lib/core/entities/Activity";
    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import { type UserScopeProfile } from "$lib/core/interfaces/ports";
    import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
    import {
        get_use_cases_container,
        type UseCasesContainer,
    } from "$lib/infrastructure/container";
    import {
        create_calendar_shell_category,
        delete_calendar_shell_activity,
        load_calendar_shell_bundle,
        load_calendar_shell_events,
        load_calendar_shell_initial_data,
        save_calendar_shell_activity,
    } from "$lib/presentation/logic/calendarPageShellControllerData";
    import {
        can_user_add_activities,
        can_user_change_organizations,
        create_activity_form_values_for_date,
        create_activity_form_values_for_date_time,
        extract_url_org_id,
        type LoadingState,
        resolve_calendar_event_click,
        resolve_selected_organization_name,
    } from "$lib/presentation/logic/calendarPageShellControllerHelpers";
    import {
        type ActivityFormValues,
        create_empty_activity_form_values,
    } from "$lib/presentation/logic/calendarPageState";
    import {
        auth_store,
        is_public_viewer,
    } from "$lib/presentation/stores/auth";
    import { public_organization_store } from "$lib/presentation/stores/publicOrganization";

    import CalendarPageOverlays from "./CalendarPageOverlays.svelte";
    import CalendarPageView from "./CalendarPageView.svelte";
    const use_cases: UseCasesContainer = get_use_cases_container();
    let loading_state: LoadingState = "idle",
        error_message = "",
        is_using_cached_data = false,
        organizations: Organization[] = [],
        selected_organization_id = "",
        teams: Team[] = [],
        competitions: Competition[] = [],
        categories: ActivityCategory[] = [],
        calendar_events: CalendarEvent[] = [],
        filter_category_id = "",
        filter_competition_id = "",
        filter_team_id = "",
        filter_loading = false,
        show_create_modal = false,
        show_category_modal = false,
        show_subscribe_modal = false,
        editing_activity: Activity | null = null,
        selected_event_details: CalendarEvent | null = null,
        activity_form_values: ActivityFormValues =
            create_empty_activity_form_values(),
        toast_visible = false,
        toast_message = "",
        toast_type: "success" | "error" | "warning" | "info" = "info";

    $: current_auth_profile = get(auth_store)
        .current_profile as UserScopeProfile | null;
    $: url_org_id = extract_url_org_id(get(page).url.searchParams);
    $: selected_organization_name = resolve_selected_organization_name(
        organizations,
        selected_organization_id,
    );

    function apply_calendar_bundle(bundle: {
        teams: Team[];
        competitions: Competition[];
        categories: ActivityCategory[];
        calendar_events: CalendarEvent[];
    }): void {
        teams = bundle.teams;
        competitions = bundle.competitions;
        categories = bundle.categories;
        calendar_events = bundle.calendar_events;
    }

    function show_toast(
        message: string,
        type: "success" | "error" | "warning" | "info" = "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }
    function open_create_modal(
        date_string = new Date().toISOString().split("T")[0],
    ): void {
        activity_form_values =
            create_activity_form_values_for_date(date_string);
        editing_activity = null;
        show_create_modal = true;
    }
    function handle_date_time_click(
        date_string: string,
        time_string: string,
    ): void {
        activity_form_values = create_activity_form_values_for_date_time(
            date_string,
            time_string,
        );
        editing_activity = null;
        show_create_modal = true;
    }
    function handle_event_click(event_id: string): void {
        const event_selection = resolve_calendar_event_click({
            calendar_events,
            event_id,
        });
        if (event_selection.activity_form_values) {
            editing_activity = event_selection.editing_activity;
            activity_form_values = event_selection.activity_form_values;
            show_create_modal = event_selection.show_create_modal;
            return;
        }
        selected_event_details = event_selection.selected_event_details;
    }
    function close_create_modal(): void {
        show_create_modal = false;
        editing_activity = null;
        activity_form_values = create_empty_activity_form_values();
    }
    async function refresh_calendar_bundle(): Promise<void> {
        if (!selected_organization_id) return;
        apply_calendar_bundle(
            await load_calendar_shell_bundle({
                organization_id: selected_organization_id,
                filter_category_id,
                filter_competition_id,
                filter_team_id,
                use_cases,
            }),
        );
    }
    async function handle_save_activity(): Promise<void> {
        const result = await save_calendar_shell_activity({
            activity_form_values,
            categories,
            editing_activity,
            selected_organization_id,
            filter_category_id,
            filter_competition_id,
            filter_team_id,
            use_cases,
        });
        if (!result.success)
            return show_toast(result.error_message, result.error_type);
        close_create_modal();
        calendar_events = result.calendar_events;
    }
    async function handle_delete_activity(): Promise<void> {
        if (
            !editing_activity ||
            !confirm("Are you sure you want to delete this activity?")
        )
            return;
        const result = await delete_calendar_shell_activity({
            editing_activity,
            selected_organization_id,
            filter_category_id,
            filter_competition_id,
            filter_team_id,
            use_cases,
        });
        if (!result.success)
            return show_toast(result.error_message, result.error_type);
        close_create_modal();
        calendar_events = result.calendar_events;
    }
    async function handle_organization_change(): Promise<void> {
        if (!selected_organization_id) return;
        if (get(is_public_viewer) && url_org_id.length === 0)
            await public_organization_store.set_organization(
                selected_organization_id,
                selected_organization_name,
            );
        loading_state = "loading";
        await refresh_calendar_bundle();
        loading_state = "success";
    }
    async function handle_filter_change(): Promise<void> {
        if (!selected_organization_id) return;
        filter_loading = true;
        calendar_events = await load_calendar_shell_events({
            organization_id: selected_organization_id,
            filter_category_id,
            filter_competition_id,
            filter_team_id,
            use_cases,
        });
        filter_loading = false;
    }
    async function clear_filters(): Promise<void> {
        filter_category_id = "";
        filter_competition_id = "";
        filter_team_id = "";
        await handle_filter_change();
    }
    async function handle_create_category(
        category_name: string,
        category_color: string,
        category_type: string,
    ): Promise<void> {
        const result = await create_calendar_shell_category({
            category_name,
            category_color,
            category_type,
            selected_organization_id,
            filter_category_id,
            filter_competition_id,
            filter_team_id,
            use_cases,
        });
        if (!result.success)
            return show_toast(result.error_message, result.error_type);
        categories = result.categories;
        show_category_modal = false;
    }
    onMount(async () => {
        const initial_data = await load_calendar_shell_initial_data({
            is_public: get(is_public_viewer),
            current_profile: current_auth_profile,
            preferred_organization_id:
                url_org_id || get(public_organization_store).organization_id,
            use_cases,
        });
        if (!initial_data.success) {
            error_message = initial_data.error_message;
            loading_state = "error";
            return;
        }
        loading_state = "loading";
        is_using_cached_data = initial_data.is_using_cached_data;
        organizations = initial_data.organizations;
        selected_organization_id = initial_data.selected_organization_id;
        if (initial_data.bundle) apply_calendar_bundle(initial_data.bundle);
        loading_state = "success";
    });
</script>

<svelte:head><title>Calendar - Sports Management</title></svelte:head>

<CalendarPageView
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
    can_user_change_organizations={can_user_change_organizations(
        current_auth_profile,
        url_org_id,
    )}
    can_user_add_activities={can_user_add_activities(current_auth_profile)}
    on_organization_change={handle_organization_change}
    on_open_create_modal={() => open_create_modal()}
    on_open_subscribe_modal={() => (show_subscribe_modal = true)}
    on_filter_change={handle_filter_change}
    on_clear_filters={clear_filters}
    on_open_category_modal={() => (show_category_modal = true)}
    on_event_click={handle_event_click}
    on_date_click={open_create_modal}
    on_date_time_click={handle_date_time_click}
/>
<CalendarPageOverlays
    bind:activity_form_values
    {show_create_modal}
    {editing_activity}
    {categories}
    {selected_event_details}
    {show_category_modal}
    {show_subscribe_modal}
    {selected_organization_id}
    bind:toast_visible
    {toast_message}
    {toast_type}
    on_close_create_modal={close_create_modal}
    on_save_activity={handle_save_activity}
    on_delete_activity={handle_delete_activity}
    on_close_event_details_modal={() => (selected_event_details = null)}
    on_close_category_modal={() => (show_category_modal = false)}
    on_create_category={handle_create_category}
    on_close_subscribe_modal={() => (show_subscribe_modal = false)}
/>
