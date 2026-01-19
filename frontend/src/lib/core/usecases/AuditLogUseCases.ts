import type {
  AuditLog,
  CreateAuditLogInput,
  AuditAction,
  FieldChange,
} from "../entities/AuditLog";
import { compute_field_changes } from "../entities/AuditLog";
import type {
  InMemoryAuditLogRepository,
  AuditLogFilter,
} from "../../adapters/repositories/InMemoryAuditLogRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import { get_repository_container } from "../../infrastructure/container";

export interface AuditLogUseCases {
  list(
    filter?: AuditLogFilter,
    options?: QueryOptions,
  ): Promise<EntityListResult<AuditLog>>;
  get_by_id(id: string): Promise<EntityOperationResult<AuditLog>>;
  create(input: CreateAuditLogInput): Promise<EntityOperationResult<AuditLog>>;
  update(
    id: string,
    input: Record<string, unknown>,
  ): Promise<EntityOperationResult<AuditLog>>;
  delete(id: string): Promise<EntityOperationResult<boolean>>;
  get_entity_history(
    entity_type: string,
    entity_id: string,
    options?: QueryOptions,
  ): Promise<EntityListResult<AuditLog>>;
  get_user_activity(
    user_id: string,
    options?: QueryOptions,
  ): Promise<EntityListResult<AuditLog>>;
}

export function create_audit_log_use_cases(
  repository: InMemoryAuditLogRepository,
): AuditLogUseCases {
  return {
    async list(
      filter?: AuditLogFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<AuditLog>> {
      const result = filter
        ? await repository.find_by_filter(filter, options)
        : await repository.find_all(options);

      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: result.error,
        };
      }

      return {
        success: true,
        data: result.data?.items || [],
        total_count: result.data?.total_count || 0,
      };
    },

    async get_by_id(id: string): Promise<EntityOperationResult<AuditLog>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Audit log ID is required" };
      }

      const result = await repository.find_by_id(id);

      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async create(
      input: CreateAuditLogInput,
    ): Promise<EntityOperationResult<AuditLog>> {
      const validation_errors = validate_audit_log_input(input);

      if (validation_errors.length > 0) {
        return { success: false, error_message: validation_errors.join(", ") };
      }

      const result = await repository.create(input);

      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async update(
      _id: string,
      _input: Record<string, unknown>,
    ): Promise<EntityOperationResult<AuditLog>> {
      return {
        success: false,
        error_message: "Audit logs are immutable and cannot be updated",
      };
    },

    async delete(_id: string): Promise<EntityOperationResult<boolean>> {
      return {
        success: false,
        error_message: "Audit logs are immutable and cannot be deleted",
      };
    },

    async get_entity_history(
      entity_type: string,
      entity_id: string,
      options?: QueryOptions,
    ): Promise<EntityListResult<AuditLog>> {
      if (!entity_type || entity_type.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Entity type is required",
        };
      }

      if (!entity_id || entity_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "Entity ID is required",
        };
      }

      const result = await repository.find_by_entity(
        entity_type,
        entity_id,
        options,
      );

      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: result.error,
        };
      }

      return {
        success: true,
        data: result.data?.items || [],
        total_count: result.data?.total_count || 0,
      };
    },

    async get_user_activity(
      user_id: string,
      options?: QueryOptions,
    ): Promise<EntityListResult<AuditLog>> {
      if (!user_id || user_id.trim().length === 0) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: "User ID is required",
        };
      }

      const result = await repository.find_by_filter({ user_id }, options);

      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: result.error,
        };
      }

      return {
        success: true,
        data: result.data?.items || [],
        total_count: result.data?.total_count || 0,
      };
    },
  };
}

function validate_audit_log_input(input: CreateAuditLogInput): string[] {
  const errors: string[] = [];

  if (!input.entity_type?.trim()) {
    errors.push("Entity type is required");
  }

  if (!input.entity_id?.trim()) {
    errors.push("Entity ID is required");
  }

  if (!input.action) {
    errors.push("Action is required");
  }

  if (!input.user_id?.trim()) {
    errors.push("User ID is required");
  }

  return errors;
}

export function get_audit_log_use_cases(): AuditLogUseCases {
  const container = get_repository_container();
  return create_audit_log_use_cases(container.audit_log_repository);
}

export { compute_field_changes };
export type { AuditAction, FieldChange, AuditLogFilter };
