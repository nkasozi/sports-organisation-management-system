import type {
  FixtureDetailsSetup,
  CreateFixtureDetailsSetupInput,
  UpdateFixtureDetailsSetupInput,
} from "../../core/entities/FixtureDetailsSetup";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  FixtureDetailsSetupRepository,
  FixtureDetailsSetupFilter,
} from "../../core/interfaces/adapters/FixtureDetailsSetupRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_fixture_details_setup";
const ENTITY_PREFIX = "fixture-details-setup";

export class InMemoryFixtureDetailsSetupRepository
  extends InMemoryBaseRepository<
    FixtureDetailsSetup,
    CreateFixtureDetailsSetupInput,
    UpdateFixtureDetailsSetupInput
  >
  implements FixtureDetailsSetupRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateFixtureDetailsSetupInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): FixtureDetailsSetup {
    return {
      id,
      ...timestamps,
      fixture_id: input.fixture_id,
      official_id: input.official_id,
      role_id: input.role_id,
      assignment_notes: input.assignment_notes || "",
      confirmation_status: input.confirmation_status || "pending",
      home_team_jersey_id: input.home_team_jersey_id || "",
      away_team_jersey_id: input.away_team_jersey_id || "",
      official_jersey_id: input.official_jersey_id || "",
      status: input.status || "active",
    };
  }

  protected apply_updates_to_entity(
    entity: FixtureDetailsSetup,
    updates: UpdateFixtureDetailsSetupInput,
  ): FixtureDetailsSetup {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: FixtureDetailsSetupFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter.fixture_id) {
      filtered_entities = filtered_entities.filter(
        (item) => item.fixture_id === filter.fixture_id,
      );
    }

    if (filter.official_id) {
      filtered_entities = filtered_entities.filter(
        (item) => item.official_id === filter.official_id,
      );
    }

    if (filter.role_id) {
      filtered_entities = filtered_entities.filter(
        (item) => item.role_id === filter.role_id,
      );
    }

    if (filter.confirmation_status) {
      filtered_entities = filtered_entities.filter(
        (item) => item.confirmation_status === filter.confirmation_status,
      );
    }

    filtered_entities.sort(
      (first_entity, second_entity) =>
        new Date(second_entity.created_at).getTime() -
        new Date(first_entity.created_at).getTime(),
    );

    const page_number = options?.page_number || 1;
    const page_size = options?.page_size || 50;
    const start_index = (page_number - 1) * page_size;
    const paginated_items = filtered_entities.slice(
      start_index,
      start_index + page_size,
    );

    return create_success_result({
      items: paginated_items,
      total_count: filtered_entities.length,
      page_number,
      page_size,
      total_pages: Math.ceil(filtered_entities.length / page_size),
    });
  }

  async find_by_fixture(
    fixture_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup> {
    return this.find_by_filter({ fixture_id }, options);
  }

  async find_by_official(
    official_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup> {
    return this.find_by_filter({ official_id }, options);
  }

  protected async initialize_seed_data(): Promise<void> {
    const has_existing_data = this.entity_cache.size > 0;
    if (has_existing_data) {
      return;
    }
  }
}

let repository_instance: InMemoryFixtureDetailsSetupRepository | null = null;

export function get_fixture_details_setup_repository(): InMemoryFixtureDetailsSetupRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryFixtureDetailsSetupRepository();
  }
  return repository_instance;
}
