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
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
} from "./InBrowserRepositoryFilterRules";
import {
  convert_page_pagination_to_query_options,
  map_paginated_items,
  type PagePagination,
  select_first_paginated_item,
} from "./InBrowserRepositoryPagedQueries";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "lineup";

const LINEUP_FILTER_RULES: EntityFilterRule<
  FixtureLineup,
  FixtureLineupFilter
>[] = [
  equals_rule("organization_id"),
  equals_rule("fixture_id"),
  equals_rule("team_id"),
  equals_rule("status"),
  equals_rule("submitted_by"),
];

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
    return apply_entity_filter_rules(entities, filter, LINEUP_FILTER_RULES);
  }

  async get_lineups_for_fixture(
    fixture_id: FixtureLineup["fixture_id"],
  ): AsyncResult<FixtureLineup[]> {
    return map_paginated_items(
      await this.find_all({ fixture_id }),
      (items) => items,
    );
  }

  async get_lineup_for_team_in_fixture(
    fixture_id: FixtureLineup["fixture_id"],
    team_id: FixtureLineup["team_id"],
  ): AsyncResult<FixtureLineup> {
    return select_first_paginated_item(
      await this.find_all({ fixture_id, team_id }),
      "No lineup found for this team in this fixture",
    );
  }

  async find_by_fixture(
    fixture_id: FixtureLineup["fixture_id"],
    options?: PagePagination,
  ): PaginatedAsyncResult<FixtureLineup> {
    return this.find_all(
      { fixture_id },
      convert_page_pagination_to_query_options(options),
    );
  }

  async find_by_fixture_and_team(
    fixture_id: FixtureLineup["fixture_id"],
    team_id: FixtureLineup["team_id"],
    options?: PagePagination,
  ): PaginatedAsyncResult<FixtureLineup> {
    return this.find_all(
      { fixture_id, team_id },
      convert_page_pagination_to_query_options(options),
    );
  }
}

function create_default_fixture_lineups(): import("$lib/core/types/DomainScalars").ScalarInput<FixtureLineup>[] {
  return [];
}

export const get_fixture_lineup_repository: () => InBrowserFixtureLineupRepository =
  create_lazy_repository_accessor(() => new InBrowserFixtureLineupRepository());

export function reset_fixture_lineup_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    get_fixture_lineup_repository().with_write_origin(origin),
    create_default_fixture_lineups(),
  );
}
