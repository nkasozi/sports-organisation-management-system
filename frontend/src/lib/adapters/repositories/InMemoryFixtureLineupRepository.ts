import type {
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
  LineupStatus,
} from "../../core/entities/FixtureLineup";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  FixtureLineupRepository,
  FixtureLineupFilter,
} from "../../core/interfaces/adapters/FixtureLineupRepository";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../../core/entities/BaseEntity";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_fixture_lineups";
const ENTITY_PREFIX = "lineup";

export class InMemoryFixtureLineupRepository
  extends InMemoryBaseRepository<
    FixtureLineup,
    CreateFixtureLineupInput,
    UpdateFixtureLineupInput
  >
  implements FixtureLineupRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateFixtureLineupInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): FixtureLineup {
    const now = new Date().toISOString();
    return {
      id,
      ...timestamps,
      fixture_id: input.fixture_id,
      team_id: input.team_id,
      selected_player_ids: input.selected_player_ids || [],
      status: input.status || "draft",
      submitted_by: input.submitted_by || "",
      submitted_at:
        input.submitted_at ||
        (input.status === "submitted" || input.status === "locked" ? now : ""),
      notes: input.notes || "",
    };
  }

  protected apply_updates_to_entity(
    entity: FixtureLineup,
    updates: UpdateFixtureLineupInput,
  ): FixtureLineup {
    const now = new Date().toISOString();
    const updated_status = updates.status || entity.status;
    const status_changed_to_submitted =
      updated_status === "submitted" && entity.status !== "submitted";

    return {
      ...entity,
      ...updates,
      submitted_at: status_changed_to_submitted
        ? now
        : updates.submitted_at !== undefined
          ? updates.submitted_at
          : entity.submitted_at,
    };
  }

  async find_by_filter(
    filter?: FixtureLineupFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureLineup>> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_entities = Array.from(this.entity_cache.values());

    if (filter) {
      if (filter.fixture_id) {
        filtered_entities = filtered_entities.filter(
          (lineup) => lineup.fixture_id === filter.fixture_id,
        );
      }

      if (filter.team_id) {
        filtered_entities = filtered_entities.filter(
          (lineup) => lineup.team_id === filter.team_id,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (lineup) => lineup.status === filter.status,
        );
      }

      if (filter.submitted_by) {
        filtered_entities = filtered_entities.filter(
          (lineup) => lineup.submitted_by === filter.submitted_by,
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

  async get_lineups_for_fixture(
    fixture_id: string,
  ): Promise<EntityListResult<FixtureLineup>> {
    return this.find_by_filter({ fixture_id });
  }

  async get_lineup_for_team_in_fixture(
    fixture_id: string,
    team_id: string,
  ): Promise<EntityOperationResult<FixtureLineup>> {
    const result = await this.find_by_filter({ fixture_id, team_id });

    if (!result.success || result.data.length === 0) {
      return {
        success: false,
        error_message: "No lineup found for this team in this fixture",
      };
    }

    return {
      success: true,
      data: result.data[0],
    };
  }

  async create_fixture_lineup(
    input: CreateFixtureLineupInput,
  ): Promise<EntityOperationResult<FixtureLineup>> {
    return this.create(input);
  }

  async get_fixture_lineup_by_id(
    id: string,
  ): Promise<EntityOperationResult<FixtureLineup>> {
    return this.find_by_id(id);
  }

  async update_fixture_lineup(
    id: string,
    input: UpdateFixtureLineupInput,
  ): Promise<EntityOperationResult<FixtureLineup>> {
    return this.update(id, input);
  }

  async delete_fixture_lineup(
    id: string,
  ): Promise<EntityOperationResult<boolean>> {
    return this.delete_by_id(id);
  }

  async find_by_fixture(
    fixture_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureLineup>> {
    return this.find_by_filter({ fixture_id }, options);
  }

  async find_by_fixture_and_team(
    fixture_id: string,
    team_id: string,
    options?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureLineup>> {
    return this.find_by_filter({ fixture_id, team_id }, options);
  }

  protected async initialize_seed_data(): Promise<void> {
    const has_existing_data = this.entity_cache.size > 0;
    if (has_existing_data) {
      return;
    }
  }
}
