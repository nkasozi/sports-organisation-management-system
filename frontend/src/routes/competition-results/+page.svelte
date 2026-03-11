<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";
  import { page } from "$app/stores";
  import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
  import type { Competition } from "$lib/core/entities/Competition";
  import {
    derive_competition_status,
    get_competition_status_display,
  } from "$lib/core/entities/Competition";
  import {
    get_stage_type_label,
    type CompetitionStage,
  } from "$lib/core/entities/CompetitionStage";
  import type { Fixture } from "$lib/core/entities/Fixture";
  import type { Team } from "$lib/core/entities/Team";
  import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
  import type { Official } from "$lib/core/entities/Official";
  import type { Organization } from "$lib/core/entities/Organization";
  import type { LoadingState } from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
  import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
  import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
  import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
  import { get_competition_format_use_cases } from "$lib/core/usecases/CompetitionFormatUseCases";
  import { get_competition_stage_use_cases } from "$lib/core/usecases/CompetitionStageUseCases";
  import { get_competition_team_use_cases } from "$lib/core/usecases/CompetitionTeamUseCases";
  import { get_fixture_lineup_use_cases } from "$lib/core/usecases/FixtureLineupUseCases";
  import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
  import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
  import { get_team_staff_use_cases } from "$lib/core/usecases/TeamStaffUseCases";
  import { get_team_staff_full_name } from "$lib/core/entities/TeamStaff";
  import { auth_store } from "$lib/presentation/stores/auth";
  import {
    build_authorization_list_filter,
    type UserScopeProfile,
  } from "$lib/core/interfaces/ports";
  import type {
    MatchStaffEntry,
    MatchReportData,
  } from "$lib/core/types/MatchReportTypes";
  import LoadingStateWrapper from "$lib/presentation/components/ui/LoadingStateWrapper.svelte";
  import {
    build_match_report_data,
    generate_match_report_filename,
    type MatchReportBuildContext,
  } from "$lib/infrastructure/utils/MatchReportBuilder";
  import {
    download_match_report,
    download_all_match_reports,
  } from "$lib/infrastructure/utils/MatchReportPdfGenerator";
  import { branding_store } from "$lib/presentation/stores/branding";
  import { public_organization_store } from "$lib/presentation/stores/publicOrganization";
  import { is_public_viewer } from "$lib/presentation/stores/auth";
  import { fetch_public_data_from_convex } from "$lib/infrastructure/sync/convexPublicDataService";
  import CompetitionStandingsTable from "$lib/presentation/components/competition/CompetitionStandingsTable.svelte";
  import {
    build_competition_stage_results_sections,
    calculate_team_standings,
    type TeamStanding,
  } from "$lib/presentation/logic/competitionStageResults";
  import {
    type PointsConfig,
    type TieBreaker,
    DEFAULT_POINTS_CONFIG,
  } from "$lib/core/entities/CompetitionFormat";

  const competition_use_cases = get_competition_use_cases();
  const fixture_use_cases = get_fixture_use_cases();
  const team_use_cases = get_team_use_cases();
  const format_use_cases = get_competition_format_use_cases();
  const competition_stage_use_cases = get_competition_stage_use_cases();
  const competition_team_use_cases = get_competition_team_use_cases();
  const fixture_lineup_use_cases = get_fixture_lineup_use_cases();
  const official_use_cases = get_official_use_cases();
  const organization_use_cases = get_organization_use_cases();
  const team_staff_use_cases = get_team_staff_use_cases();

  let organizations: Organization[] = [];
  let selected_organization_id: string = "";
  let downloading_fixture_id: string | null = null;
  let downloading_all_reports: boolean = false;

  let competitions: Competition[] = [];
  let selected_competition_id: string = "";
  let selected_competition: Competition | null = null;
  let competition_format: CompetitionFormat | null = null;
  let competition_stages: CompetitionStage[] = [];
  let fixtures: Fixture[] = [];
  let teams: Team[] = [];
  let team_map: Map<string, Team> = new Map();
  let loading_state: LoadingState = "loading";
  let fixtures_loading: boolean = false;
  let error_message: string = "";
  let is_using_cached_data: boolean = false;

  let active_tab: "standings" | "fixtures" | "results" | "stats" = "standings";

  let share_link_copied = false;

  let selected_team_id: string | null = null;
  let selected_team_name: string = "";
  let team_fixtures_loading: boolean = false;
  let team_fixtures_in_competition: Fixture[] = [];
  let team_fixtures_all_competitions: Fixture[] = [];
  let show_all_competitions_fixtures: boolean = false;
  let extended_team_map: Map<string, Team> = new Map();
  let extended_competition_map: Map<string, Competition> = new Map();

  function handle_team_click(team_id: string, team_name: string): void {
    if (selected_team_id === team_id) {
      selected_team_id = null;
      selected_team_name = "";
      team_fixtures_in_competition = [];
      team_fixtures_all_competitions = [];
      return;
    }
    selected_team_id = team_id;
    selected_team_name = team_name;
    load_team_fixtures(team_id);
  }

  function close_team_fixtures_panel(): void {
    selected_team_id = null;
    selected_team_name = "";
    team_fixtures_in_competition = [];
    team_fixtures_all_competitions = [];
    show_all_competitions_fixtures = false;
  }

  async function load_team_fixtures(team_id: string): Promise<void> {
    team_fixtures_loading = true;

    team_fixtures_in_competition = fixtures.filter(
      (f) => f.home_team_id === team_id || f.away_team_id === team_id,
    );

    const all_fixtures_result = await fixture_use_cases.list(
      {},
      { page_number: 1, page_size: 500 },
    );

    if (all_fixtures_result.success) {
      team_fixtures_all_competitions = all_fixtures_result.data.filter(
        (f: Fixture) =>
          f.home_team_id === team_id || f.away_team_id === team_id,
      );

      const all_team_ids = new Set<string>();
      const all_competition_ids = new Set<string>();
      for (const f of team_fixtures_all_competitions) {
        all_team_ids.add(f.home_team_id);
        all_team_ids.add(f.away_team_id);
        if (f.competition_id) {
          all_competition_ids.add(f.competition_id);
        }
      }

      extended_team_map = new Map(team_map);
      for (const tid of all_team_ids) {
        if (!extended_team_map.has(tid)) {
          const team_result = await team_use_cases.get_by_id(tid);
          if (team_result.success && team_result.data) {
            extended_team_map.set(tid, team_result.data);
          }
        }
      }

      extended_competition_map = new Map();
      for (const comp of competitions) {
        extended_competition_map.set(comp.id, comp);
      }
      for (const cid of all_competition_ids) {
        if (!extended_competition_map.has(cid)) {
          const comp_result = await competition_use_cases.get_by_id(cid);
          if (comp_result.success && comp_result.data) {
            extended_competition_map.set(cid, comp_result.data);
          }
        }
      }
    }

    team_fixtures_loading = false;
  }

  function get_team_name_extended(team_id: string): string {
    return (
      extended_team_map.get(team_id)?.name ??
      team_map.get(team_id)?.name ??
      "Unknown Team"
    );
  }

  function get_competition_name_extended(competition_id: string): string {
    return (
      extended_competition_map.get(competition_id)?.name ??
      "Unknown Competition"
    );
  }

  $: displayed_team_fixtures = show_all_competitions_fixtures
    ? team_fixtures_all_competitions
    : team_fixtures_in_competition;

  function sync_branding_for_org(org: Organization): boolean {
    branding_store.set_organization_context(
      org.id,
      org.name,
      org.contact_email,
      org.address,
    );
    console.log(`[CompetitionResults] Synced branding for org: ${org.name}`);
    return true;
  }

  function build_shareable_url(org_id: string, competition_id: string): string {
    if (!browser) return "";

    const base_url = window.location.origin;
    const params = new URLSearchParams();
    params.set("org", org_id);
    params.set("competition", competition_id);
    return `${base_url}/competition-results?${params.toString()}`;
  }

  function handle_copy_share_link(): boolean {
    if (!selected_organization_id || !selected_competition_id) return false;

    const url = build_shareable_url(
      selected_organization_id,
      selected_competition_id,
    );

    navigator.clipboard.writeText(url);
    share_link_copied = true;
    setTimeout(() => {
      share_link_copied = false;
    }, 2000);
    return true;
  }

  function extract_url_params(): {
    org_id: string;
    competition_id: string;
  } {
    const current_page = get(page);
    const org_id = current_page.url.searchParams.get("org") ?? "";
    const competition_id =
      current_page.url.searchParams.get("competition") ?? "";
    return { org_id, competition_id };
  }

  $: selected_competition_derived_status = selected_competition
    ? derive_competition_status(
        selected_competition.start_date,
        selected_competition.end_date,
      )
    : null;

  $: selected_competition_status_display = selected_competition_derived_status
    ? get_competition_status_display(selected_competition_derived_status)
    : null;

  interface PlayerStats {
    player_name: string;
    team_name: string;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
  }

  function derive_effective_points_config(
    format: CompetitionFormat | null,
    competition: Competition | null,
  ): PointsConfig {
    const base_config = format?.points_config ?? DEFAULT_POINTS_CONFIG;
    const override = competition?.rule_overrides?.points_config_override;
    if (!override) return base_config;
    return {
      points_for_win: override.points_for_win ?? base_config.points_for_win,
      points_for_draw: override.points_for_draw ?? base_config.points_for_draw,
      points_for_loss: override.points_for_loss ?? base_config.points_for_loss,
    };
  }

  function derive_effective_tie_breakers(
    format: CompetitionFormat | null,
    competition: Competition | null,
  ): TieBreaker[] {
    const override = competition?.rule_overrides?.tie_breakers_override;
    return (
      override ?? format?.tie_breakers ?? ["goal_difference", "goals_scored"]
    );
  }

  $: effective_points_config = derive_effective_points_config(
    competition_format,
    selected_competition,
  );
  $: effective_tie_breakers = derive_effective_tie_breakers(
    competition_format,
    selected_competition,
  );

  $: standings = calculate_team_standings(
    fixtures,
    teams,
    effective_points_config,
    effective_tie_breakers,
  );
  $: stage_results_sections = build_competition_stage_results_sections(
    competition_stages,
    fixtures,
    teams,
    effective_points_config,
    effective_tie_breakers,
  );
  $: competition_stage_map = new Map(
    competition_stages.map((stage) => [stage.id, stage]),
  );
  $: completed_fixtures = fixtures.filter((f) => f.status === "completed");
  $: upcoming_fixtures = fixtures.filter(
    (f) => f.status === "scheduled" || f.status === "in_progress",
  );
  $: in_progress_fixtures = fixtures.filter((f) => f.status === "in_progress");
  $: player_stats = calculate_player_stats(fixtures);

  function get_current_user_role(): string {
    const auth_state = get(auth_store);
    return auth_state.current_profile?.role || "player";
  }

  function can_user_change_organizations(): boolean {
    const role = get_current_user_role();
    return role === "super_admin";
  }

  function build_auth_filter(): Record<string, string> {
    const auth_state = get(auth_store);
    if (!auth_state.current_profile) return {};
    const entity_fields = ["organization_id", "id"];
    return build_authorization_list_filter(
      auth_state.current_profile as UserScopeProfile,
      entity_fields,
    );
  }

  async function load_organizations(): Promise<Organization[]> {
    const auth_filter = build_auth_filter();
    const result = await organization_use_cases.list(auth_filter);
    if (!result.success) {
      throw new Error(result.error_message || "Failed to load organizations");
    }
    return result.data;
  }

  async function load_competitions_for_organization(
    organization_id: string,
  ): Promise<void> {
    const result = await competition_use_cases.list(
      { organization_id },
      { page_number: 1, page_size: 100 },
    );
    if (!result.success) {
      competitions = [];
      return;
    }
    competitions = result.data;

    if (competitions.length > 0) {
      selected_competition_id = competitions[0].id;
      await load_competition_data();
    } else {
      selected_competition_id = "";
      selected_competition = null;
      competition_format = null;
      competition_stages = [];
      fixtures = [];
      teams = [];
      team_map = new Map();
    }
  }

  async function handle_organization_change(): Promise<void> {
    if (!selected_organization_id) return;
    fixtures_loading = true;
    await load_competitions_for_organization(selected_organization_id);
    fixtures_loading = false;
  }

  onMount(async () => {
    if (!browser) return;

    const url_params = extract_url_params();
    const has_shareable_params = url_params.org_id.length > 0;

    const auth_result = await ensure_auth_profile();
    const is_public = get(is_public_viewer);

    if (!auth_result.success && !is_public) {
      error_message = auth_result.error_message;
      loading_state = "error";
      return;
    }

    loading_state = "loading";

    try {
      const fetch_result = await fetch_public_data_from_convex(
        "competition_results",
      );
      is_using_cached_data = !fetch_result.success;
      organizations = await load_organizations();

      if (has_shareable_params && organizations.length > 0) {
        const matching_org = organizations.find(
          (o) => o.id === url_params.org_id,
        );
        if (matching_org) {
          selected_organization_id = matching_org.id;
          public_organization_store.set_organization(
            matching_org.id,
            matching_org.name,
          );
          await sync_branding_for_org(matching_org);
          await load_competitions_for_organization(selected_organization_id);

          if (url_params.competition_id) {
            const matching_comp = competitions.find(
              (c) => c.id === url_params.competition_id,
            );
            if (matching_comp) {
              selected_competition_id = matching_comp.id;
              await load_competition_data();
            }
          }
        } else {
          selected_organization_id = organizations[0].id;
          await load_competitions_for_organization(selected_organization_id);
        }
      } else if (organizations.length > 0) {
        selected_organization_id = organizations[0].id;
        await load_competitions_for_organization(selected_organization_id);
      }

      loading_state = "success";
    } catch (err) {
      error_message =
        err instanceof Error ? err.message : "Failed to load data";
      loading_state = "error";
    }
  });

  async function load_competition_data(): Promise<void> {
    if (!selected_competition_id) return;

    fixtures_loading = true;

    const comp_result = await competition_use_cases.get_by_id(
      selected_competition_id,
    );
    if (comp_result.success && comp_result.data) {
      selected_competition = comp_result.data;

      if (selected_competition?.competition_format_id) {
        const format_result = await format_use_cases.get_by_id(
          selected_competition?.competition_format_id,
        );
        if (format_result.success && format_result.data) {
          competition_format = format_result.data;
        }
      }
    }

    const comp_teams_result =
      await competition_team_use_cases.list_teams_in_competition(
        selected_competition_id,
        { page_number: 1, page_size: 100 },
      );
    const stage_result =
      await competition_stage_use_cases.list_stages_by_competition(
        selected_competition_id,
        { page_number: 1, page_size: 100 },
      );
    competition_stages = stage_result.success ? stage_result.data : [];
    if (comp_teams_result.success) {
      const team_ids = comp_teams_result.data.items.map(
        (ct: { team_id: string }) => ct.team_id,
      );
      const teams_promises = team_ids.map((id: string) =>
        team_use_cases.get_by_id(id),
      );
      const teams_results = await Promise.all(teams_promises);
      teams = [];
      for (const result of teams_results) {
        if (result.success && result.data) {
          teams.push(result.data);
        }
      }
      team_map = new Map(teams.map((t) => [t.id, t]));
    }

    const fixtures_result =
      await fixture_use_cases.list_fixtures_by_competition(
        selected_competition_id,
      );
    if (fixtures_result.success) {
      fixtures = fixtures_result.data.items;
    }

    fixtures_loading = false;
  }

  function handle_competition_change(): void {
    load_competition_data();
  }

  function handle_standings_team_click(
    event: CustomEvent<{ team_id: string; team_name: string }>,
  ): void {
    handle_team_click(event.detail.team_id, event.detail.team_name);
  }

  function calculate_player_stats(fixtures: Fixture[]): PlayerStats[] {
    const stats_map = new Map<string, PlayerStats>();

    for (const fixture of fixtures) {
      if (!fixture.game_events) continue;

      for (const event of fixture.game_events) {
        if (!event.player_name) continue;

        const key = `${event.player_name}-${event.team_side}`;
        if (!stats_map.has(key)) {
          const team =
            event.team_side === "home"
              ? team_map.get(fixture.home_team_id)
              : team_map.get(fixture.away_team_id);
          stats_map.set(key, {
            player_name: event.player_name,
            team_name: team?.name ?? "Unknown",
            goals: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
          });
        }

        const player = stats_map.get(key)!;
        switch (event.event_type) {
          case "goal":
          case "penalty_scored":
            player.goals++;
            break;
          case "yellow_card":
            player.yellow_cards++;
            break;
          case "red_card":
          case "second_yellow":
            player.red_cards++;
            break;
        }
      }
    }

    return Array.from(stats_map.values()).sort((a, b) => b.goals - a.goals);
  }

  function get_team_name(team_id: string): string {
    return team_map.get(team_id)?.name ?? "Unknown Team";
  }

  function get_fixture_stage_name(stage_id?: string | null): string {
    if (!stage_id) {
      return competition_stages.length > 0 ? "Unassigned Stage" : "";
    }

    return competition_stage_map.get(stage_id)?.name ?? "Unknown Stage";
  }

  function get_fixture_stage_type(stage_id?: string | null): string {
    if (!stage_id) return "";

    const stage = competition_stage_map.get(stage_id);
    if (!stage) return "";

    return get_stage_type_label(stage.stage_type);
  }

  function format_date(date_string: string): string {
    return new Date(date_string).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handle_download_match_report(
    fixture: Fixture,
    event: MouseEvent,
  ): Promise<boolean> {
    event.stopPropagation();
    downloading_fixture_id = fixture.id;

    try {
      const home_team = team_map.get(fixture.home_team_id);
      const away_team = team_map.get(fixture.away_team_id);

      if (!home_team || !away_team) {
        console.warn(
          "[MatchReport] Missing team data for fixture:",
          fixture.id,
        );
        downloading_fixture_id = null;
        return false;
      }

      const [home_lineup_result, away_lineup_result] = await Promise.all([
        fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
          fixture.id,
          fixture.home_team_id,
        ),
        fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
          fixture.id,
          fixture.away_team_id,
        ),
      ]);

      const home_lineup =
        home_lineup_result.success && home_lineup_result.data
          ? home_lineup_result.data.selected_players
          : [];
      const away_lineup =
        away_lineup_result.success && away_lineup_result.data
          ? away_lineup_result.data.selected_players
          : [];

      const assigned_officials: Array<{
        official: Official;
        role_name: string;
      }> = [];
      if (fixture.assigned_officials) {
        for (const assignment of fixture.assigned_officials) {
          const official_result = await official_use_cases.get_by_id(
            assignment.official_id,
          );
          if (official_result.success && official_result.data) {
            assigned_officials.push({
              official: official_result.data,
              role_name: assignment.role_name,
            });
          }
        }
      }

      let organization_name = "SPORTS ORGANIZATION";
      if (selected_competition?.organization_id) {
        const org_result = await organization_use_cases.get_by_id(
          selected_competition.organization_id,
        );
        if (org_result.success && org_result.data) {
          organization_name = org_result.data.name.toUpperCase();
        }
      }

      const staff_roles_result = await team_staff_use_cases.list_staff_roles();
      const staff_roles_map = new Map<string, string>();
      if (staff_roles_result.success && staff_roles_result.data) {
        for (const role of staff_roles_result.data) {
          staff_roles_map.set(role.id, role.name);
        }
      }

      const [home_staff_result, away_staff_result] = await Promise.all([
        team_staff_use_cases.list_staff_by_team(fixture.home_team_id),
        team_staff_use_cases.list_staff_by_team(fixture.away_team_id),
      ]);

      const home_staff: MatchStaffEntry[] = [];
      if (home_staff_result.success && home_staff_result.data) {
        for (const staff of home_staff_result.data.items) {
          home_staff.push({
            role: staff_roles_map.get(staff.role_id) || "Staff",
            name: get_team_staff_full_name(staff),
          });
        }
      }

      const away_staff: MatchStaffEntry[] = [];
      if (away_staff_result.success && away_staff_result.data) {
        for (const staff of away_staff_result.data.items) {
          away_staff.push({
            role: staff_roles_map.get(staff.role_id) || "Staff",
            name: get_team_staff_full_name(staff),
          });
        }
      }

      const ctx: MatchReportBuildContext = {
        fixture,
        home_team,
        away_team,
        competition: selected_competition,
        home_lineup,
        away_lineup,
        assigned_officials,
        home_staff,
        away_staff,
        organization_name,
        organization_logo_url: $branding_store.organization_logo_url,
      };

      const report_data = build_match_report_data(ctx);
      const filename = generate_match_report_filename(
        home_team.name,
        away_team.name,
        fixture.scheduled_date,
      );

      console.log("[MatchReport] Generating PDF for:", filename);
      download_match_report(report_data, filename);
      console.log("[MatchReport] PDF download triggered");

      downloading_fixture_id = null;
      return true;
    } catch (error) {
      console.error("[MatchReport] Error generating report:", error);
      downloading_fixture_id = null;
      return false;
    }
  }

  async function build_report_data_for_fixture(
    fixture: Fixture,
    organization_name: string,
    staff_roles_map: Map<string, string>,
  ): Promise<MatchReportData | null> {
    const home_team = team_map.get(fixture.home_team_id);
    const away_team = team_map.get(fixture.away_team_id);

    if (!home_team || !away_team) {
      return null;
    }

    const [home_lineup_result, away_lineup_result] = await Promise.all([
      fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture.id,
        fixture.home_team_id,
      ),
      fixture_lineup_use_cases.get_lineup_for_team_in_fixture(
        fixture.id,
        fixture.away_team_id,
      ),
    ]);

    const home_lineup =
      home_lineup_result.success && home_lineup_result.data
        ? home_lineup_result.data.selected_players
        : [];
    const away_lineup =
      away_lineup_result.success && away_lineup_result.data
        ? away_lineup_result.data.selected_players
        : [];

    const assigned_officials: Array<{ official: Official; role_name: string }> =
      [];
    if (fixture.assigned_officials) {
      for (const assignment of fixture.assigned_officials) {
        const official_result = await official_use_cases.get_by_id(
          assignment.official_id,
        );
        if (official_result.success && official_result.data) {
          assigned_officials.push({
            official: official_result.data,
            role_name: assignment.role_name,
          });
        }
      }
    }

    const [home_staff_result, away_staff_result] = await Promise.all([
      team_staff_use_cases.list_staff_by_team(fixture.home_team_id),
      team_staff_use_cases.list_staff_by_team(fixture.away_team_id),
    ]);

    const home_staff: MatchStaffEntry[] = [];
    if (home_staff_result.success && home_staff_result.data) {
      for (const staff of home_staff_result.data.items) {
        home_staff.push({
          role: staff_roles_map.get(staff.role_id) || "Staff",
          name: get_team_staff_full_name(staff),
        });
      }
    }

    const away_staff: MatchStaffEntry[] = [];
    if (away_staff_result.success && away_staff_result.data) {
      for (const staff of away_staff_result.data.items) {
        away_staff.push({
          role: staff_roles_map.get(staff.role_id) || "Staff",
          name: get_team_staff_full_name(staff),
        });
      }
    }

    const ctx: MatchReportBuildContext = {
      fixture,
      home_team,
      away_team,
      competition: selected_competition,
      home_lineup,
      away_lineup,
      assigned_officials,
      home_staff,
      away_staff,
      organization_name,
      organization_logo_url: $branding_store.organization_logo_url,
    };

    return build_match_report_data(ctx);
  }

  async function handle_download_all_reports(): Promise<boolean> {
    if (completed_fixtures.length === 0) {
      return false;
    }

    downloading_all_reports = true;

    try {
      let organization_name = "SPORTS ORGANIZATION";
      if (selected_competition?.organization_id) {
        const org_result = await organization_use_cases.get_by_id(
          selected_competition.organization_id,
        );
        if (org_result.success && org_result.data) {
          organization_name = org_result.data.name.toUpperCase();
        }
      }

      const staff_roles_result = await team_staff_use_cases.list_staff_roles();
      const staff_roles_map = new Map<string, string>();
      if (staff_roles_result.success && staff_roles_result.data) {
        for (const role of staff_roles_result.data) {
          staff_roles_map.set(role.id, role.name);
        }
      }

      const all_reports: MatchReportData[] = [];

      for (const fixture of completed_fixtures) {
        const report_data = await build_report_data_for_fixture(
          fixture,
          organization_name,
          staff_roles_map,
        );
        if (report_data) {
          all_reports.push(report_data);
        }
      }

      if (all_reports.length === 0) {
        console.warn("[MatchReport] No reports to download");
        downloading_all_reports = false;
        return false;
      }

      const competition_name = selected_competition?.name || "Competition";
      const filename = `${competition_name}_All_Match_Reports.pdf`;

      console.log(
        "[MatchReport] Generating all reports PDF:",
        filename,
        "Reports:",
        all_reports.length,
      );
      download_all_match_reports(all_reports, filename);
      console.log("[MatchReport] All reports PDF download triggered");

      downloading_all_reports = false;
      return true;
    } catch (error) {
      console.error("[MatchReport] Error generating all reports:", error);
      downloading_all_reports = false;
      return false;
    }
  }
</script>

<svelte:head>
  <title>Competition Results - Sports Management</title>
</svelte:head>

<div class="w-full">
  {#if is_using_cached_data}
    <div
      class="banner-info mx-4 mt-4 mb-2 flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
    >
      <svg
        class="banner-info-icon h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span
        >Showing locally cached data — connect to the internet to get the latest
        results.</span
      >
    </div>
  {/if}
  <LoadingStateWrapper
    state={loading_state}
    loading_text="Loading data..."
    {error_message}
  >
    {#if organizations.length === 0}
      <div class="card p-8 sm:p-12 text-center">
        <svg
          class="mx-auto h-12 w-12 text-accent-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3
          class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
        >
          No organizations found
        </h3>
        <p class="mt-2 text-accent-600 dark:text-accent-400">
          Create an organization first to view competition results.
        </p>
        <button
          type="button"
          class="btn btn-primary-action mt-4"
          on:click={() => goto("/organizations")}
        >
          Go to Organizations
        </button>
      </div>
    {:else if competitions.length === 0}
      <div class="card p-8 sm:p-12 text-center">
        <svg
          class="mx-auto h-12 w-12 text-accent-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
        <h3
          class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
        >
          No competitions found
        </h3>
        <p class="mt-2 text-accent-600 dark:text-accent-400">
          Create a competition first to see results.
        </p>
        <button
          type="button"
          class="btn btn-primary-action mt-4"
          on:click={() => goto("/competitions/create")}
        >
          Create Competition
        </button>
      </div>
    {:else}
      <div class="card p-4 sm:p-6 space-y-6 overflow-hidden">
        <div
          class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4"
        >
          <div class="min-w-0">
            <h2
              class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100"
            >
              Competition Results
            </h2>
            <p class="text-xs sm:text-sm text-accent-600 dark:text-accent-400">
              View standings, fixtures, and statistics
            </p>
          </div>

          <div
            class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto"
          >
            {#if can_user_change_organizations()}
              <select
                bind:value={selected_organization_id}
                on:change={handle_organization_change}
                class="select-styled w-full sm:w-auto min-w-0 sm:min-w-[200px]"
              >
                {#each organizations as org}
                  <option value={org.id}>{org.name}</option>
                {/each}
              </select>
            {:else}
              <span
                class="text-sm font-medium text-accent-700 dark:text-accent-300 px-3 py-2 bg-accent-100 dark:bg-accent-800 rounded-lg"
              >
                {organizations.find((o) => o.id === selected_organization_id)
                  ?.name || "Organization"}
              </span>
            {/if}

            <select
              id="competition_select"
              bind:value={selected_competition_id}
              on:change={handle_competition_change}
              class="select-styled w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]"
            >
              {#each competitions as competition}
                <option value={competition.id}>{competition.name}</option>
              {/each}
            </select>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                {share_link_copied
                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                : 'bg-accent-100 text-accent-700 dark:bg-accent-800 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-700'}"
              on:click={handle_copy_share_link}
              title="Copy shareable link"
            >
              {#if share_link_copied}
                <svg
                  class="w-4 h-4"
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
                <span class="hidden sm:inline">Copied</span>
              {:else}
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span class="hidden sm:inline">Share</span>
              {/if}
            </button>
          </div>
        </div>

        {#if selected_competition && selected_competition_status_display}
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="px-2 py-1 text-xs font-medium rounded-full {selected_competition_status_display.color}"
            >
              {selected_competition_status_display.label}
            </span>
            {#if competition_format}
              <span
                class="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded-full"
              >
                {competition_format.name}
              </span>
            {/if}
          </div>
        {/if}

        <div
          class="border-b border-gray-200 dark:border-gray-700 -mx-4 sm:-mx-6 px-4 sm:px-6"
        >
          <nav
            class="flex overflow-x-auto -mb-px scrollbar-hide"
            aria-label="Tabs"
          >
            <button
              type="button"
              class="flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors {active_tab ===
              'standings'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-accent-700 dark:hover:text-accent-300 hover:border-gray-300'}"
              on:click={() => (active_tab = "standings")}
            >
              <span class="hidden sm:inline">📊 </span> Standings
            </button>
            <button
              type="button"
              class="flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors {active_tab ===
              'fixtures'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-accent-700 dark:hover:text-accent-300 hover:border-gray-300'}"
              on:click={() => (active_tab = "fixtures")}
            >
              <span class="hidden sm:inline">📅 </span> Upcoming<span
                class="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full"
                >{upcoming_fixtures.length}</span
              >
            </button>
            <button
              type="button"
              class="flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors {active_tab ===
              'results'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-accent-700 dark:hover:text-accent-300 hover:border-gray-300'}"
              on:click={() => (active_tab = "results")}
            >
              <span class="hidden sm:inline">✅ </span> Results<span
                class="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full"
                >{completed_fixtures.length}</span
              >
            </button>
            <button
              type="button"
              class="flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors {active_tab ===
              'stats'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-accent-700 dark:hover:text-accent-300 hover:border-gray-300'}"
              on:click={() => (active_tab = "stats")}
            >
              <span class="hidden sm:inline">⚽ </span> Stats
            </button>
          </nav>
        </div>

        <div class="min-h-[200px]">
          {#if fixtures_loading}
            <div class="flex items-center justify-center py-12">
              <div
                class="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"
              ></div>
            </div>
          {:else if active_tab === "standings"}
            {#if stage_results_sections.length === 0}
              <CompetitionStandingsTable
                {standings}
                {selected_team_id}
                empty_message="No teams registered for this competition yet."
                on:teamclick={handle_standings_team_click}
              />
            {:else}
              <div class="space-y-6">
                {#each stage_results_sections as stage_section}
                  <section
                    class="rounded-xl border border-accent-200 dark:border-accent-700 p-4 sm:p-5"
                  >
                    <div
                      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4"
                    >
                      <div>
                        <h3
                          class="text-lg font-semibold text-accent-900 dark:text-accent-100"
                        >
                          {stage_section.stage.name}
                        </h3>
                        <p class="text-sm text-accent-600 dark:text-accent-400">
                          {stage_section.fixtures.length} fixture{stage_section
                            .fixtures.length === 1
                            ? ""
                            : "s"} attached to this stage
                        </p>
                      </div>
                      <span
                        class="inline-flex items-center rounded-full bg-accent-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-700 dark:bg-accent-800 dark:text-accent-300"
                      >
                        {stage_section.stage.stage_type.replaceAll("_", " ")}
                      </span>
                    </div>

                    {#if stage_section.stage.stage_type === "group_stage"}
                      {#if stage_section.inferred_groups.length === 0}
                        <div class="text-center py-8 text-accent-500">
                          No groups can be inferred for this stage yet.
                        </div>
                      {:else}
                        <div class="space-y-6">
                          {#each stage_section.inferred_groups as inferred_group}
                            <div
                              class="rounded-lg bg-accent-50/70 p-4 dark:bg-accent-900/20"
                            >
                              <div
                                class="mb-3 flex items-center justify-between gap-3"
                              >
                                <h4
                                  class="text-base font-semibold text-accent-900 dark:text-accent-100"
                                >
                                  {inferred_group.label}
                                </h4>
                                <span
                                  class="text-xs text-accent-600 dark:text-accent-400"
                                >
                                  {inferred_group.team_ids.length} teams
                                </span>
                              </div>
                              <CompetitionStandingsTable
                                standings={inferred_group.standings}
                                {selected_team_id}
                                empty_message="No completed fixtures in this inferred group yet."
                                show_legend={false}
                                on:teamclick={handle_standings_team_click}
                              />
                            </div>
                          {/each}
                        </div>
                      {/if}
                    {:else}
                      <CompetitionStandingsTable
                        standings={stage_section.standings}
                        {selected_team_id}
                        empty_message="No standings are available for this stage yet."
                        show_legend={false}
                        on:teamclick={handle_standings_team_click}
                      />
                    {/if}
                  </section>
                {/each}

                <div
                  class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
                >
                  <div
                    class="text-xs text-gray-500 dark:text-gray-400 font-bold mb-2"
                  >
                    Legend
                  </div>
                  <div
                    class="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <span
                      ><strong class="text-gray-700 dark:text-gray-300"
                        >P</strong
                      > = Played</span
                    >
                    <span
                      ><strong class="text-gray-700 dark:text-gray-300"
                        >W</strong
                      > = Won</span
                    >
                    <span
                      ><strong class="text-gray-700 dark:text-gray-300"
                        >D</strong
                      > = Drawn</span
                    >
                    <span
                      ><strong class="text-gray-700 dark:text-gray-300"
                        >L</strong
                      > = Lost</span
                    >
                    <span
                      ><strong class="text-gray-700 dark:text-gray-300"
                        >GF</strong
                      > = Goals For</span
                    >
                    <span
                      ><strong class="text-gray-700 dark:text-gray-300"
                        >GA</strong
                      > = Goals Against</span
                    >
                    <span
                      ><strong class="text-gray-700 dark:text-gray-300"
                        >GD</strong
                      > = Goal Difference</span
                    >
                    <span
                      ><strong class="text-gray-700 dark:text-gray-300"
                        >Pts</strong
                      > = Points</span
                    >
                  </div>
                  <div
                    class="mt-2 text-xs text-gray-500 dark:text-gray-400 italic"
                  >
                    Click on a team to view their fixtures
                  </div>
                </div>
              </div>
            {/if}

            {#if selected_team_id}
              <div
                class="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                <div
                  class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
                >
                  <div
                    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div class="flex items-center gap-3">
                      <button
                        type="button"
                        class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        on:click={close_team_fixtures_panel}
                        aria-label="Close"
                      >
                        <svg
                          class="w-5 h-5 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <div>
                        <h3
                          class="text-base font-semibold text-accent-900 dark:text-accent-100"
                        >
                          {selected_team_name} Fixtures
                        </h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {displayed_team_fixtures.length}
                          {displayed_team_fixtures.length === 1
                            ? "fixture"
                            : "fixtures"}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          bind:checked={show_all_competitions_fixtures}
                          class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                          All competitions
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="p-4 max-h-[400px] overflow-y-auto">
                  {#if team_fixtures_loading}
                    <div class="flex items-center justify-center py-8">
                      <div
                        class="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"
                      ></div>
                    </div>
                  {:else if displayed_team_fixtures.length === 0}
                    <div
                      class="text-center py-8 text-gray-500 dark:text-gray-400"
                    >
                      No fixtures found for this team.
                    </div>
                  {:else}
                    <div class="space-y-3">
                      {#each displayed_team_fixtures.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()) as fixture}
                        {@const is_home =
                          fixture.home_team_id === selected_team_id}
                        {@const home_score = fixture.home_team_score ?? 0}
                        {@const away_score = fixture.away_team_score ?? 0}
                        {@const did_win =
                          fixture.status === "completed" &&
                          ((is_home && home_score > away_score) ||
                            (!is_home && away_score > home_score))}
                        {@const did_lose =
                          fixture.status === "completed" &&
                          ((is_home && home_score < away_score) ||
                            (!is_home && away_score < home_score))}
                        {@const did_draw =
                          fixture.status === "completed" &&
                          home_score === away_score}
                        <div
                          class="p-3 rounded-lg border transition-colors {fixture.status ===
                          'completed'
                            ? did_win
                              ? 'border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/10'
                              : did_lose
                                ? 'border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/10'
                                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                            : fixture.status === 'in_progress'
                              ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}"
                        >
                          <div class="flex items-center justify-between mb-1">
                            <div
                              class="text-xs text-gray-500 dark:text-gray-400"
                            >
                              {format_date(fixture.scheduled_date)}
                            </div>
                            <div class="flex items-center gap-2">
                              {#if fixture.status === "in_progress"}
                                <span class="flex items-center gap-1">
                                  <span class="relative flex h-2 w-2">
                                    <span
                                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                                    ></span>
                                    <span
                                      class="relative inline-flex rounded-full h-2 w-2 bg-red-500"
                                    ></span>
                                  </span>
                                  <span
                                    class="text-xs font-semibold text-red-600 dark:text-red-400"
                                    >LIVE</span
                                  >
                                </span>
                              {:else if fixture.status === "completed"}
                                <span
                                  class="text-xs font-medium px-1.5 py-0.5 rounded {did_win
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                    : did_lose
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}"
                                >
                                  {did_win ? "W" : did_lose ? "L" : "D"}
                                </span>
                              {:else}
                                <span
                                  class="text-xs text-gray-400 dark:text-gray-500"
                                  >Scheduled</span
                                >
                              {/if}
                            </div>
                          </div>
                          <div class="mb-2">
                            <span
                              class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 max-w-full truncate"
                              title={get_competition_name_extended(
                                fixture.competition_id,
                              )}
                            >
                              {get_competition_name_extended(
                                fixture.competition_id,
                              )}
                            </span>
                          </div>
                          <div class="flex items-center justify-between gap-2">
                            <div class="flex-1 text-right">
                              <span
                                class="text-sm font-medium {fixture.home_team_id ===
                                selected_team_id
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-accent-900 dark:text-accent-100'} line-clamp-1"
                              >
                                {get_team_name_extended(fixture.home_team_id)}
                              </span>
                            </div>
                            <div class="flex-shrink-0 px-2 sm:px-4">
                              {#if fixture.status === "completed" || fixture.status === "in_progress"}
                                <div
                                  class="flex items-center gap-1 text-lg font-bold"
                                >
                                  <span
                                    class={is_home && home_score > away_score
                                      ? "text-green-600"
                                      : is_home && home_score < away_score
                                        ? "text-red-600"
                                        : "text-accent-900 dark:text-accent-100"}
                                  >
                                    {home_score}
                                  </span>
                                  <span class="text-gray-400">-</span>
                                  <span
                                    class={!is_home && away_score > home_score
                                      ? "text-green-600"
                                      : !is_home && away_score < home_score
                                        ? "text-red-600"
                                        : "text-accent-900 dark:text-accent-100"}
                                  >
                                    {away_score}
                                  </span>
                                </div>
                              {:else}
                                <span class="text-sm font-bold text-gray-400"
                                  >VS</span
                                >
                              {/if}
                            </div>
                            <div class="flex-1 text-left">
                              <span
                                class="text-sm font-medium {fixture.away_team_id ===
                                selected_team_id
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-accent-900 dark:text-accent-100'} line-clamp-1"
                              >
                                {get_team_name_extended(fixture.away_team_id)}
                              </span>
                            </div>
                          </div>
                          <div
                            class="flex justify-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700"
                          >
                            <button
                              type="button"
                              class="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded transition-colors"
                              on:click={() =>
                                goto(`/match-report/${fixture.id}`)}
                            >
                              <svg
                                class="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View Details
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          {:else if active_tab === "fixtures"}
            {#if upcoming_fixtures.length === 0}
              <div class="text-center py-8 text-accent-500">
                No upcoming fixtures scheduled.
              </div>
            {:else}
              <div class="space-y-3">
                {#each upcoming_fixtures as fixture}
                  {@const fixture_stage_name = get_fixture_stage_name(
                    fixture.stage_id,
                  )}
                  {@const fixture_stage_type = get_fixture_stage_type(
                    fixture.stage_id,
                  )}
                  <div
                    class="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg {fixture.status ===
                    'in_progress'
                      ? 'border border-red-200 dark:border-red-800'
                      : ''}"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          {format_date(fixture.scheduled_date)}
                        </div>
                        {#if fixture_stage_name}
                          <div class="mt-1">
                            <span
                              class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                            >
                              {fixture_stage_name}
                              {#if fixture_stage_type}
                                <span
                                  class="text-primary-500 dark:text-primary-400"
                                >
                                  • {fixture_stage_type}
                                </span>
                              {/if}
                            </span>
                          </div>
                        {/if}
                      </div>
                      {#if fixture.status === "in_progress"}
                        <div class="flex items-center gap-1.5">
                          <span class="relative flex h-2 w-2">
                            <span
                              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                            ></span>
                            <span
                              class="relative inline-flex rounded-full h-2 w-2 bg-red-500"
                            ></span>
                          </span>
                          <span
                            class="text-xs font-semibold text-red-600 dark:text-red-400"
                            >LIVE</span
                          >
                        </div>
                      {/if}
                    </div>
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex-1 text-right">
                        <span
                          class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1"
                        >
                          {get_team_name(fixture.home_team_id)}
                        </span>
                      </div>
                      <div class="flex-shrink-0 px-3 sm:px-6">
                        <div
                          class="text-base sm:text-lg font-bold text-gray-400"
                        >
                          VS
                        </div>
                      </div>
                      <div class="flex-1 text-left">
                        <span
                          class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1"
                        >
                          {get_team_name(fixture.away_team_id)}
                        </span>
                      </div>
                    </div>
                    <div
                      class="flex justify-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700"
                    >
                      <button
                        type="button"
                        class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        on:click={() => goto(`/match-report/${fixture.id}`)}
                      >
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Details
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else if active_tab === "results"}
            {#if completed_fixtures.length === 0}
              <div class="text-center py-8 text-accent-500">
                No completed fixtures yet.
              </div>
            {:else}
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {completed_fixtures.length} completed {completed_fixtures.length ===
                  1
                    ? "match"
                    : "matches"}
                </span>
                <button
                  type="button"
                  class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50"
                  disabled={downloading_all_reports}
                  on:click={handle_download_all_reports}
                >
                  {#if downloading_all_reports}
                    <svg
                      class="w-4 h-4 animate-spin"
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
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating All...
                  {:else}
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download All Reports
                  {/if}
                </button>
              </div>
              <div class="space-y-3">
                {#each completed_fixtures as fixture}
                  {@const home_score = fixture.home_team_score ?? 0}
                  {@const away_score = fixture.away_team_score ?? 0}
                  {@const fixture_stage_name = get_fixture_stage_name(
                    fixture.stage_id,
                  )}
                  {@const fixture_stage_type = get_fixture_stage_type(
                    fixture.stage_id,
                  )}
                  <div
                    class="w-full p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div
                      class="text-xs text-center text-gray-500 dark:text-gray-400 mb-2"
                    >
                      {format_date(fixture.scheduled_date)}
                    </div>
                    {#if fixture_stage_name}
                      <div class="mb-3 text-center">
                        <span
                          class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                        >
                          {fixture_stage_name}
                          {#if fixture_stage_type}
                            <span
                              class="text-primary-500 dark:text-primary-400"
                            >
                              • {fixture_stage_type}
                            </span>
                          {/if}
                        </span>
                      </div>
                    {/if}
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex-1 text-right">
                        <span
                          class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1 {home_score >
                          away_score
                            ? 'text-green-600 dark:text-green-400'
                            : ''}"
                        >
                          {get_team_name(fixture.home_team_id)}
                        </span>
                      </div>
                      <div class="flex-shrink-0 px-2 sm:px-4">
                        <div
                          class="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold"
                        >
                          <span
                            class={home_score > away_score
                              ? "text-green-600 dark:text-green-400"
                              : "text-accent-900 dark:text-accent-100"}
                          >
                            {home_score}
                          </span>
                          <span class="text-gray-400 text-base sm:text-lg"
                            >-</span
                          >
                          <span
                            class={away_score > home_score
                              ? "text-green-600 dark:text-green-400"
                              : "text-accent-900 dark:text-accent-100"}
                          >
                            {away_score}
                          </span>
                        </div>
                      </div>
                      <div class="flex-1 text-left">
                        <span
                          class="text-sm sm:text-base font-medium text-accent-900 dark:text-accent-100 line-clamp-1 {away_score >
                          home_score
                            ? 'text-green-600 dark:text-green-400'
                            : ''}"
                        >
                          {get_team_name(fixture.away_team_id)}
                        </span>
                      </div>
                    </div>
                    <div
                      class="flex justify-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700"
                    >
                      <button
                        type="button"
                        class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        on:click={() => goto(`/match-report/${fixture.id}`)}
                      >
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Details
                      </button>
                      <button
                        type="button"
                        class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                        disabled={downloading_fixture_id === fixture.id}
                        on:click={(e) =>
                          handle_download_match_report(fixture, e)}
                      >
                        {#if downloading_fixture_id === fixture.id}
                          <svg
                            class="w-4 h-4 animate-spin"
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
                            ></circle>
                            <path
                              class="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Generating...
                        {:else}
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Match Report
                        {/if}
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else if active_tab === "stats"}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3
                  class="text-base sm:text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4 flex items-center gap-2"
                >
                  <span>⚽</span> Top Scorers
                </h3>
                {#if player_stats.filter((p) => p.goals > 0).length === 0}
                  <div
                    class="text-center py-4 text-gray-500 dark:text-gray-400"
                  >
                    No goals scored yet.
                  </div>
                {:else}
                  <div class="space-y-2">
                    {#each player_stats
                      .filter((p) => p.goals > 0)
                      .slice(0, 10) as player, index}
                      <div
                        class="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-gray-900 rounded-lg"
                      >
                        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span
                            class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 flex items-center justify-center text-xs sm:text-sm font-bold rounded-full {index <
                            3
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}"
                          >
                            {index + 1}
                          </span>
                          <div class="min-w-0">
                            <div
                              class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
                            >
                              {player.player_name}
                            </div>
                            <div
                              class="text-xs text-gray-500 dark:text-gray-400 truncate"
                            >
                              {player.team_name}
                            </div>
                          </div>
                        </div>
                        <span
                          class="text-lg sm:text-xl font-bold text-accent-900 dark:text-accent-100 ml-2"
                        >
                          {player.goals}
                        </span>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3
                  class="text-base sm:text-lg font-semibold text-accent-900 dark:text-accent-100 mb-4 flex items-center gap-2"
                >
                  <span>🟨</span> Most Cards
                </h3>
                {#if player_stats.filter((p) => p.yellow_cards > 0 || p.red_cards > 0).length === 0}
                  <div
                    class="text-center py-4 text-gray-500 dark:text-gray-400"
                  >
                    No cards issued yet.
                  </div>
                {:else}
                  <div class="space-y-2">
                    {#each player_stats
                      .filter((p) => p.yellow_cards > 0 || p.red_cards > 0)
                      .sort((a, b) => b.yellow_cards + b.red_cards * 2 - (a.yellow_cards + a.red_cards * 2))
                      .slice(0, 10) as player}
                      <div
                        class="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-gray-900 rounded-lg"
                      >
                        <div class="min-w-0">
                          <div
                            class="text-sm font-medium text-accent-900 dark:text-accent-100 truncate"
                          >
                            {player.player_name}
                          </div>
                          <div
                            class="text-xs text-gray-500 dark:text-gray-400 truncate"
                          >
                            {player.team_name}
                          </div>
                        </div>
                        <div class="flex gap-2 sm:gap-3 ml-2">
                          {#if player.yellow_cards > 0}
                            <span class="flex items-center gap-1">
                              <span
                                class="w-2.5 h-3.5 sm:w-3 sm:h-4 bg-yellow-400 rounded-sm"
                              ></span>
                              <span
                                class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
                                >{player.yellow_cards}</span
                              >
                            </span>
                          {/if}
                          {#if player.red_cards > 0}
                            <span class="flex items-center gap-1">
                              <span
                                class="w-2.5 h-3.5 sm:w-3 sm:h-4 bg-red-500 rounded-sm"
                              ></span>
                              <span
                                class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
                                >{player.red_cards}</span
                              >
                            </span>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </LoadingStateWrapper>
</div>
