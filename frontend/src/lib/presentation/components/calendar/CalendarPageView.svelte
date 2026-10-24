<script lang="ts">
    import type { ActivityCategory } from "$lib/core/entities/ActivityCategory";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Organization } from "$lib/core/entities/Organization";
    import type { Team } from "$lib/core/entities/Team";
    import type { CalendarEvent } from "$lib/core/interfaces/ports/internal/usecases/ActivityUseCasesPort";
    import {
        type CalendarActivityPermissions,
        can_user_create_calendar_activities,
        resolve_calendar_page_subtitle,
    } from "$lib/presentation/logic/calendarActivityPermissions";
    import type { CalendarProfileState } from "$lib/presentation/logic/calendarPageData";
    import { can_user_change_organizations } from "$lib/presentation/logic/calendarPageShellControllerHelpers";

    import CalendarPageContent from "./CalendarPageContent.svelte";

    export let loading_state: "idle" | "loading" | "success" | "error";
    export let error_message: string;
    export let is_using_cached_data: boolean;
    export let organizations: Organization[];
    export let selected_organization_id: string;
    export let selected_organization_name: string;
    export let teams: Team[];
    export let competitions: Competition[];
    export let categories: ActivityCategory[];
    export let calendar_events: CalendarEvent[];
    export let filter_category_id: string;
    export let filter_competition_id: string;
    export let filter_team_id: string;
    export let filter_loading: boolean;
    export let current_auth_profile_state: CalendarProfileState;
    export let url_org_id: string;
    export let calendar_permissions: CalendarActivityPermissions;
    export let on_organization_change: () => Promise<void>;
    export let on_open_create_modal: () => void;
    export let on_open_subscribe_modal: () => void;
    export let on_filter_change: () => Promise<void>;
    export let on_clear_filters: () => Promise<void>;
    export let on_open_category_modal: () => void;
    export let on_event_click: (event_id: string) => void;
    export let on_date_click: (date_string: string) => void;
    export let on_date_time_click: (
        date_string: string,
        time_string: string,
    ) => void;

    $: can_user_change_selected_organization = can_user_change_organizations(
        current_auth_profile_state,
        url_org_id,
    );
    $: can_user_add_activities = can_user_create_calendar_activities(
        current_auth_profile_state,
        calendar_permissions,
    );
    $: can_user_add_categories = calendar_permissions.can_create_category;
    $: page_subtitle = resolve_calendar_page_subtitle(calendar_permissions);
</script>

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
    can_user_change_organizations={can_user_change_selected_organization}
    {can_user_add_activities}
    {can_user_add_categories}
    {page_subtitle}
    {on_organization_change}
    {on_open_create_modal}
    {on_open_subscribe_modal}
    {on_filter_change}
    {on_clear_filters}
    {on_open_category_modal}
    {on_event_click}
    {on_date_click}
    {on_date_time_click}
/>
