import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../../core/entities/Competition";
import type {
  CompetitionFilter,
  CompetitionRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { create_default_competitions } from "./InBrowserCompetitionRepositoryDefaults";

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
    id: string,
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
      start_date: input.start_date,
      end_date: input.end_date,
      registration_deadline: input.registration_deadline,
      max_teams: input.max_teams,
      entry_fee: input.entry_fee,
      prize_pool: input.prize_pool,
      location: input.location,
      rule_overrides: input.rule_overrides || {},
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: Competition,
    updates: UpdateCompetitionInput,
  ): Competition {
    return {
      ...entity,
      ...updates,
    };
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

    if (filter.start_date_after) {
      filtered_entities = filtered_entities.filter(
        (competition) => competition.start_date >= filter.start_date_after!,
      );
    }

    if (filter.start_date_before) {
      filtered_entities = filtered_entities.filter(
        (competition) => competition.start_date <= filter.start_date_before!,
      );
    }

    return filtered_entities;
  }

  async find_by_organization(
    organization_id: string,
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

let singleton_instance: InBrowserCompetitionRepository | null = null;

export function get_competition_repository(): CompetitionRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserCompetitionRepository();
  }
  return singleton_instance;
}

export async function reset_competition_repository(): Promise<void> {
  const repository =
    get_competition_repository() as InBrowserCompetitionRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_competitions());
}
