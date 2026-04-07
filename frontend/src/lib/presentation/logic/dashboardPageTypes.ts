import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type { Result } from "$lib/core/types/Result";

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

export interface ListPort<TFilter> {
  list(
    filter?: TFilter,
    options?: { page_number?: number; page_size?: number },
  ): Promise<Result<{ items: unknown[]; total_count: number }>>;
}

export interface GetByIdPort<TEntity> {
  get_by_id(identifier: string): Promise<Result<TEntity>>;
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
