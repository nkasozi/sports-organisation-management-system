<script lang="ts">
    import { onMount } from "svelte";

    import {
        CALENDAR_FEED_TYPE,
        type CalendarFeedType,
        type CalendarToken,
    } from "$lib/core/entities/CalendarToken";
    import type { Competition } from "$lib/core/entities/Competition";
    import type { Team } from "$lib/core/entities/Team";
    import {
        create_none_option,
        create_some_option,
        type Option,
    } from "$lib/core/types/Option";
    import { get_use_cases_container } from "$lib/infrastructure/container";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";

    import CalendarSubscriptionCreateSection from "./CalendarSubscriptionCreateSection.svelte";
    import CalendarSubscriptionFeedList from "./CalendarSubscriptionFeedList.svelte";
    import {
        get_current_origin_https_url,
        get_current_origin_webcal_url,
    } from "./calendarSubscriptionFeedPresentation";
    import CalendarSubscriptionHelp from "./CalendarSubscriptionHelp.svelte";
    import {
        CALENDAR_SUBSCRIPTION_REMINDER_OPTIONS,
        copy_calendar_subscription_to_clipboard,
        create_calendar_subscription_feed,
        format_calendar_subscription_date,
        get_calendar_subscription_entity_options,
        load_calendar_subscription_manager_data,
        revoke_calendar_subscription_feed,
    } from "./calendarSubscriptionManagerLogic";
    import {
        CALENDAR_SUBSCRIPTION_LOAD_STATUS,
        CALENDAR_SUBSCRIPTION_LOADING_STATE,
        type CalendarSubscriptionLoadState,
    } from "./calendarSubscriptionManagerState";
    import {
        CALENDAR_SUBSCRIPTION_COPY_FEEDBACK_MS,
        CALENDAR_SUBSCRIPTION_MESSAGES,
        CALENDAR_SUBSCRIPTION_TEXT,
    } from "./calendarSubscriptionMessages";

    export let organization_id: string;
    export let user_id: string;

    const use_cases = get_use_cases_container();

    let existing_feeds: CalendarToken[] = [],
        teams: Team[] = [],
        competitions: Competition[] = [],
        load_state: CalendarSubscriptionLoadState =
            CALENDAR_SUBSCRIPTION_LOADING_STATE,
        is_creating = false,
        show_create_form = false,
        selected_feed_type: CalendarFeedType = CALENDAR_FEED_TYPE.ALL,
        selected_entity_id = "",
        reminder_minutes = 60,
        copy_success_token: Option<string> = create_none_option(),
        error_toast_message = "",
        error_toast_visible = false;

    onMount(() => void load_data());

    function show_error_toast(message: string): void {
        error_toast_message = message;
        error_toast_visible = true;
    }

    async function load_data(): Promise<boolean> {
        load_state = CALENDAR_SUBSCRIPTION_LOADING_STATE;
        const result = await load_calendar_subscription_manager_data({
            organization_id,
            user_id,
            use_cases,
        });
        if (!result.success) {
            load_state = {
                status: CALENDAR_SUBSCRIPTION_LOAD_STATUS.FAILED,
                message: result.error,
            };
            return false;
        }
        ({ existing_feeds, teams, competitions } = result.data);
        load_state = { status: CALENDAR_SUBSCRIPTION_LOAD_STATUS.READY };
        return true;
    }

    async function create_feed(): Promise<boolean> {
        is_creating = true;
        const result = await create_calendar_subscription_feed({
            competitions,
            organization_id,
            reminder_minutes,
            selected_feed_type,
            selected_entity_id,
            teams,
            user_id,
            use_cases,
        });
        is_creating = false;
        if (!result.success) {
            show_error_toast(result.error);
            return false;
        }
        existing_feeds = [...existing_feeds, result.data];
        show_create_form = false;
        selected_feed_type = CALENDAR_FEED_TYPE.ALL;
        selected_entity_id = "";
        return true;
    }

    async function revoke_feed(token: string): Promise<boolean> {
        const result = await revoke_calendar_subscription_feed({
            token,
            use_cases,
        });
        if (!result.success) {
            show_error_toast(result.error);
            return false;
        }
        existing_feeds = existing_feeds.filter((f) => f.token !== token);
        return true;
    }

    async function copy_to_clipboard(
        text: string,
        token: string,
    ): Promise<boolean> {
        const copied = await copy_calendar_subscription_to_clipboard(text);
        if (!copied) {
            show_error_toast(CALENDAR_SUBSCRIPTION_MESSAGES.COPY_FAILED);
            return false;
        }
        copy_success_token = create_some_option(token);
        setTimeout(() => {
            copy_success_token = create_none_option();
        }, CALENDAR_SUBSCRIPTION_COPY_FEEDBACK_MS);
        return true;
    }

    function open_webcal(token: string): void {
        window.location.href = get_current_origin_webcal_url(token);
    }
</script>

<div class="calendar-subscription-manager max-w-full">
    <div class="header">
        <h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
            {CALENDAR_SUBSCRIPTION_TEXT.TITLE}
        </h3>
        <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
            {CALENDAR_SUBSCRIPTION_TEXT.DESCRIPTION}
        </p>
    </div>

    <CalendarSubscriptionFeedList
        {copy_success_token}
        {existing_feeds}
        format_date={format_calendar_subscription_date}
        get_https_url={get_current_origin_https_url}
        {load_state}
        on_retry={() => void load_data()}
        on_copy={copy_to_clipboard}
        on_open_webcal={open_webcal}
        on_revoke={revoke_feed}
    />

    {#if load_state.status === CALENDAR_SUBSCRIPTION_LOAD_STATUS.READY}
        <CalendarSubscriptionCreateSection
            bind:show_create_form
            bind:selected_feed_type
            bind:selected_entity_id
            bind:reminder_minutes
            reminder_options={[...CALENDAR_SUBSCRIPTION_REMINDER_OPTIONS]}
            {is_creating}
            get_entity_options={() =>
                get_calendar_subscription_entity_options({
                    competitions,
                    selected_feed_type,
                    teams,
                })}
            on_show_form={() => (show_create_form = true)}
            on_hide_form={() => (show_create_form = false)}
            on_feed_type_change={() => (selected_entity_id = "")}
            on_create={() => void create_feed()}
        />
        <CalendarSubscriptionHelp />
    {/if}
</div>

<Toast
    message={error_toast_message}
    type="error"
    is_visible={error_toast_visible}
    on:dismiss={() => (error_toast_visible = false)}
/>
