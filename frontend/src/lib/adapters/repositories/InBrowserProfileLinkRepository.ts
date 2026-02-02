import type { Table } from "dexie";
import type {
  ProfileLink,
  CreateProfileLinkInput,
  UpdateProfileLinkInput,
} from "../../core/entities/ProfileLink";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  ProfileLinkRepository,
  ProfileLinkFilter,
} from "../../core/interfaces/adapters/ProfileLinkRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "profilelink";

export class InBrowserProfileLinkRepository
  extends InBrowserBaseRepository<
    ProfileLink,
    CreateProfileLinkInput,
    UpdateProfileLinkInput
  >
  implements ProfileLinkRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<ProfileLink, string> {
    return this.database.profile_links;
  }

  protected create_entity_from_input(
    input: CreateProfileLinkInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): ProfileLink {
    return {
      id,
      ...timestamps,
      profile_id: input.profile_id,
      platform: input.platform,
      title: input.title,
      url: input.url,
      display_order: input.display_order || 0,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: ProfileLink,
    updates: UpdateProfileLinkInput,
  ): ProfileLink {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: ProfileLinkFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ProfileLink> {
    try {
      let filtered_entities = await this.database.profile_links.toArray();

      if (filter.profile_id) {
        filtered_entities = filtered_entities.filter(
          (link) => link.profile_id === filter.profile_id,
        );
      }

      if (filter.platform) {
        filtered_entities = filtered_entities.filter(
          (link) => link.platform === filter.platform,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (link) => link.status === filter.status,
        );
      }

      filtered_entities.sort((a, b) => a.display_order - b.display_order);

      const total_count = filtered_entities.length;
      const paginated_entities = this.apply_pagination(
        filtered_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter profile links: ${error_message}`,
      );
    }
  }

  async find_by_profile_id(
    profile_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ProfileLink> {
    return this.find_by_filter({ profile_id, status: "active" }, options);
  }
}

export function create_default_profile_links(): ProfileLink[] {
  const now = new Date().toISOString();

  return [
    {
      id: "profilelink_default_1",
      profile_id: "player_profile_default_1",
      platform: "twitter",
      title: "Official Twitter",
      url: "https://twitter.com/ugandahockey",
      display_order: 1,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "profilelink_default_2",
      profile_id: "player_profile_default_1",
      platform: "instagram",
      title: "Instagram",
      url: "https://instagram.com/ugandahockey",
      display_order: 2,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "profilelink_default_3",
      profile_id: "team_profile_default_1",
      platform: "facebook",
      title: "Team Facebook Page",
      url: "https://facebook.com/weatherheadfc",
      display_order: 1,
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "profilelink_default_4",
      profile_id: "team_profile_default_1",
      platform: "website",
      title: "Official Website",
      url: "https://weatherheadfc.ug",
      display_order: 2,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserProfileLinkRepository | null = null;

export function get_profile_link_repository(): ProfileLinkRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserProfileLinkRepository();
  }
  return singleton_instance;
}

export async function initialize_profile_link_repository(): Promise<void> {
  const repository =
    get_profile_link_repository() as InBrowserProfileLinkRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_profile_links());
  }
}

export async function reset_profile_link_repository(): Promise<void> {
  const repository =
    get_profile_link_repository() as InBrowserProfileLinkRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_profile_links());
}
