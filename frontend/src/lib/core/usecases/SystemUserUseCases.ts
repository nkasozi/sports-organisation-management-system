import type {
  CreateSystemUserInput,
  SystemUser,
  UpdateSystemUserInput,
} from "../entities/SystemUser";
import { validate_system_user_input } from "../entities/SystemUser";
import type { QueryOptions, Repository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";

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
  repository: Repository<
    SystemUser,
    CreateSystemUserInput,
    UpdateSystemUserInput
  >,
): SystemUserUseCases {
  return {
    async list(
      filter?: SystemUserFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<SystemUser> {
      const result = await repository.find_all(undefined, options);

      if (!result.success) {
        return result;
      }

      const all_users = result.data?.items || [];
      const filtered_users = filter
        ? filter_system_users(all_users, filter)
        : all_users;

      return {
        success: true,
        data: {
          ...result.data,
          items: filtered_users,
          total_count: filtered_users.length,
        },
      };
    },

    async get_by_id(
      id: ScalarValueInput<SystemUser["id"]>,
    ): AsyncResult<SystemUser> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("User ID is required");
      }

      return repository.find_by_id(id);
    },

    async create(input: CreateSystemUserInput): AsyncResult<SystemUser> {
      const validation_errors = validate_system_user_input(input);

      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      const email_exists_result = await check_email_already_exists(
        repository,
        input.email as SystemUser["email"],
      );

      if (email_exists_result.exists) {
        return create_failure_result("A user with this email already exists");
      }

      return repository.create(input);
    },

    async update(
      id: ScalarValueInput<SystemUser["id"]>,
      input: UpdateSystemUserInput,
    ): AsyncResult<SystemUser> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("User ID is required");
      }

      if (input.email) {
        const email_exists_result = await check_email_already_exists(
          repository,
          input.email as SystemUser["email"],
          id,
        );

        if (email_exists_result.exists) {
          return create_failure_result("A user with this email already exists");
        }
      }

      return repository.update(id, input);
    },

    async delete(id: ScalarValueInput<SystemUser["id"]>): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("User ID is required");
      }

      return repository.delete_by_id(id);
    },

    async get_by_email(
      email: ScalarValueInput<SystemUser["email"]>,
    ): AsyncResult<SystemUser> {
      if (!email || email.trim().length === 0) {
        return create_failure_result("Email is required");
      }

      const all_result = await repository.find_all();

      if (!all_result.success) {
        return create_failure_result(all_result.error);
      }

      const normalized_email = email.trim().toLowerCase();
      const found_user = all_result.data?.items.find(
        (user) => user.email.toLowerCase() === normalized_email,
      );

      if (!found_user) {
        return create_failure_result(`User with email '${email}' not found`);
      }

      return create_success_result(found_user);
    },
  };
}

function filter_system_users(
  users: SystemUser[],
  filter: SystemUserFilter,
): SystemUser[] {
  return users.filter((user) => {
    if (
      filter.email &&
      !user.email.toLowerCase().includes(filter.email.toLowerCase())
    ) {
      return false;
    }

    if (filter.role && user.role !== filter.role) {
      return false;
    }

    if (filter.status && user.status !== filter.status) {
      return false;
    }

    return true;
  });
}

async function check_email_already_exists(
  repository: Repository<
    SystemUser,
    CreateSystemUserInput,
    UpdateSystemUserInput
  >,
  email: ScalarValueInput<SystemUser["email"]>,
  exclude_user_id?: ScalarValueInput<SystemUser["id"]>,
): Promise<{ exists: boolean }> {
  const all_result = await repository.find_all();

  if (!all_result.success) {
    return { exists: false };
  }

  const normalized_email = email.trim().toLowerCase();
  const existing_user = all_result.data?.items.find(
    (user) =>
      user.email.toLowerCase() === normalized_email &&
      user.id !== exclude_user_id,
  );

  return { exists: !!existing_user };
}
