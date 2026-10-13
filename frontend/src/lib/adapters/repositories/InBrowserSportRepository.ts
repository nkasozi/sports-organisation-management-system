import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateSportInput,
  Sport,
  UpdateSportInput,
} from "../../core/entities/Sport";
import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import type { SportFilter, SportRepository } from "../../core/interfaces/ports";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import {
  type AsyncResult,
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
  execute_repository_operation,
  run_repository_query,
  with_failure_context,
} from "./InBrowserRepositoryQueryRunner";
import {
  ensure_repository_seeded,
  reset_repository_data,
} from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";
import {
  create_default_sports,
  create_sport_not_found_by_code_error,
  create_sport_not_found_by_id_error,
} from "./InBrowserSportRepositoryDefaults";
export { is_sport_not_found_by_code_error } from "./InBrowserSportRepositoryDefaults";

const ENTITY_PREFIX = "sport";

const SPORT_FILTER_RULES: EntityFilterRule<Sport, SportFilter>[] = [
  text_contains_rule("name_contains", (sport) => sport.name),
  equals_rule("status"),
];

class InBrowserSportRepository
  extends InBrowserBaseRepository<
    Sport,
    CreateSportInput,
    UpdateSportInput,
    SportFilter
  >
  implements SportRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Sport, string> {
    return this.database.sports;
  }

  protected create_entity_from_input(
    input: CreateSportInput,
    id: Sport["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Sport {
    return { id, ...timestamps, ...input } as Sport;
  }

  protected apply_updates_to_entity(
    entity: Sport,
    updates: UpdateSportInput,
  ): Sport {
    return { ...entity, ...updates } as Sport;
  }

  protected apply_entity_filter(
    entities: Sport[],
    filter: SportFilter,
  ): Sport[] {
    return apply_entity_filter_rules(entities, filter, SPORT_FILTER_RULES);
  }

  find_by_code(code: string): AsyncResult<Sport> {
    return run_repository_query(
      with_failure_context(
        create_warning_failure_details(
          "[SportRepository] Failed to find sport by code",
          "repository_find_sport_by_code_failed",
          "find sport by code",
        ),
        { code },
      ),
      async () => {
        const matched_sport = (await this.get_table().toArray()).find(
          (sport) => sport.code.toLowerCase() === code.toLowerCase(),
        );
        return matched_sport
          ? create_success_result(matched_sport)
          : create_failure_result(create_sport_not_found_by_code_error(code));
      },
    );
  }

  find_active(): AsyncResult<Sport[]> {
    return execute_repository_operation(
      create_warning_failure_details(
        "[SportRepository] Failed to find active sports",
        "repository_find_active_sports_failed",
        "find active sports",
      ),
      async () =>
        (await this.get_table().toArray()).filter(
          (sport) => sport.status === ENTITY_STATUS.ACTIVE,
        ),
    );
  }
}

const get_concrete_repository: () => InBrowserSportRepository =
  create_lazy_repository_accessor(() => new InBrowserSportRepository());

export function get_sport_repository(): SportRepository {
  return get_concrete_repository();
}

function ensure_default_sports_exist(): AsyncResult<number> {
  return ensure_repository_seeded(
    get_concrete_repository(),
    create_default_sports,
  );
}

export async function reset_sport_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<Sport[]> {
  const default_sports = create_default_sports() as Sport[];
  const reset_result = await reset_repository_data(
    get_concrete_repository().with_write_origin(origin),
    default_sports,
  );
  if (!reset_result.success) return reset_result;
  console.log("[SportRepository] Reset complete", {
    event: "sport_repository_reset",
    sport_count: default_sports.length,
    sport_ids: default_sports.map((sport) => sport.id),
  });
  return create_success_result(default_sports);
}

export async function get_all_sports(): AsyncResult<Sport[]> {
  const seed_result = await ensure_default_sports_exist();
  if (!seed_result.success) return seed_result;
  const sports_result = await get_concrete_repository().find_all();
  if (!sports_result.success) return sports_result;
  return create_success_result(sports_result.data.items);
}

export async function get_sport_by_id(
  id: ScalarValueInput<Sport["id"]>,
): AsyncResult<Sport> {
  const sports_result = await get_concrete_repository().find_by_ids([id]);
  if (!sports_result.success) return sports_result;
  const [sport] = sports_result.data;
  return sport
    ? create_success_result(sport)
    : create_failure_result(create_sport_not_found_by_id_error(id));
}

export function get_sport_by_code(code: string): AsyncResult<Sport> {
  return get_concrete_repository().find_by_code(code);
}

export function create_sport(input: CreateSportInput): AsyncResult<Sport> {
  return get_concrete_repository().create(input);
}

export function update_sport(
  id: ScalarValueInput<Sport["id"]>,
  input: UpdateSportInput,
): AsyncResult<Sport> {
  return get_concrete_repository().update(id, input);
}

export function delete_sport(
  id: ScalarValueInput<Sport["id"]>,
): AsyncResult<boolean> {
  return get_concrete_repository().delete_by_id(id);
}

export function get_active_sports(): AsyncResult<Sport[]> {
  return get_concrete_repository().find_active();
}
