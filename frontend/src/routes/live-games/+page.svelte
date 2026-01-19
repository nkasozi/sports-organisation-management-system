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

  const fixture_use_cases = get_fixture_use_cases();
  const fixture_official_use_cases = get_fixture_official_use_cases();
  const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
  const membership_use_cases = get_player_team_membership_use_cases();
  const team_use_cases = get_team_use_cases();
  const sport_use_cases = get_sport_use_cases();

  let incomplete_fixtures: Fixture[] = [];
  let is_loading = true;
  let current_checks: Map<string, PreFlightCheck[]> = new Map();
  let is_starting: Map<string, boolean> = new Map();

  onMount(async () => {
    if (!browser) return;
    incomplete_fixtures = await load_incomplete_fixtures();
    is_loading = false;
  });

  async function load_incomplete_fixtures(): Promise<Fixture[]> {
    const all_fixtures_result = await fixture_use_cases.list();

    if (!all_fixtures_result.success || !all_fixtures_result.data) {
      return [];
    }

    return all_fixtures_result.data.filter(
      (fixture: Fixture) => fixture.status !== 'completed' && fixture.status !== 'cancelled'
    );
  }

  async function start_fixture(fixture: Fixture): Promise<void> {
    if (!fixture.id) return;

    is_starting.set(fixture.id, true);
    current_checks.set(fixture.id, []);

    const checks: PreFlightCheck[] = [];

    checks.push({
      check_name: 'officials',
      status: 'checking',
      message: 'Checking fixture officials...',
      fix_suggestion: null
    });
    current_checks.set(fixture.id, [...checks]);

    const officials_check = await check_fixture_can_start(
      fixture,
      fixture_official_use_cases,
      fixture_lineup_use_cases
    );

    if (officials_check.officials_check.status === 'failed') {
      checks[checks.length - 1] = officials_check.officials_check;
      current_checks.set(fixture.id, [...checks]);
      is_starting.set(fixture.id, false);
      return;
    }

    checks[checks.length - 1] = officials_check.officials_check;
    current_checks.set(fixture.id, [...checks]);

    checks.push({
      check_name: 'home_lineup',
      status: 'checking',
      message: 'Checking home team lineup...',
      fix_suggestion: null
    });
    current_checks.set(fixture.id, [...checks]);

    if (officials_check.home_lineup_check.status === 'failed') {
      const team_result = await team_use_cases.get_by_id(fixture.home_team_id);
      const team_name = team_result.success && team_result.data ? team_result.data.name : 'Home Team';

      checks.push({
        check_name: 'auto_generate_home',
        status: 'checking',
        message: `Attempting to auto-generate lineup for ${team_name}...`,
        fix_suggestion: null
      });
      current_checks.set(fixture.id, [...checks]);

      const auto_gen_result = await auto_generate_lineups_if_possible(
        fixture,
        fixture.home_team_id,
        membership_use_cases,
        fixture_lineup_use_cases,
        sport_use_cases
      );

      if (!auto_gen_result.success) {
        checks[checks.length - 1] = {
          check_name: 'home_lineup',
          status: 'failed',
          message: auto_gen_result.error_message || 'Failed to auto-generate home team lineup',
          fix_suggestion: (auto_gen_result.fix_suggestion || null) as string | null
        };
        current_checks.set(fixture.id, [...checks]);
        is_starting.set(fixture.id, false);
        return;
      }

      checks[checks.length - 1] = {
        check_name: 'home_lineup',
        status: 'passed',
        message: `Auto-generated lineup for ${team_name}`,
        fix_suggestion: null
      };
    } else {
      checks[checks.length - 1] = officials_check.home_lineup_check;
    }
    current_checks.set(fixture.id, [...checks]);

    checks.push({
      check_name: 'away_lineup',
      status: 'checking',
      message: 'Checking away team lineup...',
      fix_suggestion: null
    });
    current_checks.set(fixture.id, [...checks]);

    if (officials_check.away_lineup_check.status === 'failed') {
      const team_result = await team_use_cases.get_by_id(fixture.away_team_id);
      const team_name = team_result.success && team_result.data ? team_result.data.name : 'Away Team';

      checks.push({
        check_name: 'auto_generate_away',
        status: 'checking',
        message: `Attempting to auto-generate lineup for ${team_name}...`,
        fix_suggestion: null
      });
      current_checks.set(fixture.id, [...checks]);

      const auto_gen_result = await auto_generate_lineups_if_possible(
        fixture,
        fixture.away_team_id,
        membership_use_cases,
        fixture_lineup_use_cases,
        sport_use_cases
      );

      if (!auto_gen_result.success) {
        checks[checks.length - 1] = {
          check_name: 'away_lineup',
          status: 'failed',
          message: auto_gen_result.error_message || 'Failed to auto-generate away team lineup',
          fix_suggestion: (auto_gen_result.fix_suggestion || null) as string | null
        };
        current_checks.set(fixture.id, [...checks]);
        is_starting.set(fixture.id, false);
        return;
      }

      checks[checks.length - 1] = {
        check_name: 'away_lineup',
        status: 'passed',
        message: `Auto-generated lineup for ${team_name}`,
        fix_suggestion: null
      };
    } else {
      checks[checks.length - 1] = officials_check.away_lineup_check;
    }
    current_checks.set(fixture.id, [...checks]);

    is_starting.set(fixture.id, false);

    await goto(`/live-games/${fixture.id}`);
  }

  function format_date_time(date_time: string): string {
    return new Date(date_time).toLocaleString();
  }

  function get_status_badge_class(status: string): string {
    const base_classes = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'scheduled':
        return `${base_classes} bg-blue-100 text-blue-800`;
      case 'in_progress':
        return `${base_classes} bg-green-100 text-green-800`;
      case 'postponed':
        return `${base_classes} bg-yellow-100 text-yellow-800`;
      default:
        return `${base_classes} bg-gray-100 text-gray-800`;
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
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'checking':
        return 'text-blue-600 animate-spin';
      default:
        return 'text-gray-400';
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2">Live Game Management</h1>
    <p class="text-gray-600">Start and manage fixtures in real-time</p>
  </div>

  {#if is_loading}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else if incomplete_fixtures.length === 0}
    <div class="bg-gray-50 rounded-lg p-8 text-center">
      <p class="text-gray-600 mb-4">No incomplete fixtures found</p>
      <a href="/fixtures" class="text-blue-600 hover:text-blue-800 underline">
        Create a new fixture
      </a>
    </div>
  {:else}
    <div class="space-y-4">
      {#each incomplete_fixtures as fixture (fixture.id)}
        <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold">
                  {fixture.home_team_id} vs {fixture.away_team_id}
                </h3>
                <span class={get_status_badge_class(fixture.status)}>
                  {fixture.status}
                </span>
              </div>
              <p class="text-sm text-gray-600">
                {format_date_time(fixture.scheduled_date)}
              </p>
              {#if fixture.venue}
                <p class="text-sm text-gray-500">Venue: {fixture.venue}</p>
              {/if}
            </div>

            <div class="flex items-center gap-3">
              <button
                onclick={() => start_fixture(fixture)}
                disabled={is_starting.get(fixture.id || '')}
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {is_starting.get(fixture.id || '') ? 'Starting...' : 'Start Game'}
              </button>
            </div>
          </div>

          {#if current_checks.has(fixture.id || '') && (current_checks.get(fixture.id || '') ?? []).length > 0}
            <div class="mt-4 pt-4 border-t border-gray-200">
              <h4 class="text-sm font-medium mb-2">Pre-flight Checks:</h4>
              <div class="space-y-2">
                {#each current_checks.get(fixture.id || '') ?? [] as check}
                  <div class="flex items-start gap-2">
                    <span class={`text-lg ${get_check_class(check.status)}`}>
                      {get_check_icon(check.status)}
                    </span>
                    <div class="flex-1">
                      <p class="text-sm">{check.message}</p>
                      {#if check.fix_suggestion}
                        <p class="text-xs text-gray-600 mt-1">{check.fix_suggestion}</p>
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
