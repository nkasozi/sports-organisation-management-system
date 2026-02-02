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
} from "../../core/interfaces/adapters/TeamProfileRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
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
    UpdateTeamProfileInput
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

  async find_by_filter(
    filter: TeamProfileFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamProfile> {
    try {
      let filtered_entities = await this.database.team_profiles.toArray();

      if (filter.team_id) {
        filtered_entities = filtered_entities.filter(
          (profile) => profile.team_id === filter.team_id,
        );
      }

      if (filter.visibility) {
        filtered_entities = filtered_entities.filter(
          (profile) => profile.visibility === filter.visibility,
        );
      }

      if (filter.status) {
        filtered_entities = filtered_entities.filter(
          (profile) => profile.status === filter.status,
        );
      }

      const total_count = filtered_entities.length;
      const sorted_entities = this.apply_sort(filtered_entities, options);
      const paginated_entities = this.apply_pagination(
        sorted_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to filter team profiles: ${error_message}`,
      );
    }
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
    return this.find_by_filter(
      { visibility: "public", status: "active" },
      options,
    );
  }
}

export function create_default_team_profiles(): TeamProfile[] {
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

export async function initialize_team_profile_repository(): Promise<void> {
  const repository =
    get_team_profile_repository() as InBrowserTeamProfileRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_team_profiles());
  }
}

export async function reset_team_profile_repository(): Promise<void> {
  const repository =
    get_team_profile_repository() as InBrowserTeamProfileRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_team_profiles());
}
