import type { Table } from "dexie";
import type {
  FixtureLineup,
  CreateFixtureLineupInput,
  UpdateFixtureLineupInput,
} from "../../core/entities/FixtureLineup";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { AsyncResult, PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import type {
  FixtureLineupRepository,
  FixtureLineupFilter,
} from "../../core/interfaces/ports";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "lineup";

export class InBrowserFixtureLineupRepository
  extends InBrowserBaseRepository<
    FixtureLineup,
    CreateFixtureLineupInput,
    UpdateFixtureLineupInput,
    FixtureLineupFilter
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
      organization_id: input.organization_id,
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

  protected apply_entity_filter(
    entities: FixtureLineup[],
    filter: FixtureLineupFilter,
  ): FixtureLineup[] {
    let filtered = entities;

    if (filter.organization_id) {
      filtered = filtered.filter(
        (lineup) => lineup.organization_id === filter.organization_id,
      );
    }

    if (filter.fixture_id) {
      filtered = filtered.filter(
        (lineup) => lineup.fixture_id === filter.fixture_id,
      );
    }

    if (filter.team_id) {
      filtered = filtered.filter((lineup) => lineup.team_id === filter.team_id);
    }

    if (filter.status) {
      filtered = filtered.filter((lineup) => lineup.status === filter.status);
    }

    if (filter.submitted_by) {
      filtered = filtered.filter(
        (lineup) => lineup.submitted_by === filter.submitted_by,
      );
    }

    return filtered;
  }

  private build_query_options(
    pagination?: { page: number; page_size: number },
  ) {
    return pagination
      ? { page_number: pagination.page, page_size: pagination.page_size }
      : undefined;
  }

  async get_lineups_for_fixture(
    fixture_id: string,
  ): AsyncResult<FixtureLineup[]> {
    const result = await this.find_all({ fixture_id });
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data.items };
  }

  async get_lineup_for_team_in_fixture(
    fixture_id: string,
    team_id: string,
  ): AsyncResult<FixtureLineup> {
    const result = await this.find_all({ fixture_id, team_id });
    if (!result.success) {
      return create_failure_result(result.error);
    }
    if (result.data.items.length === 0) {
      return create_failure_result(
        "No lineup found for this team in this fixture",
      );
    }
    return create_success_result(result.data.items[0]);
  }

  async find_by_fixture(
    fixture_id: string,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<FixtureLineup> {
    return this.find_all({ fixture_id }, this.build_query_options(options));
  }

  async find_by_fixture_and_team(
    fixture_id: string,
    team_id: string,
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<FixtureLineup> {
    return this.find_all(
      { fixture_id, team_id },
      this.build_query_options(options),
    );
  }
}

function create_default_fixture_lineups(): FixtureLineup[] {
  return [];
}

let singleton_instance: InBrowserFixtureLineupRepository | null = null;

export function get_fixture_lineup_repository(): InBrowserFixtureLineupRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserFixtureLineupRepository();
  }
  return singleton_instance;
}

export async function reset_fixture_lineup_repository(): Promise<boolean> {
  const repository = get_fixture_lineup_repository();
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_fixture_lineups());
  return true;
}
