import type {
  CreatePlayerProfileInput,
  PlayerProfile,
  UpdatePlayerProfileInput,
} from "$lib/core/entities/PlayerProfile";
import type {
  PlayerProfileFilter,
  PlayerProfileRepository,
  QueryOptions,
} from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "$lib/core/types/Result";

import {
  create_player_profile,
  delete_player_profile,
  update_player_profile,
} from "./PlayerProfileUseCasesMutations";
import {
  get_player_profile_by_id,
  get_player_profile_by_player_id,
  get_player_profile_by_slug,
  list_player_profiles,
  list_public_player_profiles,
} from "./PlayerProfileUseCasesQueries";

export interface PlayerProfileUseCases {
  list(
    filter?: PlayerProfileFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerProfile>;
  get_by_id(
    id: ScalarValueInput<PlayerProfile["id"]>,
  ): AsyncResult<PlayerProfile>;
  get_by_player_id(
    player_id: ScalarValueInput<PlayerProfile["player_id"]>,
  ): AsyncResult<PlayerProfile>;
  get_by_slug(slug: string): AsyncResult<PlayerProfile>;
  create(input: CreatePlayerProfileInput): AsyncResult<PlayerProfile>;
  update(
    id: ScalarValueInput<PlayerProfile["id"]>,
    input: UpdatePlayerProfileInput,
  ): AsyncResult<PlayerProfile>;
  delete(id: ScalarValueInput<PlayerProfile["id"]>): AsyncResult<boolean>;
  list_public_profiles(
    options?: QueryOptions,
  ): PaginatedAsyncResult<PlayerProfile>;
}

export function create_player_profile_use_cases(
  repository: PlayerProfileRepository,
): PlayerProfileUseCases {
  return {
    list: (filter, options) =>
      list_player_profiles(repository, filter, options),
    get_by_id: (id) => get_player_profile_by_id(repository, id),
    get_by_player_id: (player_id) =>
      get_player_profile_by_player_id(repository, player_id),
    get_by_slug: (slug) => get_player_profile_by_slug(repository, slug),
    create: (input) => create_player_profile(repository, input),
    update: (id, input) => update_player_profile(repository, id, input),
    delete: (id) => delete_player_profile(repository, id),
    list_public_profiles: (options) =>
      list_public_player_profiles(repository, options),
  };
}
