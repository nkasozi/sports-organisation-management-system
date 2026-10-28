import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../../core/entities/Competition";
import { DEFAULT_MAX_EVENT_EDITS_PER_GAME } from "../../core/entities/CompetitionConstants";
import type {
  CompetitionFilter,
  CompetitionRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { create_default_competitions } from "./InBrowserCompetitionRepositoryDefaults";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "comp";

export class InBrowserCompetitionRepository
  extends InBrowserBaseRepository<
    Competition,
    CreateCompetitionInput,
    UpdateCompetitionInput,
    CompetitionFilter
  >
  implements CompetitionRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Competition, string> {
    return this.database.competitions;
  }

  protected create_entity_from_input(
    input: CreateCompetitionInput,
    id: Competition["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Competition {
    return {
      id,
      ...timestamps,
      name: input.name,
      description: input.description,
      organization_id: input.organization_id,
      competition_format_id: input.competition_format_id,
      team_ids: input.team_ids || [],
      allow_auto_squad_submission: input.allow_auto_squad_submission || false,
      squad_generation_strategy:
        input.squad_generation_strategy || "first_available",
      allow_auto_fixture_details_setup:
        input.allow_auto_fixture_details_setup || false,
      lineup_submission_deadline_hours:
        input.lineup_submission_deadline_hours ?? 2,
      max_event_edits_per_game:
        input.max_event_edits_per_game ?? DEFAULT_MAX_EVENT_EDITS_PER_GAME,
      start_date: input.start_date,
      end_date: input.end_date,
      registration_deadline: input.registration_deadline,
      max_teams: input.max_teams,
      entry_fee: input.entry_fee,
      prize_pool: input.prize_pool,
      location: input.location,
      rule_overrides: input.rule_overrides || {},
      status: input.status,
    } as Competition;
  }

  protected apply_updates_to_entity(
    entity: Competition,
    updates: UpdateCompetitionInput,
  ): Competition {
    return {
      ...entity,
      ...updates,
    } as Competition;
  }

  protected apply_entity_filter(
    entities: Competition[],
    filter: CompetitionFilter,
  ): Competition[] {
    let filtered_entities = entities;

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_entities = filtered_entities.filter((competition) =>
        competition.name.toLowerCase().includes(search_term),
      );
    }

    if (filter.organization_id) {
      filtered_entities = filtered_entities.filter(
        (competition) => competition.organization_id === filter.organization_id,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (competition) => competition.status === filter.status,
      );
    }

    const { start_date_after, start_date_before } = filter;
    if (start_date_after) {
      filtered_entities = filtered_entities.filter(
        (competition) => competition.start_date >= start_date_after,
      );
    }

    if (start_date_before) {
      filtered_entities = filtered_entities.filter(
        (competition) => competition.start_date <= start_date_before,
      );
    }

    return filtered_entities;
  }

  async find_by_organization(
    organization_id: Competition["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition> {
    return this.find_all({ organization_id }, options);
  }

  async find_active_competitions(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition> {
    return this.find_all({ status: "active" }, options);
  }
}

const get_concrete_repository: () => InBrowserCompetitionRepository =
  create_lazy_repository_accessor(() => new InBrowserCompetitionRepository());

export function get_competition_repository(): CompetitionRepository {
  return get_concrete_repository();
}

export function reset_competition_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    get_concrete_repository().with_write_origin(origin),
    create_default_competitions(),
  );
}
