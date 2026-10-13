import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateJerseyColorInput,
  JerseyColor,
  JerseyColorHolderType,
  UpdateJerseyColorInput,
} from "../../core/entities/JerseyColor";
import type {
  JerseyColorFilter,
  JerseyColorRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { create_default_jersey_colors } from "./InBrowserJerseyColorRepositoryDefaults";
import {
  apply_entity_filter_rules,
  type EntityFilterRule,
  equals_rule,
  predicate_rule,
  text_contains_rule,
} from "./InBrowserRepositoryFilterRules";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "jersey";

const JERSEY_FILTER_RULES: EntityFilterRule<JerseyColor, JerseyColorFilter>[] =
  [
    equals_rule("holder_type"),
    equals_rule("holder_id"),
    text_contains_rule("nickname", (jersey) => jersey.nickname),
    predicate_rule(
      "main_color",
      (jersey, filter) =>
        jersey.main_color.toLowerCase() ===
        String(filter.main_color).toLowerCase(),
    ),
    equals_rule("status"),
  ];

export class InBrowserJerseyColorRepository
  extends InBrowserBaseRepository<
    JerseyColor,
    CreateJerseyColorInput,
    UpdateJerseyColorInput,
    JerseyColorFilter
  >
  implements JerseyColorRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }
  protected get_table(): Table<JerseyColor, string> {
    return this.database.jersey_colors;
  }

  protected create_entity_from_input(
    input: CreateJerseyColorInput,
    id: JerseyColor["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): JerseyColor {
    return {
      id,
      ...timestamps,
      holder_type: input.holder_type,
      holder_id: input.holder_id,
      nickname: input.nickname,
      main_color: input.main_color,
      secondary_color: input.secondary_color || "",
      tertiary_color: input.tertiary_color || "",
      status: input.status,
    } as JerseyColor;
  }

  protected apply_updates_to_entity(
    entity: JerseyColor,
    updates: UpdateJerseyColorInput,
  ): JerseyColor {
    return {
      ...entity,
      ...updates,
    } as JerseyColor;
  }

  protected apply_entity_filter(
    entities: JerseyColor[],
    filter: JerseyColorFilter,
  ): JerseyColor[] {
    return apply_entity_filter_rules(entities, filter, JERSEY_FILTER_RULES);
  }

  async find_by_holder(
    holder_type: JerseyColorHolderType,
    holder_id: JerseyColor["holder_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<JerseyColor> {
    return this.find_all({ holder_type, holder_id }, options);
  }
}

export const get_jersey_color_repository: () => JerseyColorRepository =
  create_lazy_repository_accessor(() => new InBrowserJerseyColorRepository());

export function reset_jersey_color_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    (
      get_jersey_color_repository() as InBrowserJerseyColorRepository
    ).with_write_origin(origin),
    create_default_jersey_colors(),
  );
}
