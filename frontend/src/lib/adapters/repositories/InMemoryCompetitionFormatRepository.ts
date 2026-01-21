import type {
  CompetitionFormatRepository,
  CompetitionFormatFilter,
} from "../../core/interfaces/adapters/CompetitionFormatRepository";
import type {
  CompetitionFormat,
  CreateCompetitionFormatInput,
  UpdateCompetitionFormatInput,
  FormatType,
} from "../../core/entities/CompetitionFormat";
import type { AsyncResult } from "../../core/types/Result";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";
import { get_default_competition_formats } from "../../core/entities/CompetitionFormat";

const STORAGE_KEY = "sports_org_competition_formats";
const ENTITY_PREFIX = "competition_format";

export class InMemoryCompetitionFormatRepository
  extends InMemoryBaseRepository<
    CompetitionFormat,
    CreateCompetitionFormatInput,
    UpdateCompetitionFormatInput
  >
  implements CompetitionFormatRepository
{
  private seeded = false;

  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  private async seed_default_formats_if_needed(): Promise<void> {
    if (this.seeded) return;
    this.seeded = true;

    await this.ensure_cache_initialized();

    if (this.entity_cache.size > 0) return;

    const default_formats = get_default_competition_formats();
    for (const format_input of default_formats) {
      await this.create(format_input);
    }
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

  async find_all_with_filter(
    filter?: CompetitionFormatFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionFormat> {
    await this.simulate_network_delay();
    await this.seed_default_formats_if_needed();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter) {
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
    }

    filtered_entities.sort((a, b) => a.name.localeCompare(b.name));

    const page_number = options?.page_number ?? 1;
    const page_size = options?.page_size ?? 20;
    const total = filtered_entities.length;
    const total_pages = Math.ceil(total / page_size);

    const start_index = (page_number - 1) * page_size;
    const paginated_items = filtered_entities.slice(
      start_index,
      start_index + page_size,
    );

    return create_success_result({
      items: paginated_items,
      total_count: total,
      page_number,
      page_size,
      total_pages,
    });
  }

  async find_by_format_type(
    format_type: FormatType,
  ): Promise<CompetitionFormat[]> {
    await this.simulate_network_delay();
    await this.seed_default_formats_if_needed();

    return Array.from(this.entity_cache.values()).filter(
      (format) =>
        format.format_type === format_type && format.status === "active",
    );
  }

  async find_by_code(code: string): Promise<CompetitionFormat | null> {
    await this.simulate_network_delay();
    await this.seed_default_formats_if_needed();

    const found = Array.from(this.entity_cache.values()).find(
      (format) => format.code === code,
    );

    return found ?? null;
  }

  async find_active_formats(): Promise<CompetitionFormat[]> {
    await this.simulate_network_delay();
    await this.seed_default_formats_if_needed();

    return Array.from(this.entity_cache.values())
      .filter((format) => format.status === "active")
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async find_by_id(id: string): AsyncResult<CompetitionFormat> {
    await this.seed_default_formats_if_needed();
    return super.find_by_id(id);
  }

  async find_all(
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionFormat> {
    await this.seed_default_formats_if_needed();
    return super.find_all(options);
  }

  async find_by_filter(
    filter: CompetitionFormatFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<CompetitionFormat> {
    return this.find_all_with_filter(filter, options);
  }

  reset(): void {
    this.entity_cache.clear();
    this.seeded = false;
  }
}

let repository_instance: InMemoryCompetitionFormatRepository | null = null;

export function get_competition_format_repository(): CompetitionFormatRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryCompetitionFormatRepository();
  }
  return repository_instance;
}

export function reset_competition_format_repository(): void {
  if (repository_instance) {
    repository_instance.reset();
  }
  repository_instance = null;
}
