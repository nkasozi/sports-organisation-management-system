import type { Table } from "dexie";
import type {
  CompetitionTeam,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
} from "../../core/entities/CompetitionTeam";
import { create_competition_team_with_stats } from "../../core/entities/CompetitionTeam";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CompetitionTeamRepository,
  CompetitionTeamFilter,
} from "../../core/interfaces/adapters/CompetitionTeamRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type {
  PaginatedAsyncResult,
  AsyncResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "comp_team";

export class InBrowserCompetitionTeamRepository
  extends InBrowserBaseRepository<
    CompetitionTeam,
    CreateCompetitionTeamInput,
    UpdateCompetitionTeamInput
  >
  implements CompetitionTeamRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<CompetitionTeam, string> {
    return this.database.competition_teams;
  }

  protected create_entity_from_input(
    input: CreateCompetitionTeamInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): CompetitionTeam {
    return create_competition_team_with_stats(input, id, timestamps);
  }

  protected apply_updates_to_entity(
    entity: CompetitionTeam,
    updates: UpdateCompetitionTeamInput,
  ): CompetitionTeam {
    const updated_entity = {
      ...entity,
      ...updates,
    };
    if (
      updates.goals_for !== undefined ||
      updates.goals_against !== undefined
    ) {
      updated_entity.goal_difference =
        updated_entity.goals_for - updated_entity.goals_against;
    }
    return updated_entity;
  }

  async find_by_filter(
    filter: CompetitionTeamFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam> {
    try {
      let filtered_entities = await this.database.competition_teams.toArray();

      if (filter.competition_id) {
        filtered_entities = filtered_entities.filter(
          (ct) => ct.competition_id === filter.competition_id,
        );
      }

      if (filter.team_id) {
        filtered_entities = filtered_entities.filter(
          (ct) => ct.team_id === filter.team_id,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (ct) => ct.status === filter.status,
        );
      }

      const total_count = filtered_entities.length;
      const sorted_entities = this.apply_sort(filtered_entities, options);
      const paginated_entities = this.apply_pagination(
        sorted_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter competition teams: ${error_message}`,
      );
    }
  }

  async find_by_competition(
    competition_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam> {
    return this.find_by_filter({ competition_id }, options);
  }

  async find_by_team(
    team_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam> {
    return this.find_by_filter({ team_id }, options);
  }

  async find_team_in_competition(
    competition_id: string,
    team_id: string,
  ): AsyncResult<CompetitionTeam> {
    try {
      const all_entities = await this.database.competition_teams.toArray();

      const found = all_entities.find(
        (ct) => ct.competition_id === competition_id && ct.team_id === team_id,
      );

      if (!found) {
        return create_failure_result("Team not found in competition");
      }
      return create_success_result(found);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find team in competition: ${error_message}`,
      );
    }
  }

  async remove_team_from_competition(
    competition_id: string,
    team_id: string,
  ): AsyncResult<boolean> {
    try {
      const all_entities = await this.database.competition_teams.toArray();

      const found = all_entities.find(
        (ct) => ct.competition_id === competition_id && ct.team_id === team_id,
      );

      if (!found) {
        return create_failure_result("Team not found in competition");
      }

      return this.delete_by_id(found.id);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to remove team from competition: ${error_message}`,
      );
    }
  }
}

export function create_default_competition_teams(): CompetitionTeam[] {
  const now = new Date().toISOString();

  return [
    {
      id: "comp_team_default_1",
      competition_id: "comp_default_1",
      team_id: "team_default_1",
      registration_date: "2026-01-15",
      seed_number: 1,
      group_name: "Group A",
      points: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      matches_played: 0,
      matches_won: 0,
      matches_drawn: 0,
      matches_lost: 0,
      notes: "",
      status: "confirmed",
      created_at: now,
      updated_at: now,
    },
    {
      id: "comp_team_default_2",
      competition_id: "comp_default_1",
      team_id: "team_default_2",
      registration_date: "2026-01-15",
      seed_number: 2,
      group_name: "Group A",
      points: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      matches_played: 0,
      matches_won: 0,
      matches_drawn: 0,
      matches_lost: 0,
      notes: "",
      status: "confirmed",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserCompetitionTeamRepository | null = null;

export function get_competition_team_repository(): CompetitionTeamRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserCompetitionTeamRepository();
  }
  return singleton_instance;
}

export async function initialize_competition_team_repository(): Promise<void> {
  const repository =
    get_competition_team_repository() as InBrowserCompetitionTeamRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_competition_teams());
  }
}

export async function reset_competition_team_repository(): Promise<void> {
  const repository =
    get_competition_team_repository() as InBrowserCompetitionTeamRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_competition_teams());
}
