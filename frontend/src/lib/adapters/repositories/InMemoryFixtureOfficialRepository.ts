import type {
  FixtureOfficial,
  CreateFixtureOfficialInput,
  UpdateFixtureOfficialInput,
} from "../../core/entities/FixtureOfficial";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  FixtureOfficialRepository,
  FixtureOfficialFilter,
} from "../../core/interfaces/adapters/FixtureOfficialRepository";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../../core/entities/BaseEntity";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_fixture_officials";
const ENTITY_PREFIX = "fixture-official";

export class InMemoryFixtureOfficialRepository
  extends InMemoryBaseRepository<
    FixtureOfficial,
    CreateFixtureOfficialInput,
    UpdateFixtureOfficialInput
  >
  implements FixtureOfficialRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateFixtureOfficialInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): FixtureOfficial {
    return {
      id,
      ...timestamps,
      fixture_id: input.fixture_id,
      official_id: input.official_id,
      role_id: input.role_id,
      assignment_notes: input.assignment_notes || "",
      confirmation_status: input.confirmation_status || "pending",
      status: input.status || "active",
    };
  }

  protected apply_updates_to_entity(
    entity: FixtureOfficial,
    updates: UpdateFixtureOfficialInput,
  ): FixtureOfficial {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter?: FixtureOfficialFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureOfficial>> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter) {
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
    }

    filtered_entities.sort(
      (first_entity, second_entity) =>
        new Date(second_entity.created_at).getTime() -
        new Date(first_entity.created_at).getTime(),
    );

    const total_count = filtered_entities.length;
    const page = pagination?.page || 1;
    const page_size = pagination?.page_size || 50;
    const start_index = (page - 1) * page_size;
    const end_index = start_index + page_size;
    const paginated_entities = filtered_entities.slice(start_index, end_index);

    return {
      success: true,
      data: paginated_entities,
      total_count,
    };
  }

  async get_officials_for_fixture(
    fixture_id: string,
  ): Promise<EntityListResult<FixtureOfficial>> {
    return this.find_by_filter({ fixture_id });
  }

  async get_fixtures_for_official(
    official_id: string,
  ): Promise<EntityListResult<FixtureOfficial>> {
    return this.find_by_filter({ official_id });
  }

  async get_official_assignment_for_fixture(
    fixture_id: string,
    official_id: string,
  ): Promise<EntityOperationResult<FixtureOfficial>> {
    const result = await this.find_by_filter({ fixture_id, official_id });

    if (!result.success || result.data.length === 0) {
      return {
        success: false,
        error_message: "No assignment found for this official in this fixture",
      };
    }

    return {
      success: true,
      data: result.data[0],
    };
  }

  async create_fixture_official(
    input: CreateFixtureOfficialInput,
  ): Promise<EntityOperationResult<FixtureOfficial>> {
    return this.create(input);
  }

  async get_fixture_official_by_id(
    id: string,
  ): Promise<EntityOperationResult<FixtureOfficial>> {
    return this.find_by_id(id);
  }

  async update_fixture_official(
    id: string,
    input: UpdateFixtureOfficialInput,
  ): Promise<EntityOperationResult<FixtureOfficial>> {
    return this.update(id, input);
  }

  async delete_fixture_official(
    id: string,
  ): Promise<EntityOperationResult<boolean>> {
    return this.delete_by_id(id);
  }

  protected async initialize_seed_data(): Promise<void> {
    const has_existing_data = this.entity_cache.size > 0;
    if (has_existing_data) {
      return;
    }
  }
}
