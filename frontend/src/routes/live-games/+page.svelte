<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import type { Fixture } from '$lib/core/entities/Fixture';
  import { check_fixture_can_start, auto_generate_lineups_if_possible } from '$lib/core/services/fixtureStartChecks';
  import type { PreFlightCheck } from '$lib/core/services/fixtureStartChecks';
  import { get_fixture_use_cases } from '$lib/core/usecases/FixtureUseCases';
  import { get_fixture_official_use_cases } from '$lib/core/usecases/FixtureOfficialUseCases';
  import { get_fixture_lineup_use_cases } from '$lib/core/usecases/FixtureLineupUseCases';
  import { get_player_team_membership_use_cases } from '$lib/core/usecases/PlayerTeamMembershipUseCases';
  import { get_team_use_cases } from '$lib/core/usecases/TeamUseCases';
  import { get_sport_use_cases } from '$lib/core/usecases/SportUseCases';
  import { get_competition_use_cases } from '$lib/core/usecases/CompetitionUseCases';
  import { get_organization_use_cases } from '$lib/core/usecases/OrganizationUseCases';

  const fixture_use_cases = get_fixture_use_cases();
  const fixture_official_use_cases = get_fixture_official_use_cases();
  const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
  const membership_use_cases = get_player_team_membership_use_cases();
  const team_use_cases = get_team_use_cases();
  const sport_use_cases = get_sport_use_cases();
  const competition_use_cases = get_competition_use_cases();
  const organization_use_cases = get_organization_use_cases();

  let incomplete_fixtures: Fixture[] = [];
  let is_loading = true;
  let current_checks: Record<string, PreFlightCheck[]> = {};
  let is_starting: Record<string, boolean> = {};
  let team_names: Record<string, string> = {};
  let competition_names: Record<string, string> = {};
  let sport_names: Record<string, string> = {};

  onMount(async () => {
    if (!browser) return;
    const loaded_fixtures = await load_incomplete_fixtures();
    team_names = await load_team_names_for_fixtures(loaded_fixtures);
    const competition_sport_data = await load_competition_and_sport_names_for_fixtures(loaded_fixtures);
    competition_names = competition_sport_data.competition_names;
    sport_names = competition_sport_data.sport_names;
    incomplete_fixtures = loaded_fixtures;
    is_loading = false;
  });

  async function load_team_names_for_fixtures(fixtures: Fixture[]): Promise<Record<string, string>> {
    const names_record: Record<string, string> = {};
    const team_ids_to_fetch = new Set<string>();

    for (const fixture of fixtures) {
      if (fixture.home_team_id) team_ids_to_fetch.add(fixture.home_team_id);
      if (fixture.away_team_id) team_ids_to_fetch.add(fixture.away_team_id);
    }

    for (const team_id of team_ids_to_fetch) {
      const team_result = await team_use_cases.get_by_id(team_id);
      if (team_result.success && team_result.data) {
        names_record[team_id] = team_result.data.name;
      } else {
        names_record[team_id] = 'Unknown Team';
      }
    }

    return names_record;
  }

  function get_team_name(team_id: string): string {
    return team_names[team_id] || 'Unknown Team';
  }

  interface CompetitionSportData {
    competition_names: Record<string, string>;
    sport_names: Record<string, string>;
  }

  async function load_competition_and_sport_names_for_fixtures(fixtures: Fixture[]): Promise<CompetitionSportData> {
    const comp_names: Record<string, string> = {};
    const sprt_names: Record<string, string> = {};
    const competition_ids_to_fetch = new Set<string>();

    for (const fixture of fixtures) {
      if (fixture.competition_id) competition_ids_to_fetch.add(fixture.competition_id);
    }

    for (const competition_id of competition_ids_to_fetch) {
      const comp_result = await competition_use_cases.get_by_id(competition_id);
      if (!comp_result.success || !comp_result.data) {
        comp_names[competition_id] = 'Unknown Competition';
        continue;
      }

      comp_names[competition_id] = comp_result.data.name;

      const org_result = await organization_use_cases.get_by_id(comp_result.data.organization_id);
      if (!org_result.success || !org_result.data) {
        sprt_names[competition_id] = 'Unknown Sport';
        continue;
      }

      const sport_result = await sport_use_cases.get_by_id(org_result.data.sport_id);
      if (sport_result.success && sport_result.data) {
        sprt_names[competition_id] = sport_result.data.name;
      } else {
        sprt_names[competition_id] = 'Unknown Sport';
      }
    }

    return { competition_names: comp_names, sport_names: sprt_names };
  }

  function get_competition_name(competition_id: string): string {
    return competition_names[competition_id] || 'Unknown Competition';
  }

  function get_sport_name(competition_id: string): string {
    return sport_names[competition_id] || 'Unknown Sport';
  }

  async function load_incomplete_fixtures(): Promise<Fixture[]> {
    const all_fixtures_result = await fixture_use_cases.list();

    if (!all_fixtures_result.success || !all_fixtures_result.data) {
      return [];
    }

    return all_fixtures_result.data.filter(
      (fixture: Fixture) => fixture.status !== 'completed' && fixture.status !== 'cancelled'
    );
  }

  function update_checks(fixture_id: string, checks: PreFlightCheck[]): void {
    current_checks = { ...current_checks, [fixture_id]: [...checks] };
  }

  function set_is_starting(fixture_id: string, value: boolean): void {
    is_starting = { ...is_starting, [fixture_id]: value };
  }

  async function start_fixture(fixture: Fixture): Promise<void> {
    console.log('[DEBUG] start_fixture called for fixture:', fixture.id);

    if (!fixture.id) {
      console.log('[DEBUG] No fixture ID, returning early');
      return;
    }

    set_is_starting(fixture.id, true);
    update_checks(fixture.id, []);

    const checks: PreFlightCheck[] = [];

    checks.push({
      check_name: 'officials',
      status: 'checking',
      message: 'Checking fixture officials...',
      fix_suggestion: null
    });
    update_checks(fixture.id, checks);

    console.log('[DEBUG] Running pre-flight checks...');

    const officials_check = await check_fixture_can_start(
      fixture,
      fixture_official_use_cases,
      fixture_lineup_use_cases
    );

    console.log('[DEBUG] Officials check result:', officials_check);

    if (officials_check.officials_check.status === 'failed') {
      checks[checks.length - 1] = officials_check.officials_check;
      update_checks(fixture.id, checks);
      set_is_starting(fixture.id, false);
      return;
    }

    checks[checks.length - 1] = officials_check.officials_check;
    update_checks(fixture.id, checks);

    checks.push({
      check_name: 'home_lineup',
      status: 'checking',
      message: 'Checking home team lineup...',
      fix_suggestion: null
    });
    update_checks(fixture.id, checks);

    if (officials_check.home_lineup_check.status === 'failed') {
      const team_result = await team_use_cases.get_by_id(fixture.home_team_id);
      const team_name = team_result.success && team_result.data ? team_result.data.name : 'Home Team';

      checks.push({
        check_name: 'auto_generate_home',
        status: 'checking',
        message: 'Attempting to auto-generate lineup for ' + team_name + '...',
        fix_suggestion: null
      });
      update_checks(fixture.id, checks);

      const auto_gen_result = await auto_generate_lineups_if_possible(
        fixture,
        fixture.home_team_id,
        team_name,
        membership_use_cases,
        fixture_lineup_use_cases,
        competition_use_cases,
        organization_use_cases,
        sport_use_cases
      );

      if (!auto_gen_result.success) {
        checks[checks.length - 1] = {
          check_name: 'home_lineup',
          status: 'failed',
          message: auto_gen_result.error_message || 'Failed to auto-generate home team lineup',
          fix_suggestion: (auto_gen_result.fix_suggestion || null) as string | null
        };
        update_checks(fixture.id, checks);
        set_is_starting(fixture.id, false);
        return;
      }

      checks[checks.length - 1] = {
        check_name: 'home_lineup',
        status: 'passed',
        message: 'Auto-generated lineup for ' + team_name,
        fix_suggestion: null
      };
    } else {
      checks[checks.length - 1] = officials_check.home_lineup_check;
    }
    update_checks(fixture.id, checks);

    checks.push({
      check_name: 'away_lineup',
      status: 'checking',
      message: 'Checking away team lineup...',
      fix_suggestion: null
    });
    update_checks(fixture.id, checks);

    if (officials_check.away_lineup_check.status === 'failed') {
      const team_result = await team_use_cases.get_by_id(fixture.away_team_id);
      const team_name = team_result.success && team_result.data ? team_result.data.name : 'Away Team';

      checks.push({
        check_name: 'auto_generate_away',
        status: 'checking',
        message: 'Attempting to auto-generate lineup for ' + team_name + '...',
        fix_suggestion: null
      });
      update_checks(fixture.id, checks);

      const auto_gen_result = await auto_generate_lineups_if_possible(
        fixture,
        fixture.away_team_id,
        team_name,
        membership_use_cases,
        fixture_lineup_use_cases,
        competition_use_cases,
        organization_use_cases,
        sport_use_cases
      );

      if (!auto_gen_result.success) {
        checks[checks.length - 1] = {
          check_name: 'away_lineup',
          status: 'failed',
          message: auto_gen_result.error_message || 'Failed to auto-generate away team lineup',
          fix_suggestion: (auto_gen_result.fix_suggestion || null) as string | null
        };
        update_checks(fixture.id, checks);
        set_is_starting(fixture.id, false);
        return;
      }

      checks[checks.length - 1] = {
        check_name: 'away_lineup',
        status: 'passed',
        message: 'Auto-generated lineup for ' + team_name,
        fix_suggestion: null
      };
    } else {
      checks[checks.length - 1] = officials_check.away_lineup_check;
    }
    update_checks(fixture.id, checks);

    set_is_starting(fixture.id, false);

    console.log('[DEBUG] All checks passed, navigating to live game page');
    await goto('/live-games/' + fixture.id);
  }

  function format_date_time(date_time: string): string {
    return new Date(date_time).toLocaleString();
  }

  function get_status_badge_class(status: string): string {
    const base_classes = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'scheduled':
        return base_classes + ' bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'in_progress':
        return base_classes + ' bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300';
      case 'postponed':
        return base_classes + ' bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      default:
        return base_classes + ' bg-accent-100 text-accent-800 dark:bg-accent-700 dark:text-accent-200';
    }
  }

  function get_check_icon(status: string): string {
    switch (status) {
      case 'passed':
        return '✓';
      case 'failed':
        return '✗';
      case 'checking':
        return '⟳';
      default:
        return '○';
    }
  }

  function get_check_class(status: string): string {
    switch (status) {
      case 'passed':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400 font-bold';
      case 'checking':
        return 'text-blue-600 dark:text-blue-400 animate-spin';
      default:
        return 'text-accent-400 dark:text-accent-500';
    }
  }

  function get_check_container_class(status: string): string {
    switch (status) {
      case 'failed':
        return 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3';
      default:
        return '';
    }
  }

  function handle_start_click(fixture: Fixture): void {
    console.log('[DEBUG] Button clicked for fixture:', fixture.id);
    start_fixture(fixture);
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2 text-accent-900 dark:text-white">Live Game Management</h1>
    <p class="text-accent-600 dark:text-accent-300">Start and manage fixtures in real-time</p>
  </div>

  {#if is_loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
    </div>
  {:else if incomplete_fixtures.length === 0}
    <div class="bg-accent-50 dark:bg-accent-800 rounded-lg p-8 text-center">
      <p class="text-accent-600 dark:text-accent-300 mb-4">No incomplete fixtures found</p>
      <a href="/fixtures" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
        Create a new fixture
      </a>
    </div>
  {:else}
    <div class="space-y-4">
      {#each incomplete_fixtures as fixture (fixture.id)}
        <div class="bg-white dark:bg-accent-800 rounded-lg shadow-md p-6 border border-accent-200 dark:border-accent-700">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold text-accent-900 dark:text-white">
                  {get_team_name(fixture.home_team_id)} vs {get_team_name(fixture.away_team_id)}
                </h3>
                <span class={get_status_badge_class(fixture.status)}>
                  {fixture.status}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-2 text-sm text-accent-600 dark:text-accent-300 mb-1">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full text-xs font-medium">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  {get_competition_name(fixture.competition_id)}
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full text-xs font-medium">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {get_sport_name(fixture.competition_id)}
                </span>
              </div>
              <p class="text-sm text-accent-600 dark:text-accent-300">
                {format_date_time(fixture.scheduled_date)}
              </p>
              {#if fixture.venue}
                <p class="text-sm text-accent-500 dark:text-accent-400">Venue: {fixture.venue}</p>
              {/if}
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                on:click={() => handle_start_click(fixture)}
                disabled={is_starting[fixture.id || '']}
                class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-accent-400 dark:disabled:bg-accent-600 disabled:cursor-not-allowed transition-colors"
              >
                {#if is_starting[fixture.id || '']}
                  <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting...
                {:else}
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                  </svg>
                  Start Game
                {/if}
              </button>
            </div>
          </div>

          {#if current_checks[fixture.id || ''] && current_checks[fixture.id || ''].length > 0}
            <div class="mt-4 pt-4 border-t border-accent-200 dark:border-accent-700">
              <h4 class="text-sm font-medium mb-2 text-accent-800 dark:text-accent-200">Pre-flight Checks:</h4>
              <div class="space-y-2">
                {#each current_checks[fixture.id || ''] as check}
                  <div class="flex items-start gap-2 {get_check_container_class(check.status)}">
                    <span class="text-lg {get_check_class(check.status)}">
                      {get_check_icon(check.status)}
                    </span>
                    <div class="flex-1">
                      <p class="text-sm {check.status === 'failed' ? 'text-red-700 dark:text-red-300 font-medium' : 'text-accent-700 dark:text-accent-300'}">{check.message}</p>
                      {#if check.fix_suggestion}
                        <p class="text-xs {check.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-accent-600 dark:text-accent-400'} mt-1">
                          💡 {check.fix_suggestion}
                        </p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
