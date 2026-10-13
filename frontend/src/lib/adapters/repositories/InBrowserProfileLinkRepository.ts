import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateProfileLinkInput,
  ProfileLink,
  UpdateProfileLinkInput,
} from "../../core/entities/ProfileLink";
import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import type {
  ProfileLinkFilter,
  ProfileLinkRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { create_default_profile_links } from "./InBrowserProfileLinkRepositoryDefaults";
import { find_all_entities_in_custom_order } from "./InBrowserRepositoryPagedQueries";
import { create_warning_failure_details } from "./InBrowserRepositoryQueryRunner";
import { reset_repository_data } from "./InBrowserRepositoryReset";
import { create_lazy_repository_accessor } from "./InBrowserRepositorySingleton";
import type { RepositoryWriteOrigin } from "./InBrowserRepositoryWriteOrigin";

const ENTITY_PREFIX = "profilelink";

export class InBrowserProfileLinkRepository
  extends InBrowserBaseRepository<
    ProfileLink,
    CreateProfileLinkInput,
    UpdateProfileLinkInput,
    ProfileLinkFilter
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
    id: ProfileLink["id"],
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
    } as ProfileLink;
  }

  protected apply_updates_to_entity(
    entity: ProfileLink,
    updates: UpdateProfileLinkInput,
  ): ProfileLink {
    return {
      ...entity,
      ...updates,
    } as ProfileLink;
  }

  protected apply_entity_filter(
    entities: ProfileLink[],
    filter: ProfileLinkFilter,
  ): ProfileLink[] {
    let filtered = entities;
    if (filter.profile_id) {
      filtered = filtered.filter(
        (link) => link.profile_id === filter.profile_id,
      );
    }
    if (filter.platform) {
      filtered = filtered.filter((link) => link.platform === filter.platform);
    }
    if (filter.status) {
      filtered = filtered.filter((link) => link.status === filter.status);
    }

    return filtered;
  }

  find_by_filter(
    filter: ProfileLinkFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ProfileLink> {
    return find_all_entities_in_custom_order({
      table: this.database.profile_links,
      filter,
      apply_filter: this.apply_entity_filter.bind(this),
      order: (links) =>
        [...links].sort((a, b) => a.display_order - b.display_order),
      options: options ?? {},
      failure: create_warning_failure_details(
        "[ProfileLinkRepository] Failed to filter profile links",
        "repository_filter_profile_links_failed",
        "filter profile links",
      ),
    });
  }

  async find_by_profile_id(
    profile_id: ProfileLink["profile_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<ProfileLink> {
    return this.find_by_filter(
      { profile_id, status: ENTITY_STATUS.ACTIVE },
      options,
    );
  }
}

const get_concrete_repository: () => InBrowserProfileLinkRepository =
  create_lazy_repository_accessor(() => new InBrowserProfileLinkRepository());

export function get_profile_link_repository(): ProfileLinkRepository {
  return get_concrete_repository();
}

export function reset_profile_link_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    get_concrete_repository().with_write_origin(origin),
    create_default_profile_links(),
  );
}
