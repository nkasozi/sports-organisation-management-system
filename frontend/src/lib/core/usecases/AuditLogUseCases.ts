import type {
  AuditLog,
  CreateAuditLogInput,
  AuditAction,
  FieldChange,
} from "../entities/AuditLog";
import { compute_field_changes } from "../entities/AuditLog";
import type { AuditLogRepository, AuditLogFilter } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { EntityListResult } from "../entities/BaseEntity";
import type { AsyncResult } from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import { get_repository_container } from "../../infrastructure/container";

export interface AuditLogUseCases {
  list(
    filter?: AuditLogFilter,
    options?: QueryOptions,
  ): Promise<EntityListResult<AuditLog>>;
  get_by_id(id: string): AsyncResult<AuditLog>;
  create(input: CreateAuditLogInput): AsyncResult<AuditLog>;
  update(id: string, input: Record<string, unknown>): AsyncResult<AuditLog>;
  delete(id: string): AsyncResult<boolean>;
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
  repository: AuditLogRepository,
): AuditLogUseCases {
  return {
    async list(
      filter?: AuditLogFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<AuditLog>> {
      const result = await repository.find_all(filter, options);

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

    async get_by_id(id: string): AsyncResult<AuditLog> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Audit log ID is required");
      }

      return repository.find_by_id(id);
    },

    async create(input: CreateAuditLogInput): AsyncResult<AuditLog> {
      const validation_errors = validate_audit_log_input(input);

      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.create(input);
    },

    async update(
      _id: string,
      _input: Record<string, unknown>,
    ): AsyncResult<AuditLog> {
      return create_failure_result(
        "Audit logs are immutable and cannot be updated",
      );
    },

    async delete(_id: string): AsyncResult<boolean> {
      return create_failure_result(
        "Audit logs are immutable and cannot be deleted",
      );
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

      const result = await repository.find_all({ user_id }, options);

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

export type { AuditAction, FieldChange, AuditLogFilter };
