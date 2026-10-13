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
import {
  create_warning_failure_details,
  run_repository_query,
  with_failure_context,
} from "./InBrowserRepositoryQueryRunner";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "comp_team";
const TEAM_NOT_IN_COMPETITION_MESSAGE = "Team not found in competition";

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

  find_team_in_competition(
    competition_id: CompetitionTeam["competition_id"],
    team_id: CompetitionTeam["team_id"],
  ): AsyncResult<CompetitionTeam> {
    return run_repository_query(
      with_failure_context(
        create_warning_failure_details(
          "[CompetitionTeamRepository] Failed to find team in competition",
          "repository_find_team_in_competition_failed",
          "find team in competition",
        ),
        { competition_id, team_id },
      ),
      async () => {
        const found = (await this.database.competition_teams.toArray()).find(
          (ct) =>
            ct.competition_id === competition_id && ct.team_id === team_id,
        );
        return found
          ? create_success_result(found)
          : create_failure_result(TEAM_NOT_IN_COMPETITION_MESSAGE);
      },
    );
  }

  async remove_team_from_competition(
    competition_id: CompetitionTeam["competition_id"],
    team_id: CompetitionTeam["team_id"],
  ): AsyncResult<boolean> {
    const found_result = await this.find_team_in_competition(
      competition_id,
      team_id,
    );
    if (!found_result.success) return found_result;
    return this.delete_by_id(found_result.data.id);
  }
}

const get_concrete_repository: () => InBrowserCompetitionTeamRepository =
  create_lazy_repository_accessor(
    () => new InBrowserCompetitionTeamRepository(),
  );

export function get_competition_team_repository(): CompetitionTeamRepository {
  return get_concrete_repository();
}

export function reset_competition_team_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    get_concrete_repository().with_write_origin(origin),
    create_default_competition_teams(),
  );
}
