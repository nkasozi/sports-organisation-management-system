import type {
  CreateSystemUserInput,
  SystemUser,
  UpdateSystemUserInput,
} from "../entities/SystemUser";
import type { QueryOptions } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import {
  create_system_user,
  delete_system_user,
  update_system_user,
} from "./SystemUserMutations";
import {
  find_system_user_by_email,
  get_system_user_by_id,
  list_filtered_system_users,
  type SystemUserRepository,
} from "./SystemUserQueries";

export interface SystemUserFilter {
  email?: SystemUser["email"];
  role?: SystemUser["role"];
  status?: SystemUser["status"];
}

export interface SystemUserUseCases {
  list(
    filter?: SystemUserFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<SystemUser>;
  get_by_id(id: ScalarValueInput<SystemUser["id"]>): AsyncResult<SystemUser>;
  create(input: CreateSystemUserInput): AsyncResult<SystemUser>;
  update(
    id: ScalarValueInput<SystemUser["id"]>,
    input: UpdateSystemUserInput,
  ): AsyncResult<SystemUser>;
  delete(id: ScalarValueInput<SystemUser["id"]>): AsyncResult<boolean>;
  get_by_email(
    email: ScalarValueInput<SystemUser["email"]>,
  ): AsyncResult<SystemUser>;
}

export function create_system_user_use_cases(
  repository: SystemUserRepository,
): SystemUserUseCases {
  return {
    list: (filter, options) =>
      list_filtered_system_users(repository, filter, options),
    get_by_id: (id) => get_system_user_by_id(repository, id),
    create: (input) => create_system_user(repository, input),
    update: (id, input) => update_system_user(repository, id, input),
    delete: (id) => delete_system_user(repository, id),
    get_by_email: (email) => find_system_user_by_email(repository, email),
  };
}
