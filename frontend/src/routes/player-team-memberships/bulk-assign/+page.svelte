<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { get } from "svelte/store";
  import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
  import type { Player } from "$lib/core/entities/Player";
  import type { Team } from "$lib/core/entities/Team";
  import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
  import {
    get_player_avatar,
    get_player_full_name,
  } from "$lib/core/entities/Player";
  import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_player_team_membership_use_cases } from "$lib/core/usecases/PlayerTeamMembershipUseCases";
  import { get_gender_use_cases } from "$lib/core/usecases/GenderUseCases";
  import Toast from "$lib/presentation/components/ui/Toast.svelte";
  import { auth_store } from "$lib/presentation/stores/auth";
  import { access_denial_store } from "$lib/presentation/stores/accessDenial";
  import {
    build_authorization_list_filter,
    type UserScopeProfile,
  } from "$lib/core/interfaces/ports";
  import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";

  const player_use_cases = get_player_use_cases();
  const team_use_cases = get_team_use_cases();
  const membership_use_cases = get_player_team_membership_use_cases();
  const gender_use_cases = get_gender_use_cases();

  interface PlayerAssignment {
    player: Player;
    selected: boolean;
    jersey_number: number;
    start_date: string;
    current_team_name: string | null;
    current_team_id: string | null;
  }

  let teams: Team[] = [];
  let selected_team_id: string = "";
  let all_player_assignments: PlayerAssignment[] = [];
  let gender_name_map: Map<string, string> = new Map();
  let is_loading: boolean = true;
  let is_saving: boolean = false;
  let error_message: string = "";
  let search_query: string = "";

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  $: selected_team = teams.find((t) => t.id === selected_team_id) || null;
  $: gender_filtered_assignments = filter_assignments_by_team_gender(
    all_player_assignments,
    selected_team,
  );
  $: unassigned_players = gender_filtered_assignments.filter(
    (p) => p.current_team_id === null,
  );
  $: assigned_players_on_other_teams = gender_filtered_assignments.filter(
    (p) => p.current_team_id !== null && p.current_team_id !== selected_team_id,
  );
  $: filtered_unassigned_players = filter_players_by_name(
    unassigned_players,
    search_query,
  );
  $: filtered_assigned_players = filter_players_by_name(
    assigned_players_on_other_teams,
    search_query,
  );
  $: selected_count = count_selected_players(
    unassigned_players,
    assigned_players_on_other_teams,
  );
  $: gender_filter_active = !!(selected_team?.gender_id);
  $: target_gender_label = selected_team?.gender_id
    ? (gender_name_map.get(selected_team.gender_id) ?? "Unknown") + " only"
    : "";

  function filter_assignments_by_team_gender(
    assignments: PlayerAssignment[],
    team: (typeof teams)[number] | null,
  ): PlayerAssignment[] {
    if (!team?.gender_id) return assignments;
    return assignments.filter(
      (a) => !a.player.gender_id || a.player.gender_id === team.gender_id,
    );
  }

  function filter_players_by_name(
    assignments: PlayerAssignment[],
    query: string,
  ): PlayerAssignment[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return assignments;
    return assignments.filter((a) =>
      get_player_full_name(a.player).toLowerCase().includes(trimmed),
    );
  }
  $: can_save = selected_count > 0 && selected_team_id !== "";

  function count_selected_players(
    unassigned: PlayerAssignment[],
    assigned: PlayerAssignment[],
  ): number {
    const unassigned_count = unassigned.filter((p) => p.selected).length;
    const assigned_count = assigned.filter((p) => p.selected).length;
    return unassigned_count + assigned_count;
  }

  function get_today_date(): string {
    return new Date().toISOString().split("T")[0];
  }

  function build_auth_filter(): Record<string, string> {
    const auth_state = get(auth_store);
    if (!auth_state.current_profile) return {};
    const entity_fields = ["organization_id", "team_id"];
    return build_authorization_list_filter(
      auth_state.current_profile as UserScopeProfile,
      entity_fields,
    );
  }

  onMount(async () => {
    if (!browser) return;
    const auth_result = await ensure_auth_profile();
    if (!auth_result.success) {
      error_message = auth_result.error_message;
      is_loading = false;
      return;
    }

    const auth_state = get(auth_store);
    if (auth_state.current_token) {
      const authorization_check =
        await get_authorization_adapter().check_entity_authorized(
          auth_state.current_token.raw_token,
          "playerteammembership",
          "create",
        );

      if (!authorization_check.success) return;
      if (!authorization_check.data.is_authorized) {
        access_denial_store.set_denial(
          "/player-team-memberships/bulk-assign",
          "Access denied: Your role does not have permission to assign players to teams. Please contact your organization administrator if you believe this is an error.",
        );
        goto("/");
        return;
      }
    }

    await load_initial_data();
  });

  async function load_initial_data(): Promise<void> {
    is_loading = true;
    error_message = "";

    const auth_filter = build_auth_filter();
    const [teams_result, players_result, memberships_result] =
      await Promise.all([
        team_use_cases.list(auth_filter, { page_number: 1, page_size: 200 }),
        player_use_cases.list(auth_filter, { page_number: 1, page_size: 500 }),
        membership_use_cases.list(auth_filter, {
          page_number: 1,
          page_size: 1000,
        }),
      ]);

    if (!teams_result.success) {
      error_message = "Failed to load teams";
      is_loading = false;
      return;
    }

    if (!players_result.success) {
      error_message = "Failed to load players";
      is_loading = false;
      return;
    }

    teams = teams_result.data;

    const genders_result = await gender_use_cases.list({}, { page_number: 1, page_size: 50 });
    if (genders_result.success) {
      gender_name_map = new Map(genders_result.data.items.map((g) => [g.id, g.name]));
    }
    const all_players = players_result.data;
    const all_memberships = memberships_result.success
      ? memberships_result.data
      : [];

    all_player_assignments = build_player_assignments(
      all_players,
      all_memberships,
      teams,
    );

    is_loading = false;
  }

  function build_player_assignments(
    players: Player[],
    memberships: PlayerTeamMembership[],
    all_teams: Team[],
  ): PlayerAssignment[] {
    const team_name_by_id = new Map<string, string>(
      all_teams.map((t) => [t.id, t.name]),
    );
    const active_membership_by_player = new Map<string, PlayerTeamMembership>();

    for (const membership of memberships) {
      if (membership.status === "active") {
        active_membership_by_player.set(membership.player_id, membership);
      }
    }

    const assignments: PlayerAssignment[] = [];
    const today = get_today_date();
    let next_jersey = 1;

    for (const player of players) {
      const active_membership = active_membership_by_player.get(player.id);

      const assignment: PlayerAssignment = {
        player,
        selected: false,
        jersey_number: next_jersey++,
        start_date: today,
        current_team_name: active_membership
          ? team_name_by_id.get(active_membership.team_id) || "Unknown Team"
          : null,
        current_team_id: active_membership?.team_id || null,
      };

      assignments.push(assignment);
    }

    return assignments;
  }

  function toggle_player_selection(assignment: PlayerAssignment): void {
    assignment.selected = !assignment.selected;
    all_player_assignments = [...all_player_assignments];
  }

  function select_all_unassigned(): void {
    for (const assignment of all_player_assignments) {
      if (assignment.current_team_id === null) {
        assignment.selected = true;
      }
    }
    all_player_assignments = [...all_player_assignments];
  }

  function deselect_all(): void {
    for (const assignment of all_player_assignments) {
      assignment.selected = false;
    }
    all_player_assignments = [...all_player_assignments];
  }

  async function handle_save(): Promise<void> {
    if (!can_save) return;

    is_saving = true;
    let success_count = 0;
    let error_count = 0;

    const all_selected = [
      ...unassigned_players.filter((p) => p.selected),
      ...assigned_players_on_other_teams.filter((p) => p.selected),
    ];

    for (const assignment of all_selected) {
      const input = {
        organization_id: selected_team?.organization_id || "",
        player_id: assignment.player.id,
        team_id: selected_team_id,
        start_date: assignment.start_date,
        jersey_number: assignment.jersey_number,
        status: "active" as const,
      };

      const result = await membership_use_cases.create(input);
      if (result.success) {
        success_count++;
      } else {
        error_count++;
        console.error(
          `Failed to create membership for ${get_player_full_name(assignment.player)}: ${result.error}`,
        );
      }
    }

    is_saving = false;

    if (error_count === 0) {
      show_toast(
        `Successfully assigned ${success_count} player(s) to ${selected_team?.name}`,
        "success",
      );
      setTimeout(() => goto("/player-team-memberships"), 1500);
    } else {
      show_toast(
        `Assigned ${success_count} player(s), but ${error_count} failed. Some players may already be on this team.`,
        "error",
      );
    }
  }

  function handle_cancel(): void {
    goto("/player-team-memberships");
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info",
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }
</script>

<svelte:head>
  <title>Bulk Assign Players to Team - Sports Management</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700"
      on:click={handle_cancel}
      aria-label="Go back"
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
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
    </button>
    <div class="flex-1">
      <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        Bulk Assign Players to Team
      </h1>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Select players and assign them to a team in one action
      </p>
    </div>
  </div>

  {#if is_loading}
    <div class="flex justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"
      ></div>
    </div>
  {:else if error_message}
    <div
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
    >
      <p class="text-red-800 dark:text-red-200">{error_message}</p>
    </div>
  {:else}
    <div
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-4 sm:p-6"
    >
      <div class="space-y-4">
        <div>
          <label
            for="team_select"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
          >
            Select Target Team *
          </label>
          <select
            id="team_select"
            bind:value={selected_team_id}
            class="w-full px-3 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
          >
            <option value="">-- Select a team --</option>
            {#each teams as team}
              <option value={team.id}>{team.name}</option>
            {/each}
          </select>
        </div>

        {#if selected_team_id}
          <div
            class="flex flex-wrap gap-2 items-center border-t border-accent-200 dark:border-accent-700 pt-4"
          >
            <button
              type="button"
              class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              on:click={select_all_unassigned}
            >
              Select All Unassigned
            </button>
            <span class="text-accent-400">|</span>
            <button
              type="button"
              class="text-sm text-accent-600 hover:text-accent-700 dark:text-accent-400"
              on:click={deselect_all}
            >
              Deselect All
            </button>
            <span class="flex-1"></span>
            <span class="text-sm text-accent-600 dark:text-accent-400">
              {selected_count} player(s) selected
            </span>
          </div>
          <div class="relative mt-3">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Search players by name..."
              bind:value={search_query}
              class="w-full pl-9 pr-4 py-2 border border-accent-300 dark:border-accent-600 rounded-lg bg-white dark:bg-accent-700 text-sm text-accent-900 dark:text-accent-100 placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        {/if}
      </div>
    </div>

    {#if selected_team_id}
      <div
        class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
      >
        <div class="p-4 border-b border-accent-200 dark:border-accent-700">
          <div class="flex items-center gap-2 flex-wrap">
            <h2
              class="text-lg font-semibold text-accent-900 dark:text-accent-100"
            >
              Players Without a Team ({unassigned_players.length})
            </h2>
            {#if gender_filter_active}
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                {target_gender_label}
              </span>
            {/if}
          </div>
          <p class="text-sm text-accent-600 dark:text-accent-400">
            These players are not currently assigned to any team
          </p>
        </div>
        <div class="divide-y divide-accent-200 dark:divide-accent-700">
          {#if filtered_unassigned_players.length === 0}
            <div class="p-6 text-center text-accent-500 dark:text-accent-400 text-sm">
              {search_query ? "No unassigned players match your search." : "All players are currently assigned to a team."}
            </div>
          {:else}
            {#each filtered_unassigned_players as assignment}
              <div
                class="p-4 flex items-center gap-4 hover:bg-accent-50 dark:hover:bg-accent-700/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={assignment.selected}
                  on:change={() => toggle_player_selection(assignment)}
                  class="w-5 h-5 text-primary-600 rounded border-accent-300"
                />
                <img
                  src={get_player_avatar(assignment.player)}
                  alt={get_player_full_name(assignment.player)}
                  class="w-10 h-10 rounded-full object-cover border-2 border-accent-200 dark:border-accent-600"
                />
                <div class="flex-1 min-w-0">
                  <p
                    class="font-medium text-accent-900 dark:text-accent-100 truncate"
                  >
                    {get_player_full_name(assignment.player)}
                  </p>
                  <p class="text-sm text-green-600 dark:text-green-400">
                    Available
                  </p>
                </div>
                {#if assignment.selected}
                  <div class="flex items-center gap-3">
                    <div>
                      <span
                        class="block text-xs text-accent-600 dark:text-accent-400 mb-1"
                        >Jersey #</span
                      >
                      <input
                        type="number"
                        min="1"
                        max="99"
                        bind:value={assignment.jersey_number}
                        aria-label="Jersey number for {get_player_full_name(
                          assignment.player,
                        )}"
                        class="w-16 px-2 py-1 text-sm border border-accent-300 dark:border-accent-600 rounded bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
                      />
                    </div>
                    <div>
                      <span
                        class="block text-xs text-accent-600 dark:text-accent-400 mb-1"
                        >Start Date</span
                      >
                      <input
                        type="date"
                        bind:value={assignment.start_date}
                        aria-label="Start date for {get_player_full_name(
                          assignment.player,
                        )}"
                        class="px-2 py-1 text-sm border border-accent-300 dark:border-accent-600 rounded bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <div
        class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
      >
        <div class="p-4 border-b border-accent-200 dark:border-accent-700">
          <div class="flex items-center gap-2 flex-wrap">
            <h2
              class="text-lg font-semibold text-accent-900 dark:text-accent-100"
            >
              Players Already on Other Teams ({assigned_players_on_other_teams.length})
            </h2>
            {#if gender_filter_active}
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                {target_gender_label}
              </span>
            {/if}
          </div>
          <p class="text-sm text-accent-600 dark:text-accent-400">
            Selecting these will create an additional team membership
          </p>
        </div>
        <div class="divide-y divide-accent-200 dark:divide-accent-700">
          {#if filtered_assigned_players.length === 0}
            <div class="p-6 text-center text-accent-500 dark:text-accent-400 text-sm">
              {search_query ? "No players on other teams match your search." : "No players are currently on other teams."}
            </div>
          {:else}
            {#each filtered_assigned_players as assignment}
              <div
                class="p-4 flex items-center gap-4 hover:bg-accent-50 dark:hover:bg-accent-700/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={assignment.selected}
                  on:change={() => toggle_player_selection(assignment)}
                  class="w-5 h-5 text-primary-600 rounded border-accent-300"
                />
                <img
                  src={get_player_avatar(assignment.player)}
                  alt={get_player_full_name(assignment.player)}
                  class="w-10 h-10 rounded-full object-cover border-2 border-accent-200 dark:border-accent-600"
                />
                <div class="flex-1 min-w-0">
                  <p
                    class="font-medium text-accent-900 dark:text-accent-100 truncate"
                  >
                    {get_player_full_name(assignment.player)}
                  </p>
                  <p class="text-sm text-violet-600 dark:text-violet-400">
                    Currently on: {assignment.current_team_name}
                  </p>
                </div>
                {#if assignment.selected}
                  <div class="flex items-center gap-3">
                    <div>
                      <span
                        class="block text-xs text-accent-600 dark:text-accent-400 mb-1"
                        >Jersey #</span
                      >
                      <input
                        type="number"
                        min="1"
                        max="99"
                        bind:value={assignment.jersey_number}
                        aria-label="Jersey number for {get_player_full_name(
                          assignment.player,
                        )}"
                        class="w-16 px-2 py-1 text-sm border border-accent-300 dark:border-accent-600 rounded bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
                      />
                    </div>
                    <div>
                      <span
                        class="block text-xs text-accent-600 dark:text-accent-400 mb-1"
                        >Start Date</span
                      >
                      <input
                        type="date"
                        bind:value={assignment.start_date}
                        aria-label="Start date for {get_player_full_name(
                          assignment.player,
                        )}"
                        class="px-2 py-1 text-sm border border-accent-300 dark:border-accent-600 rounded bg-white dark:bg-accent-700 text-accent-900 dark:text-accent-100"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {:else}
      <div
        class="bg-accent-50 dark:bg-accent-800/50 rounded-lg p-8 text-center"
      >
        <p class="text-accent-600 dark:text-accent-400">
          Select a team above to see available players
        </p>
      </div>
    {/if}

    <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
      <button
        type="button"
        class="btn btn-outline"
        on:click={handle_cancel}
        disabled={is_saving}
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary-action"
        on:click={handle_save}
        disabled={!can_save || is_saving}
      >
        {#if is_saving}
          <span class="flex items-center justify-center">
            <span
              class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"
            ></span>
            Saving...
          </span>
        {:else}
          Assign {selected_count} Player(s) to Team
        {/if}
      </button>
    </div>
  {/if}
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
