import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  FormatType,
  UpdateCompetitionFormatInput,
} from "../../core/entities/CompetitionFormat";
import { get_default_competition_formats_for_organization as get_default_competition_formats_for_organization_core } from "../../core/entities/CompetitionFormat";
import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import type {
  CompetitionFormatFilter,
  CompetitionFormatRepository,
} from "../../core/interfaces/ports";
import { build_competition_format_not_found_by_code_error } from "../../core/interfaces/ports";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "comp_fmt";

export class InBrowserCompetitionFormatRepository
  extends InBrowserBaseRepository<
    CompetitionFormat,
    CreateCompetitionFormatInput,
    UpdateCompetitionFormatInput,
    CompetitionFormatFilter
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
    id: CompetitionFormat["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): CompetitionFormat {
    return {
      id: id as CompetitionFormat["id"],
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
      points_config: input.points_config,
      stage_templates: input.stage_templates ?? [],
      organization_id: input.organization_id,
    } as CompetitionFormat;
  }

  protected apply_updates_to_entity(
    entity: CompetitionFormat,
    updates: UpdateCompetitionFormatInput,
  ): CompetitionFormat {
    return {
      ...entity,
      ...updates,
    } as CompetitionFormat;
  }

  protected apply_entity_filter(
    entities: CompetitionFormat[],
    filter: CompetitionFormatFilter,
  ): CompetitionFormat[] {
    let filtered_entities = entities;
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
    if (filter.organization_id) {
      filtered_entities = filtered_entities.filter(
        (format) => format.organization_id === filter.organization_id,
      );
    }
    return filtered_entities;
  }

  async find_by_format_type(
    format_type: FormatType,
  ): Promise<Result<CompetitionFormat[]>> {
    try {
      const all_formats = await this.database.competition_formats.toArray();
      return create_success_result(
        all_formats.filter(
          (format) =>
            format.format_type === format_type &&
            format.status === ENTITY_STATUS.ACTIVE,
        ),
      );
    } catch (error) {
      console.warn(
        "[CompetitionFormatRepository] Failed to find formats by type",
        {
          event: "repository_find_formats_by_type_failed",
          error: String(error),
        },
      );
      return create_failure_result(`Failed to find formats by type: ${error}`);
    }
  }

  async find_by_code(code: string): Promise<Result<CompetitionFormat>> {
    try {
      const all_formats = await this.database.competition_formats.toArray();
      const found = all_formats.find((format) => format.code === code);
      if (!found) {
        return create_failure_result(
          build_competition_format_not_found_by_code_error(code),
        );
      }
      return create_success_result(found);
    } catch (error) {
      console.warn(
        "[CompetitionFormatRepository] Failed to find format by code",
        {
          event: "repository_find_format_by_code_failed",
          error: String(error),
        },
      );
      return create_failure_result(`Failed to find format by code: ${error}`);
    }
  }

  async find_active_formats(): Promise<Result<CompetitionFormat[]>> {
    try {
      const all_formats = await this.database.competition_formats.toArray();
      return create_success_result(
        all_formats
          .filter((format) => format.status === ENTITY_STATUS.ACTIVE)
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (error) {
      console.warn(
        "[CompetitionFormatRepository] Failed to find active formats",
        {
          event: "repository_find_active_formats_failed",
          error: String(error),
        },
      );
      return create_failure_result(`Failed to find active formats: ${error}`);
    }
  }

  async find_by_organization(
    organization_id: CompetitionFormat["organization_id"],
    options?: import("../../core/interfaces/ports").QueryOptions,
  ): ReturnType<
    import("../../core/interfaces/ports").CompetitionFormatRepository["find_by_organization"]
  > {
    return this.find_all({ organization_id }, options);
  }
}

type CompetitionFormatRepositoryState =
  | { status: "uninitialized" }
  | { status: "ready"; repository: InBrowserCompetitionFormatRepository };

let competition_format_repository_state: CompetitionFormatRepositoryState = {
  status: "uninitialized",
};

export function get_competition_format_repository(): CompetitionFormatRepository {
  if (competition_format_repository_state.status === "ready") {
    return competition_format_repository_state.repository;
  }

  const repository = new InBrowserCompetitionFormatRepository();
  competition_format_repository_state = { status: "ready", repository };

  return repository;
}
export async function reset_competition_format_repository(): Promise<void> {
  const repository =
    get_competition_format_repository() as InBrowserCompetitionFormatRepository;
  await repository.clear_all_data();
}

export function create_default_competition_formats_for_organization(
  organization_id: NonNullable<CreateCompetitionFormatInput["organization_id"]>,
): import("$lib/core/types/DomainScalars").ScalarInput<CompetitionFormat>[] {
  return get_default_competition_formats_for_organization_core(organization_id);
}
