import type {
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput,
} from "../entities/SystemUser";
import { validate_system_user_input } from "../entities/SystemUser";
import type { Repository, QueryOptions } from "../interfaces/ports";
import type { EntityListResult } from "../entities/BaseEntity";
import type { AsyncResult } from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import { get_repository_container } from "../../infrastructure/container";

export interface SystemUserFilter {
  email?: string;
  role?: string;
  status?: string;
}

export interface SystemUserUseCases {
  list(
    filter?: SystemUserFilter,
    options?: QueryOptions,
  ): Promise<EntityListResult<SystemUser>>;
  get_by_id(id: string): AsyncResult<SystemUser>;
  create(input: CreateSystemUserInput): AsyncResult<SystemUser>;
  update(id: string, input: UpdateSystemUserInput): AsyncResult<SystemUser>;
  delete(id: string): AsyncResult<boolean>;
  get_by_email(email: string): AsyncResult<SystemUser>;
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
    ): Promise<EntityListResult<SystemUser>> {
      const result = await repository.find_all(options);

      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: result.error,
        };
      }

      let users = result.data?.items || [];

      if (filter) {
        users = filter_system_users(users, filter);
      }

      return {
        success: true,
        data: users,
        total_count: users.length,
      };
    },

    async get_by_id(id: string): AsyncResult<SystemUser> {
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
        input.email,
      );

      if (email_exists_result.exists) {
        return create_failure_result("A user with this email already exists");
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateSystemUserInput,
    ): AsyncResult<SystemUser> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("User ID is required");
      }

      if (input.email) {
        const email_exists_result = await check_email_already_exists(
          repository,
          input.email,
          id,
        );

        if (email_exists_result.exists) {
          return create_failure_result("A user with this email already exists");
        }
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("User ID is required");
      }

      return repository.delete_by_id(id);
    },

    async get_by_email(email: string): AsyncResult<SystemUser> {
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
  email: string,
  exclude_user_id?: string,
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

export function get_system_user_use_cases(): SystemUserUseCases {
  const container = get_repository_container();
  return create_system_user_use_cases(container.system_user_repository);
}
