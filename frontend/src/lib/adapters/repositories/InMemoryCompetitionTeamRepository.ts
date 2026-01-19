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
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_competition_teams";
const ENTITY_PREFIX = "comp_team";

export class InMemoryCompetitionTeamRepository
  extends InMemoryBaseRepository<
    CompetitionTeam,
    CreateCompetitionTeamInput,
    UpdateCompetitionTeamInput
  >
  implements CompetitionTeamRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
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
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

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
    const paginated_entities = this.apply_pagination_and_sort(
      filtered_entities,
      options,
    );

    return create_success_result(
      this.create_paginated_result(paginated_entities, total_count, options),
    );
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
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const found = Array.from(this.entity_cache.values()).find(
      (ct) => ct.competition_id === competition_id && ct.team_id === team_id,
    );

    if (!found) {
      return create_failure_result("Team not found in competition");
    }
    return create_success_result(found);
  }

  async remove_team_from_competition(
    competition_id: string,
    team_id: string,
  ): AsyncResult<boolean> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const found = Array.from(this.entity_cache.values()).find(
      (ct) => ct.competition_id === competition_id && ct.team_id === team_id,
    );

    if (!found) {
      return create_failure_result("Team not found in competition");
    }

    return this.delete_by_id(found.id);
  }
}

let repository_instance: InMemoryCompetitionTeamRepository | null = null;

export function get_competition_team_repository(): CompetitionTeamRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryCompetitionTeamRepository();
  }
  return repository_instance;
}

export function reset_competition_team_repository(): void {
  repository_instance = null;
}
