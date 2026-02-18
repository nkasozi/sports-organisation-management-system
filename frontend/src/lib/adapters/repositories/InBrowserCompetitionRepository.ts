import type { Table } from "dexie";
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
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "comp";

export class InBrowserCompetitionRepository
  extends InBrowserBaseRepository<
    Competition,
    CreateCompetitionInput,
    UpdateCompetitionInput
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

  async find_by_filter(
    filter: CompetitionFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Competition> {
    try {
      let filtered_entities = await this.database.competitions.toArray();

      if (filter.name_contains) {
        const search_term = filter.name_contains.toLowerCase();
        filtered_entities = filtered_entities.filter((competition) =>
          competition.name.toLowerCase().includes(search_term),
        );
      }

      if (filter.organization_id) {
        filtered_entities = filtered_entities.filter(
          (competition) =>
            competition.organization_id === filter.organization_id,
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
        `Failed to filter competitions: ${error_message}`,
      );
    }
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

export function create_default_competitions(): Competition[] {
  const now = new Date().toISOString();

  return [
    {
      id: "comp_default_1",
      name: "Easter Cup 2026",
      description:
        "Annual Easter hockey tournament - Uganda's most prestigious knockout competition",
      organization_id: "org_default_1",
      team_ids: [
        "team_default_1",
        "team_default_2",
        "team_default_3",
        "team_default_4",
        "team_default_5",
        "team_default_6",
        "team_default_7",
        "team_default_8",
      ],
      allow_auto_squad_submission: true,
      allow_auto_fixture_details_setup: true,
      squad_generation_strategy: "first_available",
      lineup_submission_deadline_hours: 2,
      start_date: "2026-04-03",
      end_date: "2026-04-06",
      registration_deadline: "2026-03-25",
      max_teams: 16,
      entry_fee: 500000,
      prize_pool: 5000000,
      location: "Lugogo Hockey Stadium, Kampala",
      status: "active",
      rule_overrides: {},
      competition_format_id: "format_standard_league",
      created_at: now,
      updated_at: now,
    },
    {
      id: "comp_default_2",
      name: "Uganda Cup 2026",
      description:
        "The national knockout cup competition open to all registered hockey clubs",
      organization_id: "org_default_1",
      team_ids: [
        "team_default_1",
        "team_default_2",
        "team_default_3",
        "team_default_4",
        "team_default_5",
        "team_default_6",
      ],
      allow_auto_squad_submission: true,
      allow_auto_fixture_details_setup: true,
      squad_generation_strategy: "first_available",
      lineup_submission_deadline_hours: 2,
      start_date: "2026-06-01",
      end_date: "2026-08-30",
      registration_deadline: "2026-05-15",
      max_teams: 16,
      entry_fee: 300000,
      prize_pool: 3000000,
      location: "Various Venues",
      status: "active",
      rule_overrides: {},
      competition_format_id: "format_standard_league",
      created_at: now,
      updated_at: now,
    },
    {
      id: "comp_default_3",
      name: "National Hockey League 2026",
      description:
        "Full season league competition - the premier hockey league in Uganda",
      organization_id: "org_default_1",
      team_ids: [
        "team_default_1",
        "team_default_2",
        "team_default_3",
        "team_default_4",
        "team_default_5",
        "team_default_6",
      ],
      allow_auto_squad_submission: true,
      allow_auto_fixture_details_setup: true,
      squad_generation_strategy: "first_available",
      lineup_submission_deadline_hours: 2,
      start_date: "2026-02-01",
      end_date: "2026-11-30",
      registration_deadline: "2026-01-15",
      max_teams: 12,
      entry_fee: 1000000,
      prize_pool: 10000000,
      location: "Various Venues",
      status: "active",
      rule_overrides: {},
      competition_format_id: "format_standard_league",
      created_at: now,
      updated_at: now,
    },
    {
      id: "comp_default_4",
      name: "Inter-University Hockey Championship 2026",
      description:
        "Annual championship for university hockey teams across Uganda",
      organization_id: "org_default_1",
      team_ids: ["team_default_5", "team_default_6"],
      allow_auto_squad_submission: true,
      allow_auto_fixture_details_setup: true,
      squad_generation_strategy: "first_available",
      lineup_submission_deadline_hours: 2,
      start_date: "2026-02-15",
      end_date: "2026-03-15",
      registration_deadline: "2026-02-01",
      max_teams: 8,
      entry_fee: 200000,
      prize_pool: 2000000,
      location: "Makerere Hockey Ground",
      status: "active",
      rule_overrides: {},
      competition_format_id: "format_standard_league",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserCompetitionRepository | null = null;

export function get_competition_repository(): CompetitionRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserCompetitionRepository();
  }
  return singleton_instance;
}

export async function initialize_competition_repository(): Promise<void> {
  const repository =
    get_competition_repository() as InBrowserCompetitionRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_competitions());
  }
}

export async function reset_competition_repository(): Promise<void> {
  const repository =
    get_competition_repository() as InBrowserCompetitionRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_competitions());
}
