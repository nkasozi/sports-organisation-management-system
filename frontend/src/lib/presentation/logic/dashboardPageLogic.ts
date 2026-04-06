import type { Result } from "$lib/core/types/Result";
import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type { DashboardFilters } from "./dashboardStatsLogic";

export interface DashboardStats {
  organizations: number;
  competitions: number;
  teams: number;
  players: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_competitions: Competition[];
  upcoming_fixtures: Fixture[];
  teams_map: Map<string, Team>;
  competition_names: Record<string, string>;
  sport_names: Record<string, string>;
  competition_sport_names: Record<string, string>;
}

interface ListPort<TFilter> {
  list(
    filter?: TFilter,
    options?: { page_number?: number; page_size?: number },
  ): Promise<Result<{ items: unknown[]; total_count: number }>>;
}

interface GetByIdPort<TEntity> {
  get_by_id(
    identifier: string,
  ): Promise<Result<TEntity>>;
}

export interface DashboardDependencies {
  organization_use_cases: ListPort<unknown> &
    GetByIdPort<{ id: string; sport_id: string }>;
  competition_use_cases: ListPort<unknown> &
    GetByIdPort<{ id: string; name: string; organization_id: string }>;
  team_use_cases: ListPort<unknown>;
  player_use_cases: ListPort<unknown>;
  fixture_use_cases: ListPort<unknown>;
  sport_use_cases: GetByIdPort<{ id: string; name: string }>;
}

const RECENT_COMPETITIONS_LIMIT = 3;
const UPCOMING_FIXTURES_LIMIT = 3;
const UNKNOWN_SPORT_LABEL = "Unknown Sport";
const UNKNOWN_COMPETITION_LABEL = "Unknown Competition";

export function get_competition_initials(name: string): string {
  return name
    .split(" ")
    .map((word: string) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export interface OrganizationNameParts {
  prefix: string;
  suffix: string;
  remainder: string;
}

export function split_organization_name(
  name: string,
): OrganizationNameParts {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { prefix: "", suffix: parts[0], remainder: "" };
  }
  return {
    prefix: parts[0],
    suffix: parts[1],
    remainder: parts.slice(2).join(" "),
  };
}

export function get_status_class(status: string): string {
  switch (status) {
    case "active":
    case "in_progress":
      return "status-active";
    case "upcoming":
    case "scheduled":
      return "status-warning";
    case "completed":
    case "finished":
      return "status-inactive";
    default:
      return "status-inactive";
  }
}

export function format_fixture_date(
  scheduled_date: string,
  scheduled_time: string,
): string {
  const fixture_date = new Date(scheduled_date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const is_today =
    fixture_date.toDateString() === today.toDateString();
  const is_tomorrow =
    fixture_date.toDateString() === tomorrow.toDateString();

  const time_formatted = scheduled_time || "TBD";

  if (is_today) return `Today, ${time_formatted}`;
  if (is_tomorrow) return `Tomorrow, ${time_formatted}`;

  const date_label = fixture_date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${date_label}, ${time_formatted}`;
}

function extract_stats(
  filters: DashboardFilters,
  org_result: Result<{ items: unknown[]; total_count: number }>,
  comp_result: Result<{ items: unknown[]; total_count: number }>,
  team_result: Result<{ items: unknown[]; total_count: number }>,
  player_result: Result<{ items: unknown[]; total_count: number }>,
): DashboardStats {
  return {
    organizations:
      filters.organization_count_override ??
      (org_result.success ? (org_result.data?.total_count ?? 0) : 0),
    competitions: comp_result.success
      ? (comp_result.data?.total_count ?? 0)
      : 0,
    teams: team_result.success
      ? (team_result.data?.total_count ?? 0)
      : 0,
    players: player_result.success
      ? (player_result.data?.total_count ?? 0)
      : 0,
  };
}

async function resolve_sport_names_for_competitions(
  competitions: Competition[],
  dependencies: DashboardDependencies,
): Promise<Record<string, string>> {
  const resolved_names: Record<string, string> = {};

  for (const competition of competitions) {
    if (!competition.id) continue;

    const org_result =
      await dependencies.organization_use_cases.get_by_id(
        competition.organization_id,
      );
    if (!org_result.success || !org_result.data) {
      resolved_names[competition.id] = UNKNOWN_SPORT_LABEL;
      continue;
    }

    const sport_result =
      await dependencies.sport_use_cases.get_by_id(
        org_result.data.sport_id,
      );
    resolved_names[competition.id] =
      sport_result.success && sport_result.data
        ? sport_result.data.name
        : UNKNOWN_SPORT_LABEL;
  }

  return resolved_names;
}

async function resolve_fixture_display_names(
  fixtures: Fixture[],
  dependencies: DashboardDependencies,
): Promise<{
  competition_names: Record<string, string>;
  sport_names: Record<string, string>;
}> {
  const resolved_competition_names: Record<string, string> = {};
  const resolved_sport_names: Record<string, string> = {};

  const competition_ids = [
    ...new Set(
      fixtures.map((fixture: Fixture) => fixture.competition_id).filter(Boolean),
    ),
  ];

  for (const competition_id of competition_ids) {
    const comp_result =
      await dependencies.competition_use_cases.get_by_id(competition_id);
    if (!comp_result.success || !comp_result.data) {
      resolved_competition_names[competition_id] = UNKNOWN_COMPETITION_LABEL;
      resolved_sport_names[competition_id] = UNKNOWN_SPORT_LABEL;
      continue;
    }

    resolved_competition_names[competition_id] = comp_result.data.name;

    const org_result =
      await dependencies.organization_use_cases.get_by_id(
        comp_result.data.organization_id,
      );
    if (!org_result.success || !org_result.data) {
      resolved_sport_names[competition_id] = UNKNOWN_SPORT_LABEL;
      continue;
    }

    const sport_result =
      await dependencies.sport_use_cases.get_by_id(
        org_result.data.sport_id,
      );
    resolved_sport_names[competition_id] =
      sport_result.success && sport_result.data
        ? sport_result.data.name
        : UNKNOWN_SPORT_LABEL;
  }

  return {
    competition_names: resolved_competition_names,
    sport_names: resolved_sport_names,
  };
}

export async function load_dashboard_data(
  dependencies: DashboardDependencies,
  filters: DashboardFilters,
): Promise<Result<DashboardData>> {
  const [
    org_result,
    comp_result,
    team_result,
    player_result,
    fixture_result,
  ] = await Promise.all([
    dependencies.organization_use_cases.list(undefined, {
      page_number: 1,
      page_size: 1,
    }),
    dependencies.competition_use_cases.list(
      filters.organization_filter,
      { page_number: 1, page_size: 5 },
    ),
    dependencies.team_use_cases.list(filters.organization_filter, {
      page_number: 1,
      page_size: 100,
    }),
    dependencies.player_use_cases.list(filters.organization_filter, {
      page_number: 1,
      page_size: 1,
    }),
    dependencies.fixture_use_cases.list(filters.fixture_filter, {
      page_number: 1,
      page_size: 5,
    }),
  ]);

  const stats = extract_stats(
    filters,
    org_result,
    comp_result,
    team_result,
    player_result,
  );

  const recent_competitions =
    comp_result.success && comp_result.data
      ? (comp_result.data.items as Competition[]).slice(
          0,
          RECENT_COMPETITIONS_LIMIT,
        )
      : [];

  const competition_sport_names =
    await resolve_sport_names_for_competitions(
      recent_competitions,
      dependencies,
    );

  const teams_map: Map<string, Team> =
    team_result.success && team_result.data
      ? new Map(
          (team_result.data.items as Team[]).map((team: Team) => [
            team.id,
            team,
          ]),
        )
      : new Map();

  const sorted_fixtures =
    fixture_result.success && fixture_result.data
      ? (fixture_result.data.items as Fixture[])
          .sort(
            (first: Fixture, second: Fixture) =>
              new Date(first.scheduled_date).getTime() -
              new Date(second.scheduled_date).getTime(),
          )
          .slice(0, UPCOMING_FIXTURES_LIMIT)
      : [];

  const fixture_display_names =
    await resolve_fixture_display_names(sorted_fixtures, dependencies);

  return {
    success: true,
    data: {
      stats,
      recent_competitions,
      upcoming_fixtures: sorted_fixtures,
      teams_map,
      competition_names: fixture_display_names.competition_names,
      sport_names: fixture_display_names.sport_names,
      competition_sport_names,
    },
  };
}
