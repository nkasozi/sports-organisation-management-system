import type { Table } from "dexie";
import type {
  TeamProfile,
  CreateTeamProfileInput,
  UpdateTeamProfileInput,
} from "../../core/entities/TeamProfile";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  TeamProfileRepository,
  TeamProfileFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  PaginatedAsyncResult,
  AsyncResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "teamprofile";

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
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): TeamProfile {
    return {
      id,
      ...timestamps,
      team_id: input.team_id,
      profile_summary: input.profile_summary,
      visibility: input.visibility,
      profile_slug: input.profile_slug,
      featured_image_url: input.featured_image_url || "",
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: TeamProfile,
    updates: UpdateTeamProfileInput,
  ): TeamProfile {
    return {
      ...entity,
      ...updates,
    };
  }

  protected apply_entity_filter(
    entities: TeamProfile[],
    filter: TeamProfileFilter,
  ): TeamProfile[] {
    let filtered = entities;

    if (filter.team_id) {
      filtered = filtered.filter(
        (profile) => profile.team_id === filter.team_id,
      );
    }

    if (filter.visibility) {
      filtered = filtered.filter(
        (profile) => profile.visibility === filter.visibility,
      );
    }

    if (filter.status) {
      filtered = filtered.filter((profile) => profile.status === filter.status);
    }

    return filtered;
  }

  async find_by_team_id(team_id: string): AsyncResult<TeamProfile> {
    try {
      const profiles = await this.database.team_profiles
        .where("team_id")
        .equals(team_id)
        .toArray();

      if (profiles.length === 0) {
        return create_failure_result(`No profile found for team: ${team_id}`);
      }

      return create_success_result(profiles[0]);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find profile by team_id: ${error_message}`,
      );
    }
  }

  async find_by_slug(slug: string): AsyncResult<TeamProfile> {
    try {
      const profiles = await this.database.team_profiles
        .where("profile_slug")
        .equals(slug)
        .toArray();

      if (profiles.length === 0) {
        return create_failure_result(`No profile found with slug: ${slug}`);
      }

      return create_success_result(profiles[0]);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to find profile by slug: ${error_message}`,
      );
    }
  }

  async find_public_profiles(
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamProfile> {
    return this.find_all({ visibility: "public", status: "active" }, options);
  }
}

function create_default_team_profiles(): TeamProfile[] {
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

let singleton_instance: InBrowserTeamProfileRepository | null = null;

export function get_team_profile_repository(): TeamProfileRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserTeamProfileRepository();
  }
  return singleton_instance;
}

export async function reset_team_profile_repository(): Promise<void> {
  const repository =
    get_team_profile_repository() as InBrowserTeamProfileRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_team_profiles());
}
