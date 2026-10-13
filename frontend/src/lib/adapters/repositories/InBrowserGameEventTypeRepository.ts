import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateGameEventTypeInput,
  EventCategory,
  GameEventType,
  UpdateGameEventTypeInput,
} from "../../core/entities/GameEventType";
import type {
  GameEventTypeFilter,
  GameEventTypeRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import { build_game_event_type_not_found_by_code_error } from "../../core/interfaces/ports";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  apply_game_event_type_filter,
  sort_game_event_types,
} from "./InBrowserGameEventTypeRepositoryHelpers";
import { find_all_entities_in_custom_order } from "./InBrowserRepositoryPagedQueries";
import {
  create_warning_failure_details,
  execute_repository_operation,
  type RepositoryFailureDetails,
  run_repository_query,
} from "./InBrowserRepositoryQueryRunner";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";
export { create_default_game_event_types_for_organization } from "./InBrowserGameEventTypeRepositoryDefaults";

const GLOBAL_GAME_EVENT_TYPE_SPORT_ID = "" as GameEventType["sport_id"];

const ENTITY_PREFIX = "game_event_type";

function describe_event_type_failure(
  subject: string,
): RepositoryFailureDetails {
  return create_warning_failure_details(
    `[GameEventTypeRepository] Failed to find ${subject}`,
    `repository_find_${subject.replaceAll(" ", "_")}_failed`,
    `find ${subject}`,
  );
}

export class InBrowserGameEventTypeRepository
  extends InBrowserBaseRepository<
    GameEventType,
    CreateGameEventTypeInput,
    UpdateGameEventTypeInput,
    GameEventTypeFilter
  >
  implements GameEventTypeRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<GameEventType, string> {
    return this.database.game_event_types;
  }

  protected create_entity_from_input(
    input: CreateGameEventTypeInput,
    id: GameEventType["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): GameEventType {
    return { id, ...timestamps, ...input } as GameEventType;
  }

  protected apply_updates_to_entity(
    entity: GameEventType,
    updates: UpdateGameEventTypeInput,
  ): GameEventType {
    return { ...entity, ...updates } as GameEventType;
  }

  protected apply_entity_filter(
    entities: GameEventType[],
    filter: GameEventTypeFilter,
  ): GameEventType[] {
    return apply_game_event_type_filter(entities, filter);
  }

  async find_all_with_filter(
    filter?: GameEventTypeFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameEventType> {
    return find_all_entities_in_custom_order({
      table: this.database.game_event_types,
      filter: filter ?? {},
      apply_filter: this.apply_entity_filter.bind(this),
      order: sort_game_event_types,
      options: options ?? {},
      failure: create_warning_failure_details(
        "[GameEventTypeRepository] Failed to filter game event types",
        "repository_filter_game_event_types_failed",
        "filter game event types",
      ),
    });
  }

  async find_by_sport(
    sport_id: ScalarValueInput<NonNullable<GameEventType["sport_id"]>>,
  ): Promise<Result<GameEventType[]>> {
    return this.list_sorted_event_types(
      describe_event_type_failure("event types by sport"),
      (event_type) =>
        event_type.sport_id === sport_id ||
        event_type.sport_id === GLOBAL_GAME_EVENT_TYPE_SPORT_ID,
    );
  }

  async find_by_category(
    category: EventCategory,
  ): Promise<Result<GameEventType[]>> {
    return this.list_sorted_event_types(
      describe_event_type_failure("event types by category"),
      (event_type) => event_type.category === category,
    );
  }

  async find_by_code(code: string): Promise<Result<GameEventType>> {
    return run_repository_query(
      describe_event_type_failure("event type by code"),
      async () => {
        const found_event_type = (
          await this.database.game_event_types.toArray()
        ).find((event_type) => event_type.code === code);
        return found_event_type
          ? create_success_result(found_event_type)
          : create_failure_result(
              build_game_event_type_not_found_by_code_error(code),
            );
      },
    );
  }

  async find_scoring_events(): Promise<Result<GameEventType[]>> {
    return this.list_sorted_event_types(
      describe_event_type_failure("scoring events"),
      (event_type) => event_type.affects_score,
    );
  }

  private list_sorted_event_types(
    failure: RepositoryFailureDetails,
    matches: (event_type: GameEventType) => boolean,
  ): Promise<Result<GameEventType[]>> {
    return execute_repository_operation(failure, async () =>
      sort_game_event_types(
        (await this.database.game_event_types.toArray()).filter(matches),
      ),
    );
  }

  async find_by_organization(
    organization_id: GameEventType["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameEventType> {
    return this.find_all({ organization_id }, options);
  }
}

export const get_game_event_type_repository: () => GameEventTypeRepository =
  create_lazy_repository_accessor(() => new InBrowserGameEventTypeRepository());

export function reset_game_event_type_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<boolean> {
  return (get_game_event_type_repository() as InBrowserGameEventTypeRepository)
    .with_write_origin(origin)
    .clear_all_data();
}
