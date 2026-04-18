import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateOfficialPerformanceRatingInput,
  OfficialPerformanceRating,
  UpdateOfficialPerformanceRatingInput,
} from "../../core/entities/OfficialPerformanceRating";
import type {
  OfficialPerformanceRatingFilter,
  OfficialPerformanceRatingRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import { build_official_performance_rating_not_found_error } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "opr";

class InBrowserOfficialPerformanceRatingRepository
  extends InBrowserBaseRepository<
    OfficialPerformanceRating,
    CreateOfficialPerformanceRatingInput,
    UpdateOfficialPerformanceRatingInput,
    OfficialPerformanceRatingFilter
  >
  implements OfficialPerformanceRatingRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<OfficialPerformanceRating, string> {
    return this.database.official_performance_ratings;
  }

  protected create_entity_from_input(
    input: CreateOfficialPerformanceRatingInput,
    id: OfficialPerformanceRating["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): OfficialPerformanceRating {
    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
      official_id: input.official_id,
      fixture_id: input.fixture_id,
      rater_user_id: input.rater_user_id,
      rater_role: input.rater_role,
      overall: input.overall,
      decision_accuracy: input.decision_accuracy,
      game_control: input.game_control,
      communication: input.communication,
      fitness: input.fitness,
      notes: input.notes || "",
      submitted_at: new Date().toISOString(),
    } as OfficialPerformanceRating;
  }

  protected apply_updates_to_entity(
    entity: OfficialPerformanceRating,
    updates: UpdateOfficialPerformanceRatingInput,
  ): OfficialPerformanceRating {
    return { ...entity, ...updates } as OfficialPerformanceRating;
  }

  protected apply_entity_filter(
    entities: OfficialPerformanceRating[],
    filter: OfficialPerformanceRatingFilter,
  ): OfficialPerformanceRating[] {
    let filtered = entities;

    if (filter.organization_id) {
      filtered = filtered.filter(
        (r) => r.organization_id === filter.organization_id,
      );
    }
    if (filter.official_id) {
      filtered = filtered.filter((r) => r.official_id === filter.official_id);
    }
    if (filter.fixture_id) {
      filtered = filtered.filter((r) => r.fixture_id === filter.fixture_id);
    }
    if (filter.rater_user_id) {
      filtered = filtered.filter(
        (r) => r.rater_user_id === filter.rater_user_id,
      );
    }
    if (filter.rater_role) {
      filtered = filtered.filter((r) => r.rater_role === filter.rater_role);
    }
    return filtered;
  }

  async find_by_official(
    official_id: OfficialPerformanceRating["official_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating> {
    return this.find_all({ official_id }, options);
  }

  async find_by_fixture(
    fixture_id: OfficialPerformanceRating["fixture_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating> {
    return this.find_all({ fixture_id }, options);
  }

  async find_by_official_and_fixture(
    official_id: OfficialPerformanceRating["official_id"],
    fixture_id: OfficialPerformanceRating["fixture_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<OfficialPerformanceRating> {
    return this.find_all({ official_id, fixture_id }, options);
  }

  async find_existing_rating(
    official_id: OfficialPerformanceRating["official_id"],
    fixture_id: OfficialPerformanceRating["fixture_id"],
    rater_user_id: OfficialPerformanceRating["rater_user_id"],
  ): AsyncResult<OfficialPerformanceRating> {
    try {
      const all_result = await this.find_all(
        { official_id, fixture_id, rater_user_id },
        { page_number: 1, page_size: 1 },
      );
      if (!all_result.success) {
        return create_failure_result(all_result.error);
      }
      const match =
        all_result.data.items.length > 0 ? all_result.data.items[0] : void 0;
      if (!match) {
        return create_failure_result(
          build_official_performance_rating_not_found_error(
            official_id,
            fixture_id,
            rater_user_id,
          ),
        );
      }
      return create_success_result(match);
    } catch (error) {
      console.warn(
        "[OfficialPerformanceRatingRepository] Failed to perform operation",
        {
          event: "repository_perform_operation_failed",
          error: String(error),
        },
      );
      return create_failure_result(
        error instanceof Error ? error.message : "Lookup failed",
      );
    }
  }
}

type OfficialPerformanceRatingRepositoryState =
  | { status: "uninitialized" }
  | {
      status: "ready";
      repository: InBrowserOfficialPerformanceRatingRepository;
    };

let official_performance_rating_repository_state: OfficialPerformanceRatingRepositoryState =
  {
    status: "uninitialized",
  };

export function get_official_performance_rating_repository(): OfficialPerformanceRatingRepository {
  if (official_performance_rating_repository_state.status === "ready") {
    return official_performance_rating_repository_state.repository;
  }

  const repository = new InBrowserOfficialPerformanceRatingRepository();
  official_performance_rating_repository_state = {
    status: "ready",
    repository,
  };

  return repository;
}
