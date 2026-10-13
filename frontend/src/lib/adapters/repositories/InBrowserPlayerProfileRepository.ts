import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreatePlayerProfileInput,
  PlayerProfile,
  UpdatePlayerProfileInput,
} from "../../core/entities/PlayerProfile";
import type {
  PlayerProfileFilter,
  PlayerProfileRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
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
import { find_first_row_by_index } from "./InBrowserRepositoryIndexLookup";
import {
  create_warning_failure_details,
  type RepositoryFailureDetails,
} from "./InBrowserRepositoryQueryRunner";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "profile";

const PROFILE_FILTER_RULES: EntityFilterRule<
  PlayerProfile,
  PlayerProfileFilter
>[] = [
  equals_rule("player_id"),
  equals_rule("visibility"),
  equals_rule("status"),
];

function describe_profile_failure(
  lookup_field: string,
): RepositoryFailureDetails {
  return create_warning_failure_details(
    `[PlayerProfileRepository] Failed to find profile by ${lookup_field}`,
    `repository_find_profile_by_${lookup_field}_failed`,
    `find profile by ${lookup_field}`,
  );
}
export class InBrowserPlayerProfileRepository
  extends InBrowserBaseRepository<
    PlayerProfile,
    CreatePlayerProfileInput,
    UpdatePlayerProfileInput,
    PlayerProfileFilter
  >
  implements PlayerProfileRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<PlayerProfile, string> {
    return this.database.player_profiles;
  }

  protected create_entity_from_input(
    input: CreatePlayerProfileInput,
    id: PlayerProfile["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): PlayerProfile {
    return {
      id,
      ...timestamps,
      player_id: input.player_id,
      profile_summary: input.profile_summary,
      visibility: input.visibility,
      profile_slug: input.profile_slug,
      featured_image_url: input.featured_image_url || "",
      status: input.status,
    } as PlayerProfile;
  }

  protected apply_updates_to_entity(
    entity: PlayerProfile,
    updates: UpdatePlayerProfileInput,
  ): PlayerProfile {
    return {
      ...entity,
      ...updates,
    } as PlayerProfile;
  }

  protected apply_entity_filter(
    entities: PlayerProfile[],
    filter: PlayerProfileFilter,
  ): PlayerProfile[] {
    return apply_entity_filter_rules(entities, filter, PROFILE_FILTER_RULES);
  }

  async find_by_player_id(
    player_id: PlayerProfile["player_id"],
  ): AsyncResult<PlayerProfile> {
    return find_first_row_by_index({
      table: this.database.player_profiles,
      index_name: "player_id",
      value: player_id,
      not_found_message: `No profile found for player: ${player_id}`,
      failure: describe_profile_failure("player_id"),
    });
  }

  async find_by_slug(slug: string): AsyncResult<PlayerProfile> {
    return find_first_row_by_index({
      table: this.database.player_profiles,
      index_name: "profile_slug",
      value: slug,
      not_found_message: `No profile found with slug: ${slug}`,
      failure: describe_profile_failure("slug"),
    });
  }

  async find_public_profiles(
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerProfile> {
    return this.find_all({ visibility: "public", status: "active" }, options);
  }
}

function create_default_player_profiles(): import("$lib/core/types/DomainScalars").ScalarInput<PlayerProfile>[] {
  const now = new Date().toISOString();
  return [
    {
      id: "profile_default_1",
      player_id: "player_default_1",
      profile_summary:
        "Experienced midfielder with over 10 years of competitive hockey experience. Known for excellent ball control and strategic playmaking abilities.",
      visibility: "public",
      profile_slug: "john-doe-hockey",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "profile_default_2",
      player_id: "player_default_2",
      profile_summary:
        "Rising star goalkeeper with exceptional reflexes and leadership skills. Captain of the U-21 national team.",
      visibility: "public",
      profile_slug: "jane-smith-hockey",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

export const get_player_profile_repository: () => PlayerProfileRepository =
  create_lazy_repository_accessor(() => new InBrowserPlayerProfileRepository());

export function reset_player_profile_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    (
      get_player_profile_repository() as InBrowserPlayerProfileRepository
    ).with_write_origin(origin),
    create_default_player_profiles(),
  );
}
