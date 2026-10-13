import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateGameOfficialRoleInput,
  GameOfficialRole,
  UpdateGameOfficialRoleInput,
} from "../../core/entities/GameOfficialRole";
import { get_default_football_official_roles_with_ids } from "../../core/entities/GameOfficialRole";
import type {
  GameOfficialRoleFilter,
  GameOfficialRoleRepository,
  QueryOptions,
} from "../../core/interfaces/ports";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  FILTER_RULE_ACTIVATION,
  text_contains_rule,
} from "./InBrowserRepositoryFilterRules";
import { find_all_entities_in_custom_order } from "./InBrowserRepositoryPagedQueries";
import {
  create_warning_failure_details,
  execute_repository_operation,
  REPOSITORY_LOG_LEVEL,
} from "./InBrowserRepositoryQueryRunner";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "game_official_role";
const GLOBAL_GAME_OFFICIAL_ROLE_SPORT_ID = "" as GameOfficialRole["sport_id"];

const ROLE_FILTER_RULES: EntityFilterRule<
  GameOfficialRole,
  GameOfficialRoleFilter
>[] = [
  text_contains_rule("name_contains", (role) => role.name),
  equals_rule("sport_id", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
  equals_rule("is_on_field", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
  equals_rule("is_head_official", FILTER_RULE_ACTIVATION.WHEN_KEY_PRESENT),
  equals_rule("status"),
  equals_rule("organization_id"),
];

function sort_roles_by_display_order(
  roles: GameOfficialRole[],
): GameOfficialRole[] {
  return roles.sort((a, b) => a.display_order - b.display_order);
}

export class InBrowserGameOfficialRoleRepository
  extends InBrowserBaseRepository<
    GameOfficialRole,
    CreateGameOfficialRoleInput,
    UpdateGameOfficialRoleInput,
    GameOfficialRoleFilter
  >
  implements GameOfficialRoleRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<GameOfficialRole, string> {
    return this.database.game_official_roles;
  }

  protected create_entity_from_input(
    input: CreateGameOfficialRoleInput,
    id: GameOfficialRole["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): GameOfficialRole {
    return {
      id: id as GameOfficialRole["id"],
      ...timestamps,
      ...input,
    } as GameOfficialRole;
  }

  protected apply_updates_to_entity(
    entity: GameOfficialRole,
    updates: UpdateGameOfficialRoleInput,
  ): GameOfficialRole {
    return { ...entity, ...updates } as GameOfficialRole;
  }

  protected apply_entity_filter(
    entities: GameOfficialRole[],
    filter: GameOfficialRoleFilter,
  ): GameOfficialRole[] {
    return apply_entity_filter_rules(entities, filter, ROLE_FILTER_RULES);
  }

  async find_all_with_filter(
    filter?: GameOfficialRoleFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameOfficialRole> {
    return find_all_entities_in_custom_order({
      table: this.database.game_official_roles,
      filter: filter ?? {},
      apply_filter: this.apply_entity_filter.bind(this),
      order: sort_roles_by_display_order,
      options: options ?? {},
      failure: create_warning_failure_details(
        "[GameOfficialRoleRepository] Failed to filter game official roles",
        "repository_filter_game_official_roles_failed",
        "filter game official roles",
      ),
    });
  }

  async find_by_sport(
    sport_id: GameOfficialRole["sport_id"],
  ): Promise<Result<GameOfficialRole[]>> {
    return this.list_sorted_roles(
      "find_by_sport",
      "roles by sport",
      (role) =>
        role.sport_id === sport_id ||
        role.sport_id === GLOBAL_GAME_OFFICIAL_ROLE_SPORT_ID,
    );
  }

  async find_head_officials(): Promise<Result<GameOfficialRole[]>> {
    return this.list_sorted_roles(
      "find_head_officials",
      "head officials",
      (role) => role.is_head_official,
    );
  }

  private list_sorted_roles(
    method_name: string,
    subject: string,
    matches: (role: GameOfficialRole) => boolean,
  ): Promise<Result<GameOfficialRole[]>> {
    return execute_repository_operation(
      {
        log_message: `[GameOfficialRoleRepository] ${method_name} failed`,
        event: `repository_${method_name}_failed`,
        operation: `find ${subject}`,
        log_level: REPOSITORY_LOG_LEVEL.ERROR,
        context_ids: {},
      },
      async () =>
        sort_roles_by_display_order(
          (await this.database.game_official_roles.toArray()).filter(matches),
        ),
    );
  }

  async find_by_organization(
    organization_id: GameOfficialRole["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<GameOfficialRole> {
    return this.find_all({ organization_id }, options);
  }
}

export function create_default_game_official_roles_for_organization(
  organization_id: ScalarValueInput<GameOfficialRole["organization_id"]>,
): import("$lib/core/types/DomainScalars").ScalarInput<GameOfficialRole>[] {
  return get_default_football_official_roles_with_ids(organization_id);
}

export const get_game_official_role_repository: () => GameOfficialRoleRepository =
  create_lazy_repository_accessor(
    () => new InBrowserGameOfficialRoleRepository(),
  );

export function reset_game_official_role_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<boolean> {
  return (
    get_game_official_role_repository() as InBrowserGameOfficialRoleRepository
  )
    .with_write_origin(origin)
    .clear_all_data();
}
