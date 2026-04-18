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
        can_user_add_activities,
        can_user_change_organizations,
        extract_url_org_id,
        type LoadingState,
        resolve_selected_organization_name,
    } from "$lib/presentation/logic/calendarPageShellControllerHelpers";
    import { create_calendar_page_shell_controller_runtime } from "$lib/presentation/logic/calendarPageShellControllerRuntime";
    import {
        type ActivityFormValues,
        create_empty_activity_form_values,
    } from "$lib/presentation/logic/calendarPageState";
    import { auth_store } from "$lib/presentation/stores/auth";

    import CalendarPageOverlays from "./CalendarPageOverlays.svelte";
    import CalendarPageView from "./CalendarPageView.svelte";
    const use_cases: UseCasesContainer = get_use_cases_container();
    let loading_state: LoadingState = "loading",
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
        editing_activity: Activity | undefined = undefined,
        selected_event_details: CalendarEvent | undefined = undefined,
        activity_form_values: ActivityFormValues =
            create_empty_activity_form_values(),
        toast_visible = false,
        toast_message = "",
        toast_type: "success" | "error" | "warning" | "info" = "info";

    $: current_auth_profile_state = (() => {
        const current_profile = get(auth_store).current_profile;

        if (current_profile.status !== "present") {
            return { status: "missing" as const };
        }

        return {
            status: "present" as const,
            profile: current_profile.profile as unknown as UserScopeProfile,
        };
    })();
    $: url_org_id = extract_url_org_id(get(page).url.searchParams);
    $: selected_organization_name = resolve_selected_organization_name(
        organizations,
        selected_organization_id,
    );

    function show_toast(
        message: string,
        type: "success" | "error" | "warning" | "info" = "info",
    ): void {
        toast_message = message;
        toast_type = type;
        toast_visible = true;
    }

    const runtime = create_calendar_page_shell_controller_runtime({
        get_activity_form_values: () => activity_form_values,
        get_calendar_events: () => calendar_events,
        get_categories: () => categories,
        get_current_auth_profile_state: () => current_auth_profile_state,
        get_editing_activity: () => editing_activity,
        get_filter_category_id: () => filter_category_id,
        get_filter_competition_id: () => filter_competition_id,
        get_filter_team_id: () => filter_team_id,
        get_organizations: () => organizations,
        get_selected_organization_id: () => selected_organization_id,
        get_selected_organization_name: () => selected_organization_name,
        get_url_org_id: () => url_org_id,
        set_activity_form_values: (value: ActivityFormValues) =>
            (activity_form_values = value),
        set_calendar_events: (value: CalendarEvent[]) =>
            (calendar_events = value),
        set_categories: (value: ActivityCategory[]) => (categories = value),
        set_competitions: (value: Competition[]) => (competitions = value),
        set_editing_activity: (value: Activity | undefined) =>
            (editing_activity = value),
        set_error_message: (value: string) => (error_message = value),
        set_filter_category_id: (value: string) => (filter_category_id = value),
        set_filter_competition_id: (value: string) =>
            (filter_competition_id = value),
        set_filter_loading: (value: boolean) => (filter_loading = value),
        set_filter_team_id: (value: string) => (filter_team_id = value),
        set_is_using_cached_data: (value: boolean) =>
            (is_using_cached_data = value),
        set_loading_state: (value: LoadingState) => (loading_state = value),
        set_organizations: (value: Organization[]) => (organizations = value),
        set_selected_event_details: (value: CalendarEvent | undefined) =>
            (selected_event_details = value),
        set_selected_organization_id: (value: string) =>
            (selected_organization_id = value),
        set_show_category_modal: (value: boolean) =>
            (show_category_modal = value),
        set_show_create_modal: (value: boolean) => (show_create_modal = value),
        set_show_subscribe_modal: (value: boolean) =>
            (show_subscribe_modal = value),
        set_teams: (value: Team[]) => (teams = value),
        show_toast,
        use_cases,
    });

    async function handle_delete_activity(): Promise<void> {
        if (
            !editing_activity ||
            !confirm("Are you sure you want to delete this activity?")
        )
            return;
        await runtime.delete_current_activity();
    }
    onMount(runtime.initialize);
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
        current_auth_profile_state,
        url_org_id,
    )}
    can_user_add_activities={can_user_add_activities(current_auth_profile_state)}
    on_organization_change={runtime.handle_organization_change}
    on_open_create_modal={() => runtime.handle_date_click()}
    on_open_subscribe_modal={runtime.open_subscribe_modal}
    on_filter_change={runtime.handle_filter_change}
    on_clear_filters={runtime.clear_filters}
    on_open_category_modal={runtime.open_category_modal}
    on_event_click={runtime.handle_event_click}
    on_date_click={runtime.handle_date_click}
    on_date_time_click={runtime.handle_date_time_click}
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
    on_close_create_modal={runtime.close_create_modal}
    on_save_activity={runtime.handle_save_activity}
    on_delete_activity={handle_delete_activity}
    on_close_event_details_modal={runtime.close_event_details_modal}
    on_close_category_modal={() => (show_category_modal = false)}
    on_create_category={runtime.handle_create_category}
    on_close_subscribe_modal={runtime.close_subscribe_modal}
/>
