<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  import type {
    CalendarFeedType,
    CalendarToken,
  } from "$lib/core/entities/CalendarToken";
  import type { Competition } from "$lib/core/entities/Competition";
  import type { Team } from "$lib/core/entities/Team";
  import { get_use_cases_container } from "$lib/infrastructure/container";

  import CalendarSubscriptionCreateSection from "./CalendarSubscriptionCreateSection.svelte";
  import CalendarSubscriptionFeedList from "./CalendarSubscriptionFeedList.svelte";
  import CalendarSubscriptionHelp from "./CalendarSubscriptionHelp.svelte";
  import {
    CALENDAR_SUBSCRIPTION_REMINDER_OPTIONS,
    copy_calendar_subscription_to_clipboard,
    create_calendar_subscription_feed,
    format_calendar_subscription_date,
    get_calendar_subscription_entity_options,
    get_calendar_subscription_https_url,
    get_calendar_subscription_webcal_url,
    load_calendar_subscription_manager_data,
    revoke_calendar_subscription_feed,
  } from "./calendarSubscriptionManagerLogic";

  export let organization_id: string;
  export let user_id: string;

  const dispatch = createEventDispatcher();
  const use_cases = get_use_cases_container();

  let existing_feeds: CalendarToken[] = [];
  let teams: Team[] = [];
  let competitions: Competition[] = [];
  let is_loading = true;
  let is_creating = false;
  let show_create_form = false;

  let selected_feed_type: CalendarFeedType = "all";
  let selected_entity_id: string | null = null;
  let reminder_minutes = 60;

  let copy_success_token: string | null = null;
  const reminder_options = [...CALENDAR_SUBSCRIPTION_REMINDER_OPTIONS];

  onMount(async () => {
    await load_data();
  });

  async function load_data(): Promise<boolean> {
    is_loading = true;
    const loaded_data = await load_calendar_subscription_manager_data({
      organization_id,
      user_id,
      use_cases,
    });
    existing_feeds = loaded_data.existing_feeds;
    teams = loaded_data.teams;
    competitions = loaded_data.competitions;
    is_loading = false;
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
    if (result.success) {
      existing_feeds = [...existing_feeds, result.token];
      show_create_form = false;
      selected_feed_type = "all";
      selected_entity_id = null;
      dispatch("feed_created", { token: result.token });
      return true;
    }
    return false;
  }

  async function revoke_feed(token: string): Promise<boolean> {
    const was_revoked = await revoke_calendar_subscription_feed({
      token,
      use_cases,
    });
    if (was_revoked) {
      existing_feeds = existing_feeds.filter((f) => f.token !== token);
      return true;
    }
    return false;
  }

  function get_https_url(token: string): string {
    return get_calendar_subscription_https_url({
      base_url: typeof window !== "undefined" ? window.location.origin : "",
      token,
    });
  }

  function get_webcal_url(token: string): string {
    return get_calendar_subscription_webcal_url({
      base_url: typeof window !== "undefined" ? window.location.origin : "",
      token,
    });
  }

  async function copy_to_clipboard(
    text: string,
    token: string,
  ): Promise<boolean> {
    const copied = await copy_calendar_subscription_to_clipboard(text);
    if (!copied) {
      return false;
    }
    copy_success_token = token;
    setTimeout(() => {
      copy_success_token = null;
    }, 2000);
    return true;
  }

  function open_webcal(token: string): void {
    const webcal_url = get_webcal_url(token);
    window.location.href = webcal_url;
  }

  function get_entity_options(): Array<{ id: string; name: string }> {
    return get_calendar_subscription_entity_options({
      competitions,
      selected_feed_type,
      teams,
    });
  }

  function handle_feed_type_change(): void {
    selected_entity_id = null;
  }

  function format_date(iso_string: string | null): string {
    return format_calendar_subscription_date(iso_string);
  }
</script>

<div class="calendar-subscription-manager">
  <div class="header">
    <h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
      Calendar Subscriptions
    </h3>
    <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
      Subscribe to your calendar in Google Calendar, Apple Calendar, Outlook, or
      any app that supports iCal feeds.
    </p>
  </div>

  <CalendarSubscriptionFeedList
    {copy_success_token}
    {existing_feeds}
    {format_date}
    {get_https_url}
    {is_loading}
    on_copy={copy_to_clipboard}
    on_open_webcal={open_webcal}
    on_revoke={revoke_feed}
  />

  {#if !is_loading}
    <CalendarSubscriptionCreateSection
      bind:show_create_form
      bind:selected_feed_type
      bind:selected_entity_id
      bind:reminder_minutes
      {reminder_options}
      {is_creating}
      {get_entity_options}
      on_show_form={() => (show_create_form = true)}
      on_hide_form={() => (show_create_form = false)}
      on_feed_type_change={handle_feed_type_change}
      on_create={create_feed}
    />
    <CalendarSubscriptionHelp />
  {/if}
</div>

<style>
  .calendar-subscription-manager {
    max-width: 100%;
  }
</style>
