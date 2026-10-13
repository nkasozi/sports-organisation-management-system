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
import type { AsyncResult, Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  text_contains_rule,
} from "./InBrowserRepositoryFilterRules";
import {
  create_warning_failure_details,
  type RepositoryFailureDetails,
  run_repository_query,
} from "./InBrowserRepositoryQueryRunner";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "comp_fmt";

const FORMAT_FILTER_RULES: EntityFilterRule<
  CompetitionFormat,
  CompetitionFormatFilter
>[] = [
  text_contains_rule("name_contains", (format) => format.name),
  equals_rule("code"),
  equals_rule("format_type"),
  equals_rule("status"),
  equals_rule("organization_id"),
];

function describe_format_failure(
  subject: string,
  event_name: string,
): RepositoryFailureDetails {
  return create_warning_failure_details(
    `[CompetitionFormatRepository] Failed to find ${subject}`,
    `repository_${event_name}_failed`,
    `find ${subject}`,
  );
}

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
    return apply_entity_filter_rules(entities, filter, FORMAT_FILTER_RULES);
  }

  async find_by_format_type(
    format_type: FormatType,
  ): Promise<Result<CompetitionFormat[]>> {
    return this.query_formats(
      describe_format_failure("formats by type", "find_formats_by_type"),
      (formats) =>
        create_success_result(
          formats.filter(
            (format) =>
              format.format_type === format_type &&
              format.status === ENTITY_STATUS.ACTIVE,
          ),
        ),
    );
  }

  async find_by_code(code: string): Promise<Result<CompetitionFormat>> {
    return this.query_formats(
      describe_format_failure("format by code", "find_format_by_code"),
      (formats) => {
        const found = formats.find((format) => format.code === code);
        return found
          ? create_success_result(found)
          : create_failure_result(
              build_competition_format_not_found_by_code_error(code),
            );
      },
    );
  }

  async find_active_formats(): Promise<Result<CompetitionFormat[]>> {
    return this.query_formats(
      describe_format_failure("active formats", "find_active_formats"),
      (formats) =>
        create_success_result(
          formats
            .filter((format) => format.status === ENTITY_STATUS.ACTIVE)
            .sort((a, b) => a.name.localeCompare(b.name)),
        ),
    );
  }

  private query_formats<TData>(
    failure: RepositoryFailureDetails,
    select: (formats: CompetitionFormat[]) => Result<TData>,
  ): Promise<Result<TData>> {
    return run_repository_query(failure, async () =>
      select(await this.database.competition_formats.toArray()),
    );
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

export const get_competition_format_repository: () => CompetitionFormatRepository =
  create_lazy_repository_accessor(
    () => new InBrowserCompetitionFormatRepository(),
  );

export function reset_competition_format_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<boolean> {
  return (
    get_competition_format_repository() as InBrowserCompetitionFormatRepository
  )
    .with_write_origin(origin)
    .clear_all_data();
}

export function create_default_competition_formats_for_organization(
  organization_id: NonNullable<CreateCompetitionFormatInput["organization_id"]>,
): import("$lib/core/types/DomainScalars").ScalarInput<CompetitionFormat>[] {
  return get_default_competition_formats_for_organization_core(organization_id);
}
