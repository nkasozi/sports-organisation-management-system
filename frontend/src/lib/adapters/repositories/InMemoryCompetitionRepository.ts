import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "../../core/entities/Competition";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CompetitionRepository,
  CompetitionFilter,
} from "../../core/interfaces/adapters/CompetitionRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_competitions";
const ENTITY_PREFIX = "comp";

export class InMemoryCompetitionRepository
  extends InMemoryBaseRepository<
    Competition,
    CreateCompetitionInput,
    UpdateCompetitionInput
  >
  implements CompetitionRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
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
      auto_generate_fixtures_and_assign_officials:
        input.auto_generate_fixtures_and_assign_officials || false,
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

  async find_by_filter(
    filter: CompetitionFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_entities = filtered_entities.filter((comp) =>
        comp.name.toLowerCase().includes(search_term),
      );
    }

    if (filter.organization_id) {
      filtered_entities = filtered_entities.filter(
        (comp) => comp.organization_id === filter.organization_id,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (comp) => comp.status === filter.status,
      );
    }

    if (filter.start_date_after) {
      filtered_entities = filtered_entities.filter(
        (comp) => comp.start_date >= filter.start_date_after!,
      );
    }

    if (filter.start_date_before) {
      filtered_entities = filtered_entities.filter(
        (comp) => comp.start_date <= filter.start_date_before!,
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

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition> {
    return this.find_by_filter({ organization_id }, options);
  }

  async find_active_competitions(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition> {
    return this.find_by_filter({ status: "active" }, options);
  }
}

function create_default_competitions(): Competition[] {
  const now = new Date().toISOString();
  const next_month = new Date();
  next_month.setMonth(next_month.getMonth() + 1);
  const three_months = new Date();
  three_months.setMonth(three_months.getMonth() + 3);

  return [
    {
      id: "comp_default_1",
      name: "Summer Cup 2026",
      description: "Annual summer football tournament",
      organization_id: "org_default_1",
      team_ids: ["team_default_1", "team_default_2", "team_default_3"],
      auto_generate_fixtures_and_assign_officials: false,
      start_date: next_month.toISOString().split("T")[0],
      end_date: three_months.toISOString().split("T")[0],
      registration_deadline: new Date().toISOString().split("T")[0],
      max_teams: 16,
      entry_fee: 500,
      prize_pool: 10000,
      location: "City Stadium",
      status: "active",
      rule_overrides: {},
      competition_format_id: "format_standard_league",
      created_at: now,
      updated_at: now,
    },
    {
      id: "comp_default_2",
      name: "Premier League Season 2026",
      description: "Full season league competition",
      organization_id: "org_default_1",
      team_ids: ["team_default_1", "team_default_2"],
      auto_generate_fixtures_and_assign_officials: false,
      start_date: "2026-01-15",
      end_date: "2026-06-30",
      registration_deadline: "2026-01-01",
      max_teams: 20,
      entry_fee: 1000,
      prize_pool: 50000,
      location: "Various Venues",
      status: "active",
      rule_overrides: {},
      competition_format_id: "format_standard_league",
      created_at: now,
      updated_at: now,
    },
    {
      id: "comp_default_3",
      name: "Basketball Showcase 2026",
      description: "Regional basketball championship",
      organization_id: "org_default_2",
      team_ids: ["team_default_4"],
      auto_generate_fixtures_and_assign_officials: false,
      start_date: next_month.toISOString().split("T")[0],
      end_date: three_months.toISOString().split("T")[0],
      registration_deadline: new Date().toISOString().split("T")[0],
      max_teams: 12,
      entry_fee: 750,
      prize_pool: 15000,
      location: "Arena Sports Complex",
      status: "active",
      rule_overrides: {},
      competition_format_id: "format_standard_league",
      created_at: now,
      updated_at: now,
    },
    {
      id: "comp_default_4",
      name: "International Field Hockey Championship",
      description: "Premier field hockey competition featuring top teams",
      organization_id: "org_default_4",
      team_ids: ["team_default_5", "team_default_6"],
      auto_generate_fixtures_and_assign_officials: true,
      start_date: next_month.toISOString().split("T")[0],
      end_date: three_months.toISOString().split("T")[0],
      registration_deadline: new Date().toISOString().split("T")[0],
      max_teams: 6,
      entry_fee: 2500,
      prize_pool: 50000,
      location: "International Hockey Stadium",
      status: "active",
      rule_overrides: {},
      competition_format_id: "format_standard_league",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InMemoryCompetitionRepository | null = null;

export function get_competition_repository(): CompetitionRepository {
  if (!singleton_instance) {
    singleton_instance = new InMemoryCompetitionRepository();
    singleton_instance["ensure_cache_initialized"]();
  }

  return singleton_instance;
}

export function reset_competition_repository(): void {
  if (singleton_instance) {
    singleton_instance.clear_all_data();
  }
}
