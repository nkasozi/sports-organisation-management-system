import type { Table } from "dexie";
import type {
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
} from "../../core/entities/FixtureLineup";
import type {
  BaseEntity,
  EntityOperationResult,
  EntityListResult,
} from "../../core/entities/BaseEntity";
import type {
  FixtureLineupRepository,
  FixtureLineupFilter,
} from "../../core/interfaces/adapters/FixtureLineupRepository";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "lineup";

export class InBrowserFixtureLineupRepository
  extends InBrowserBaseRepository<
    FixtureLineup,
    CreateFixtureLineupInput,
    UpdateFixtureLineupInput
  >
  implements FixtureLineupRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<FixtureLineup, string> {
    return this.database.fixture_lineups;
  }

  protected create_entity_from_input(
    input: CreateFixtureLineupInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): FixtureLineup {
    const now = new Date().toISOString();
    const is_submitted_or_locked =
      input.status === "submitted" || input.status === "locked";

    return {
      id,
      ...timestamps,
      fixture_id: input.fixture_id,
      team_id: input.team_id,
      selected_players: input.selected_players || [],
      status: input.status || "draft",
      submitted_by: input.submitted_by || "",
      submitted_at: input.submitted_at || (is_submitted_or_locked ? now : ""),
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

    const submitted_at_value = status_changed_to_submitted
      ? now
      : updates.submitted_at !== undefined
        ? updates.submitted_at
        : entity.submitted_at;

    return {
      ...entity,
      ...updates,
      submitted_at: submitted_at_value,
    };
  }

  async find_by_filter(
    filter?: FixtureLineupFilter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<FixtureLineup>> {
    try {
      let filtered_entities = await this.database.fixture_lineups.toArray();

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
      const paginated_entities = filtered_entities.slice(
        start_index,
        end_index,
      );

      return {
        success: true,
        data: paginated_entities,
        total_count,
      };
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        data: [],
        total_count: 0,
        error_message: `Failed to filter fixture lineups: ${error_message}`,
      };
    }
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
    try {
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
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error_message: `Failed to get lineup for team in fixture: ${error_message}`,
      };
    }
  }

  async create_fixture_lineup(
    input: CreateFixtureLineupInput,
  ): Promise<EntityOperationResult<FixtureLineup>> {
    const result = await this.create(input);
    if (!result.success) {
      return { success: false, error_message: result.error };
    }
    return { success: true, data: result.data };
  }

  async get_fixture_lineup_by_id(
    id: string,
  ): Promise<EntityOperationResult<FixtureLineup>> {
    const result = await this.find_by_id(id);
    if (!result.success) {
      return { success: false, error_message: result.error };
    }
    return { success: true, data: result.data };
  }

  async update_fixture_lineup(
    id: string,
    input: UpdateFixtureLineupInput,
  ): Promise<EntityOperationResult<FixtureLineup>> {
    const result = await this.update(id, input);
    if (!result.success) {
      return { success: false, error_message: result.error };
    }
    return { success: true, data: result.data };
  }

  async delete_fixture_lineup(
    id: string,
  ): Promise<EntityOperationResult<boolean>> {
    const result = await this.delete_by_id(id);
    if (!result.success) {
      return { success: false, error_message: result.error };
    }
    return { success: true, data: result.data };
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
}

export function create_default_fixture_lineups(): FixtureLineup[] {
  return [];
}

let singleton_instance: InBrowserFixtureLineupRepository | null = null;

export function get_fixture_lineup_repository(): InBrowserFixtureLineupRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserFixtureLineupRepository();
  }
  return singleton_instance;
}

export async function initialize_fixture_lineup_repository(): Promise<boolean> {
  const repository = get_fixture_lineup_repository();
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_fixture_lineups());
  }
  return true;
}

export async function reset_fixture_lineup_repository(): Promise<boolean> {
  const repository = get_fixture_lineup_repository();
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_fixture_lineups());
  return true;
}
