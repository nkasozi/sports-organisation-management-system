import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateTeamProfileInput,
  TeamProfile,
  UpdateTeamProfileInput,
} from "../../core/entities/TeamProfile";
import type {
  TeamProfileFilter,
  TeamProfileRepository,
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

const ENTITY_PREFIX = "teamprofile";

const PROFILE_FILTER_RULES: EntityFilterRule<TeamProfile, TeamProfileFilter>[] =
  [equals_rule("team_id"), equals_rule("visibility"), equals_rule("status")];

function describe_profile_failure(
  lookup_field: string,
): RepositoryFailureDetails {
  return create_warning_failure_details(
    `[TeamProfileRepository] Failed to find profile by ${lookup_field}`,
    `repository_find_profile_by_${lookup_field}_failed`,
    `find profile by ${lookup_field}`,
  );
}

export class InBrowserTeamProfileRepository
  extends InBrowserBaseRepository<
    TeamProfile,
    CreateTeamProfileInput,
    UpdateTeamProfileInput,
    TeamProfileFilter
  >
  implements TeamProfileRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<TeamProfile, string> {
    return this.database.team_profiles;
  }

  protected create_entity_from_input(
    input: CreateTeamProfileInput,
    id: TeamProfile["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): TeamProfile {
    return {
      id: id as TeamProfile["id"],
      ...timestamps,
      team_id: input.team_id,
      profile_summary: input.profile_summary,
      visibility: input.visibility,
      profile_slug: input.profile_slug,
      featured_image_url: input.featured_image_url || "",
      status: input.status,
    } as TeamProfile;
  }

  protected apply_updates_to_entity(
    entity: TeamProfile,
    updates: UpdateTeamProfileInput,
  ): TeamProfile {
    return {
      ...entity,
      ...updates,
    } as TeamProfile;
  }

  protected apply_entity_filter(
    entities: TeamProfile[],
    filter: TeamProfileFilter,
  ): TeamProfile[] {
    return apply_entity_filter_rules(entities, filter, PROFILE_FILTER_RULES);
  }

  async find_by_team_id(
    team_id: TeamProfile["team_id"],
  ): AsyncResult<TeamProfile> {
    return find_first_row_by_index({
      table: this.database.team_profiles,
      index_name: "team_id",
      value: team_id,
      not_found_message: `No profile found for team: ${team_id}`,
      failure: describe_profile_failure("team_id"),
    });
  }

  async find_by_slug(slug: string): AsyncResult<TeamProfile> {
    return find_first_row_by_index({
      table: this.database.team_profiles,
      index_name: "profile_slug",
      value: slug,
      not_found_message: `No profile found with slug: ${slug}`,
      failure: describe_profile_failure("slug"),
    });
  }

  async find_public_profiles(
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamProfile> {
    return this.find_all({ visibility: "public", status: "active" }, options);
  }
}

function create_default_team_profiles(): import("$lib/core/types/DomainScalars").ScalarInput<TeamProfile>[] {
  const now = new Date().toISOString();

  return [
    {
      id: "teamprofile_default_1",
      team_id: "team_default_1",
      profile_summary:
        "The Kampala Hockey Club is one of Uganda's premier field hockey teams, known for developing talented players and competing at the highest level.",
      visibility: "public",
      profile_slug: "kampala-hockey-club-default_1",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "teamprofile_default_2",
      team_id: "team_default_2",
      profile_summary:
        "Entebbe Sports Club Hockey Team has a rich history in Ugandan hockey, bringing together passionate players committed to excellence.",
      visibility: "public",
      profile_slug: "entebbe-sports-club-default_2",
      featured_image_url: "",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

export const get_team_profile_repository: () => TeamProfileRepository =
  create_lazy_repository_accessor(() => new InBrowserTeamProfileRepository());

export function reset_team_profile_repository(
  origin: RepositoryWriteOrigin,
): AsyncResult<number> {
  return reset_repository_data(
    (
      get_team_profile_repository() as InBrowserTeamProfileRepository
    ).with_write_origin(origin),
    create_default_team_profiles(),
  );
}
