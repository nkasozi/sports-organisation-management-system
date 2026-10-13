import type {
  CreateTeamProfileInput,
  TeamProfile,
  UpdateTeamProfileInput,
} from "$lib/core/entities/TeamProfile";
import type {
  QueryOptions,
  TeamProfileFilter,
  TeamProfileRepository,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";

import {
  create_team_profile,
  delete_team_profile,
  update_team_profile,
} from "./TeamProfileUseCasesMutations";
import {
  get_team_profile_by_id,
  get_team_profile_by_slug,
  get_team_profile_by_team_id,
  list_public_team_profiles,
  list_team_profiles,
} from "./TeamProfileUseCasesQueries";

export interface TeamProfileUseCases {
  list(
    filter?: TeamProfileFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamProfile>;
  get_by_id(id: ScalarValueInput<TeamProfile["id"]>): AsyncResult<TeamProfile>;
  get_by_team_id(
    team_id: ScalarValueInput<TeamProfile["team_id"]>,
  ): AsyncResult<TeamProfile>;
  get_by_slug(slug: string): AsyncResult<TeamProfile>;
  create(input: CreateTeamProfileInput): AsyncResult<TeamProfile>;
  update(
    id: ScalarValueInput<TeamProfile["id"]>,
    input: UpdateTeamProfileInput,
  ): AsyncResult<TeamProfile>;
  delete(id: ScalarValueInput<TeamProfile["id"]>): AsyncResult<boolean>;
  list_public_profiles(
    options?: QueryOptions,
  ): PaginatedAsyncResult<TeamProfile>;
}

export function create_team_profile_use_cases(
  repository: TeamProfileRepository,
): TeamProfileUseCases {
  return {
    list: (filter, options) => list_team_profiles(repository, filter, options),
    get_by_id: (id) => get_team_profile_by_id(repository, id),
    get_by_team_id: (team_id) =>
      get_team_profile_by_team_id(repository, team_id),
    get_by_slug: (slug) => get_team_profile_by_slug(repository, slug),
    create: (input) => create_team_profile(repository, input),
    update: (id, input) => update_team_profile(repository, id, input),
    delete: (id) => delete_team_profile(repository, id),
    list_public_profiles: (options) =>
      list_public_team_profiles(repository, options),
  };
}
