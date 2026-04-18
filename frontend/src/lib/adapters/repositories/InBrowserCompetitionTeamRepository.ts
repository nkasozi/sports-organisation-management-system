import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CompetitionTeam,
  CreateCompetitionTeamInput,
  UpdateCompetitionTeamInput,
} from "../../core/entities/CompetitionTeam";
import { create_competition_team_with_stats } from "../../core/entities/CompetitionTeam";
import type {
  CompetitionTeamFilter,
  CompetitionTeamRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { create_default_competition_teams } from "./InBrowserCompetitionTeamRepositoryDefaults";

const ENTITY_PREFIX = "comp_team";

export class InBrowserCompetitionTeamRepository
  extends InBrowserBaseRepository<
    CompetitionTeam,
    CreateCompetitionTeamInput,
    UpdateCompetitionTeamInput,
    CompetitionTeamFilter
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
    id: CompetitionTeam["id"],
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
    } as CompetitionTeam;
    if ("goals_for" in updates || "goals_against" in updates) {
      updated_entity.goal_difference =
        updated_entity.goals_for - updated_entity.goals_against;
    }
    return updated_entity;
  }

  protected apply_entity_filter(
    entities: CompetitionTeam[],
    filter: CompetitionTeamFilter,
  ): CompetitionTeam[] {
    let filtered_entities = entities;
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

    return filtered_entities;
  }

  async find_by_competition(
    competition_id: CompetitionTeam["competition_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam> {
    return this.find_all({ competition_id }, options);
  }

  async find_by_team(
    team_id: CompetitionTeam["team_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionTeam> {
    return this.find_all({ team_id }, options);
  }

  async find_team_in_competition(
    competition_id: CompetitionTeam["competition_id"],
    team_id: CompetitionTeam["team_id"],
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
      console.warn(
        "[CompetitionTeamRepository] Failed to find team in competition",
        {
          event: "repository_find_team_in_competition_failed",
          error: String(error),
        },
      );
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find team in competition: ${error_message}`,
      );
    }
  }

  async remove_team_from_competition(
    competition_id: CompetitionTeam["competition_id"],
    team_id: CompetitionTeam["team_id"],
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
      console.warn(
        "[CompetitionTeamRepository] Failed to remove team from competition",
        {
          event: "repository_remove_team_from_competition_failed",
          error: String(error),
        },
      );
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to remove team from competition: ${error_message}`,
      );
    }
  }
}

type CompetitionTeamRepositoryState =
  | { status: "uninitialized" }
  | {
      status: "ready";
      repository: InBrowserCompetitionTeamRepository;
    };

let competition_team_repository_state: CompetitionTeamRepositoryState = {
  status: "uninitialized",
};

export function get_competition_team_repository(): CompetitionTeamRepository {
  if (competition_team_repository_state.status === "ready") {
    return competition_team_repository_state.repository;
  }

  const repository = new InBrowserCompetitionTeamRepository();
  competition_team_repository_state = { status: "ready", repository };

  return repository;
}

export async function reset_competition_team_repository(): Promise<void> {
  const repository =
    get_competition_team_repository() as InBrowserCompetitionTeamRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_competition_teams());
}
