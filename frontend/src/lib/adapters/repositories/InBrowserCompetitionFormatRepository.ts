import type { Table } from "dexie";
import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
  FormatType,
} from "../../core/entities/CompetitionFormat";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CompetitionFormatRepository,
  CompetitionFormatFilter,
} from "../../core/interfaces/adapters/CompetitionFormatRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  get_default_competition_formats,
  create_default_league_config,
  create_default_group_stage_config,
  create_default_knockout_stage_config,
} from "../../core/entities/CompetitionFormat";

const ENTITY_PREFIX = "comp_fmt";

export class InBrowserCompetitionFormatRepository
  extends InBrowserBaseRepository<
    CompetitionFormat,
    CreateCompetitionFormatInput,
    UpdateCompetitionFormatInput
  >
  implements CompetitionFormatRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<CompetitionFormat, string> {
    return this.database.competition_formats;
  }

  protected create_entity_from_input(
    input: CreateCompetitionFormatInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): CompetitionFormat {
    return {
      id,
      ...timestamps,
      name: input.name,
      code: input.code,
      description: input.description,
      format_type: input.format_type,
      tie_breakers: input.tie_breakers,
      group_stage_config: input.group_stage_config,
      knockout_stage_config: input.knockout_stage_config,
      league_config: input.league_config,
      min_teams_required: input.min_teams_required,
      max_teams_allowed: input.max_teams_allowed,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: CompetitionFormat,
    updates: UpdateCompetitionFormatInput,
  ): CompetitionFormat {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: CompetitionFormatFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionFormat> {
    try {
      let filtered_entities = await this.database.competition_formats.toArray();

      if (filter.name_contains) {
        const search_term = filter.name_contains.toLowerCase();
        filtered_entities = filtered_entities.filter((format) =>
          format.name.toLowerCase().includes(search_term),
        );
      }

      if (filter.code) {
        filtered_entities = filtered_entities.filter(
          (format) => format.code === filter.code,
        );
      }

      if (filter.format_type) {
        filtered_entities = filtered_entities.filter(
          (format) => format.format_type === filter.format_type,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (format) => format.status === filter.status,
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
        `Failed to filter competition formats: ${error_message}`,
      );
    }
  }

  async find_by_format_type(
    format_type: FormatType,
  ): Promise<CompetitionFormat[]> {
    try {
      const all_formats = await this.database.competition_formats.toArray();
      return all_formats.filter(
        (format) =>
          format.format_type === format_type && format.status === "active",
      );
    } catch (error) {
      return [];
    }
  }

  async find_by_code(code: string): Promise<CompetitionFormat | null> {
    try {
      const all_formats = await this.database.competition_formats.toArray();
      const found = all_formats.find((format) => format.code === code);
      return found ?? null;
    } catch (error) {
      return null;
    }
  }

  async find_active_formats(): Promise<CompetitionFormat[]> {
    try {
      const all_formats = await this.database.competition_formats.toArray();
      return all_formats
        .filter((format) => format.status === "active")
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      return [];
    }
  }
}

export function create_default_competition_formats_data(): CompetitionFormat[] {
  const now = new Date().toISOString();
  const default_inputs = get_default_competition_formats();

  return default_inputs.map((input, index) => ({
    id: `comp_fmt_default_${index + 1}`,
    created_at: now,
    updated_at: now,
    name: input.name,
    code: input.code,
    description: input.description,
    format_type: input.format_type,
    tie_breakers: input.tie_breakers,
    group_stage_config: input.group_stage_config,
    knockout_stage_config: input.knockout_stage_config,
    league_config: input.league_config,
    min_teams_required: input.min_teams_required,
    max_teams_allowed: input.max_teams_allowed,
    status: input.status,
  }));
}

let singleton_instance: InBrowserCompetitionFormatRepository | null = null;

export function get_competition_format_repository(): CompetitionFormatRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserCompetitionFormatRepository();
  }
  return singleton_instance;
}

export async function initialize_competition_format_repository(): Promise<void> {
  const repository =
    get_competition_format_repository() as InBrowserCompetitionFormatRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_competition_formats_data());
  }
}

export async function reset_competition_format_repository(): Promise<void> {
  const repository =
    get_competition_format_repository() as InBrowserCompetitionFormatRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_competition_formats_data());
}
