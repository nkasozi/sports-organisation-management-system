<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
  import type { Fixture } from "$lib/core/entities/Fixture";
  import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
  import { auth_store } from "$lib/presentation/stores/auth";
  import OfficialRatingPanel from "$lib/presentation/components/OfficialRatingPanel.svelte";

  const fixture_use_cases = get_fixture_use_cases();

  let fixture: Fixture | null = null;
  let is_loading = true;
  let error_message = "";

  $: fixture_id = $page.params.id;
  $: current_profile = $auth_store.current_profile;
  $: can_rate_officials =
    current_profile?.role === "officials_manager" ||
    current_profile?.role === "team_manager";
  $: is_completed_fixture = fixture?.status === "completed";
  $: show_rating_section = can_rate_officials && is_completed_fixture;
  $: assigned_official_ids = (fixture?.assigned_officials ?? []).map(
    (a) => a.official_id,
  );

  async function load_fixture(): Promise<void> {
    const auth_result = await ensure_auth_profile($auth_store);
    if (!auth_result.is_authenticated) {
      goto("/sign-in");
      return;
    }

    const result = await fixture_use_cases.get_by_id(fixture_id);
    if (!result.success || !result.data) {
      error_message = result.error ?? "Fixture not found";
      is_loading = false;
      return;
    }

    fixture = result.data;
    is_loading = false;
  }

  function format_date(date_string: string): string {
    if (!date_string) return "—";
    return new Date(date_string).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function get_status_color(status: string): string {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-700",
      in_progress: "bg-amber-100 text-amber-700",
      completed: "bg-emerald-100 text-emerald-700",
      postponed: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] ?? "bg-gray-100 text-gray-600";
  }

  onMount(load_fixture);
</script>

<svelte:head>
  <title>Fixture Details - Sports Management</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-6">
  {#if is_loading}
    <p class="text-center text-gray-500 py-10">Loading fixture...</p>
  {:else if error_message}
    <p class="text-center text-red-500 py-10">{error_message}</p>
  {:else if fixture}
    <div class="mb-6">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <h1 class="text-xl font-bold text-gray-900">Fixture Details</h1>
        <span
          class="text-xs px-2 py-1 rounded-full font-medium {get_status_color(
            fixture.status,
          )}"
        >
          {fixture.status.replace("_", " ")}
        </span>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between gap-2 text-center">
          <div class="flex-1">
            <p class="font-semibold text-gray-800">
              {fixture.home_team_name ?? "Home Team"}
            </p>
            {#if fixture.status === "completed"}
              <p class="text-3xl font-bold text-gray-900">
                {fixture.home_team_score ?? 0}
              </p>
            {/if}
          </div>
          <div class="text-gray-400 font-medium text-sm">vs</div>
          <div class="flex-1">
            <p class="font-semibold text-gray-800">
              {fixture.away_team_name ?? "Away Team"}
            </p>
            {#if fixture.status === "completed"}
              <p class="text-3xl font-bold text-gray-900">
                {fixture.away_team_score ?? 0}
              </p>
            {/if}
          </div>
        </div>
        <div class="mt-3 text-sm text-gray-500 text-center space-y-1">
          <p>
            {format_date(fixture.scheduled_date)} · {fixture.scheduled_time}
          </p>
          {#if fixture.venue}<p>{fixture.venue}</p>{/if}
          {#if fixture.round_name}<p>Round: {fixture.round_name}</p>{/if}
        </div>
      </div>

      {#if fixture.assigned_officials.length > 0}
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h3 class="text-sm font-medium text-gray-700 mb-2">
            Assigned Officials
          </h3>
          <ul class="space-y-1">
            {#each fixture.assigned_officials as ao}
              <li class="text-sm text-gray-600">{ao.role_name}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    {#if show_rating_section && current_profile}
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Rate Officials</h2>
        <OfficialRatingPanel
          {fixture_id}
          organization_id={fixture.organization_id}
          rater_user_id={current_profile.id}
          rater_role={current_profile.role}
          {assigned_official_ids}
        />
      </div>
    {:else if can_rate_officials && !is_completed_fixture}
      <p class="text-sm text-gray-400 text-center py-4">
        Ratings can be submitted after the fixture is marked as completed.
      </p>
    {/if}

    <div class="flex gap-3">
      <a href="/fixtures" class="text-sm text-blue-600 underline"
        >← Back to Fixtures</a
      >
      {#if current_profile?.role === "officials_manager" || current_profile?.role === "org_admin" || current_profile?.role === "super_admin"}
        <a
          href="/fixtures/{fixture_id}/manage"
          class="text-sm text-blue-600 underline">Manage Game →</a
        >
      {/if}
    </div>
  {/if}
</div>
