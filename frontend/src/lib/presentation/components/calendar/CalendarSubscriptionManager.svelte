<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { get_use_cases_container } from "$lib/infrastructure/container";
  import type {
    CalendarToken,
    CalendarFeedType,
  } from "$lib/core/entities/CalendarToken";
  import {
    get_feed_type_display_name,
    build_ical_feed_url,
    build_webcal_feed_url,
  } from "$lib/core/entities/CalendarToken";
  import type { Team } from "$lib/core/entities/Team";
  import type { Competition } from "$lib/core/entities/Competition";

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

  const reminder_options = [
    { value: 15, label: "15 minutes before" },
    { value: 30, label: "30 minutes before" },
    { value: 60, label: "1 hour before" },
    { value: 120, label: "2 hours before" },
    { value: 1440, label: "1 day before" },
  ];

  onMount(async () => {
    await load_data();
  });

  async function load_data(): Promise<boolean> {
    is_loading = true;

    const [feeds_result, teams_result, competitions_result] = await Promise.all(
      [
        use_cases.calendar_token_use_cases.list_user_feeds(user_id),
        use_cases.team_use_cases.list({ organization_id }),
        use_cases.competition_use_cases.list({ organization_id }),
      ],
    );

    if (feeds_result.success && feeds_result.data) {
      existing_feeds = feeds_result.data.items;
    }

    if (teams_result.success && teams_result.data) {
      teams = teams_result.data;
    }

    if (competitions_result.success && competitions_result.data) {
      competitions = competitions_result.data;
    }

    is_loading = false;
    return true;
  }

  async function create_feed(): Promise<boolean> {
    is_creating = true;

    let entity_name: string | null = null;
    if (selected_feed_type === "team" && selected_entity_id) {
      const team = teams.find((t) => t.id === selected_entity_id);
      entity_name = team?.name ?? null;
    } else if (selected_feed_type === "competition" && selected_entity_id) {
      const competition = competitions.find((c) => c.id === selected_entity_id);
      entity_name = competition?.name ?? null;
    }

    const result = await use_cases.calendar_token_use_cases.create_feed(
      user_id,
      organization_id,
      selected_feed_type,
      selected_entity_id,
      entity_name,
      reminder_minutes,
    );

    is_creating = false;

    if (result.success && result.data) {
      existing_feeds = [...existing_feeds, result.data.token];
      show_create_form = false;
      selected_feed_type = "all";
      selected_entity_id = null;
      dispatch("feed_created", result.data);
      return true;
    }

    return false;
  }

  async function revoke_feed(token: string): Promise<boolean> {
    const result = await use_cases.calendar_token_use_cases.revoke_feed(token);

    if (result.success) {
      existing_feeds = existing_feeds.filter((f) => f.token !== token);
      return true;
    }

    return false;
  }

  function get_https_url(token: string): string {
    const base_url =
      typeof window !== "undefined" ? window.location.origin : "";
    return build_ical_feed_url(base_url, token);
  }

  function get_webcal_url(token: string): string {
    const base_url =
      typeof window !== "undefined" ? window.location.origin : "";
    return build_webcal_feed_url(base_url, token);
  }

  async function copy_to_clipboard(
    text: string,
    token: string,
  ): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      copy_success_token = token;
      setTimeout(() => {
        copy_success_token = null;
      }, 2000);
      return true;
    } catch {
      return false;
    }
  }

  function open_webcal(token: string): void {
    const webcal_url = get_webcal_url(token);
    window.location.href = webcal_url;
  }

  function get_entity_options(): Array<{ id: string; name: string }> {
    if (selected_feed_type === "team") {
      return teams.map((t) => ({ id: t.id, name: t.name }));
    }
    if (selected_feed_type === "competition") {
      return competitions.map((c) => ({ id: c.id, name: c.name }));
    }
    return [];
  }

  function handle_feed_type_change(): void {
    selected_entity_id = null;
  }

  function format_date(iso_string: string | null): string {
    if (!iso_string) return "Never";
    return new Date(iso_string).toLocaleDateString();
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

  {#if is_loading}
    <div class="loading-state py-8 text-center">
      <svg
        class="animate-spin h-8 w-8 mx-auto text-primary-500"
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
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p class="mt-2 text-accent-600 dark:text-accent-400">Loading feeds...</p>
    </div>
  {:else}
    <div class="existing-feeds mt-6">
      {#if existing_feeds.length === 0}
        <div
          class="empty-state py-8 text-center bg-accent-50 dark:bg-accent-800 rounded-lg"
        >
          <svg
            class="h-12 w-12 mx-auto text-accent-400"
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
          <p class="mt-2 text-accent-600 dark:text-accent-400">
            No calendar subscriptions yet
          </p>
          <p class="text-sm text-accent-500 dark:text-accent-500 mt-1">
            Create a subscription to sync events with your calendar app
          </p>
        </div>
      {:else}
        <div class="feeds-list space-y-4">
          {#each existing_feeds as feed}
            <div
              class="feed-card p-4 bg-white dark:bg-accent-800 rounded-lg border border-accent-200 dark:border-accent-700"
            >
              <div class="flex items-start justify-between">
                <div class="feed-info">
                  <h4 class="font-medium text-accent-900 dark:text-accent-100">
                    {feed.entity_name ??
                      get_feed_type_display_name(feed.feed_type)}
                  </h4>
                  <p class="text-sm text-accent-500 dark:text-accent-400 mt-1">
                    {get_feed_type_display_name(feed.feed_type)}
                    {#if feed.reminder_minutes_before}
                      • Reminder {feed.reminder_minutes_before} min before
                    {/if}
                  </p>
                  <p class="text-xs text-accent-400 dark:text-accent-500 mt-1">
                    Last accessed: {format_date(feed.last_accessed_at)}
                    • {feed.access_count} syncs
                  </p>
                </div>
                <button
                  type="button"
                  class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                  on:click={() => revoke_feed(feed.token)}
                >
                  Revoke
                </button>
              </div>

              <div class="feed-actions mt-4 space-y-2">
                <button
                  type="button"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
                  on:click={() => open_webcal(feed.token)}
                >
                  <svg
                    class="h-5 w-5"
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
                  Subscribe in Calendar App
                </button>

                <div class="url-copy-section">
                  <label
                    class="text-xs text-accent-500 dark:text-accent-400 block mb-1"
                  >
                    Or copy the feed URL:
                  </label>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      readonly
                      value={get_https_url(feed.token)}
                      class="flex-1 text-xs px-3 py-2 bg-accent-100 dark:bg-accent-700 border border-accent-200 dark:border-accent-600 rounded-md text-accent-600 dark:text-accent-300"
                    />
                    <button
                      type="button"
                      class="px-3 py-2 bg-accent-200 hover:bg-accent-300 dark:bg-accent-600 dark:hover:bg-accent-500 rounded-md transition-colors"
                      on:click={() =>
                        copy_to_clipboard(
                          get_https_url(feed.token),
                          feed.token,
                        )}
                    >
                      {#if copy_success_token === feed.token}
                        <svg
                          class="h-4 w-4 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      {:else}
                        <svg
                          class="h-4 w-4 text-accent-600 dark:text-accent-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      {/if}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="create-section mt-6">
      {#if !show_create_form}
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-accent-300 dark:border-accent-600 rounded-lg text-accent-600 dark:text-accent-400 hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-colors"
          on:click={() => (show_create_form = true)}
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
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
                class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
              >
                Feed Type
              </label>
              <select
                bind:value={selected_feed_type}
                on:change={handle_feed_type_change}
                class="select-styled w-full"
              >
                <option value="all">All Events</option>
                <option value="team">Team Schedule</option>
                <option value="competition">Competition Schedule</option>
              </select>
            </div>

            {#if selected_feed_type !== "all"}
              <div>
                <label
                  class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
                >
                  {selected_feed_type === "team"
                    ? "Select Team"
                    : "Select Competition"}
                </label>
                <select
                  bind:value={selected_entity_id}
                  class="select-styled w-full"
                >
                  <option value={null}>-- Select --</option>
                  {#each get_entity_options() as option}
                    <option value={option.id}>{option.name}</option>
                  {/each}
                </select>
              </div>
            {/if}

            <div>
              <label
                class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-1"
              >
                Default Reminder
              </label>
              <select
                bind:value={reminder_minutes}
                class="select-styled w-full"
              >
                {#each reminder_options as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              <p class="text-xs text-accent-500 dark:text-accent-400 mt-1">
                Your calendar app will show notifications before each event
              </p>
            </div>
          </div>

          <div class="form-actions mt-6 flex gap-3">
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-accent-200 hover:bg-accent-300 dark:bg-accent-600 dark:hover:bg-accent-500 text-accent-700 dark:text-accent-200 rounded-md transition-colors"
              on:click={() => (show_create_form = false)}
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={is_creating ||
                (selected_feed_type !== "all" && !selected_entity_id)}
              on:click={create_feed}
            >
              {#if is_creating}
                Creating...
              {:else}
                Create Subscription
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </div>

    <div class="help-text mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <h4
        class="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        How it works
      </h4>
      <ul class="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
        <li>
          <strong>Subscribe button:</strong> Opens your default calendar app to add
          the subscription
        </li>
        <li>
          <strong>Feed URL:</strong> Copy and paste into your calendar app's "Subscribe
          to Calendar" option
        </li>
        <li>
          <strong>Automatic updates:</strong> Your calendar will periodically check
          for new events
        </li>
        <li>
          <strong>Reminders:</strong> Get notified before each event based on your
          settings
        </li>
      </ul>
    </div>
  {/if}
</div>

<style>
  .calendar-subscription-manager {
    max-width: 100%;
  }
</style>
