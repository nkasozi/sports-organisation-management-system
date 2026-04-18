import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateFixtureLineupInput,
  FixtureLineup,
  UpdateFixtureLineupInput,
} from "../../core/entities/FixtureLineup";
import { LINEUP_STATUS } from "../../core/entities/StatusConstants";
import type {
  FixtureLineupFilter,
  FixtureLineupRepository,
} from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
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
    id: FixtureLineup["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): FixtureLineup {
    const now = new Date().toISOString();
    const is_submitted_or_locked =
      input.status === LINEUP_STATUS.SUBMITTED ||
      input.status === LINEUP_STATUS.LOCKED;

    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
      fixture_id: input.fixture_id,
      team_id: input.team_id,
      selected_players: input.selected_players || [],
      status: input.status || LINEUP_STATUS.DRAFT,
      submitted_by: input.submitted_by || "",
      submitted_at: input.submitted_at || (is_submitted_or_locked ? now : ""),
      notes: input.notes || "",
    } as FixtureLineup;
  }

  protected apply_updates_to_entity(
    entity: FixtureLineup,
    updates: UpdateFixtureLineupInput,
  ): FixtureLineup {
    const now = new Date().toISOString();
    const updated_status = updates.status || entity.status;
    const status_changed_to_submitted =
      updated_status === LINEUP_STATUS.SUBMITTED &&
      entity.status !== LINEUP_STATUS.SUBMITTED;

    const submitted_at_value = status_changed_to_submitted
      ? now
      : "submitted_at" in updates
        ? updates.submitted_at
        : entity.submitted_at;

    return {
      ...entity,
      ...updates,
      submitted_at: submitted_at_value,
    } as FixtureLineup;
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

  private build_query_options(pagination?: {
    page: number;
    page_size: number;
  }) {
    return pagination
      ? { page_number: pagination.page, page_size: pagination.page_size }
      : void 0;
  }

  async get_lineups_for_fixture(
    fixture_id: FixtureLineup["fixture_id"],
  ): AsyncResult<FixtureLineup[]> {
    const result = await this.find_all({ fixture_id });
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data.items };
  }

  async get_lineup_for_team_in_fixture(
    fixture_id: FixtureLineup["fixture_id"],
    team_id: FixtureLineup["team_id"],
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
    fixture_id: FixtureLineup["fixture_id"],
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<FixtureLineup> {
    return this.find_all({ fixture_id }, this.build_query_options(options));
  }

  async find_by_fixture_and_team(
    fixture_id: FixtureLineup["fixture_id"],
    team_id: FixtureLineup["team_id"],
    options?: { page: number; page_size: number },
  ): PaginatedAsyncResult<FixtureLineup> {
    return this.find_all(
      { fixture_id, team_id },
      this.build_query_options(options),
    );
  }
}

function create_default_fixture_lineups(): import("$lib/core/types/DomainScalars").ScalarInput<FixtureLineup>[] {
  return [];
}

type FixtureLineupRepositoryState =
  | { status: "uninitialized" }
  | { status: "ready"; repository: InBrowserFixtureLineupRepository };

let fixture_lineup_repository_state: FixtureLineupRepositoryState = {
  status: "uninitialized",
};

export function get_fixture_lineup_repository(): InBrowserFixtureLineupRepository {
  if (fixture_lineup_repository_state.status === "ready") {
    return fixture_lineup_repository_state.repository;
  }

  const repository = new InBrowserFixtureLineupRepository();
  fixture_lineup_repository_state = { status: "ready", repository };

  return repository;
}

export async function reset_fixture_lineup_repository(): Promise<boolean> {
  const repository = get_fixture_lineup_repository();
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_fixture_lineups());
  return true;
}
