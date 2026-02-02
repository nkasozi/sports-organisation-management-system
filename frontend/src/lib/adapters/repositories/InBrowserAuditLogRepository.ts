import type { Table } from "dexie";
import type {
  AuditLog,
  CreateAuditLogInput,
} from "../../core/entities/AuditLog";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "aud";

export interface AuditLogFilter {
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  action?: string;
  from_date?: string;
  to_date?: string;
}

type UpdateAuditLogInput = Partial<Omit<AuditLog, "id" | "created_at">>;

export class InBrowserAuditLogRepository extends InBrowserBaseRepository<
  AuditLog,
  CreateAuditLogInput,
  UpdateAuditLogInput
> {
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<AuditLog, string> {
    return this.database.audit_logs;
  }

  protected create_entity_from_input(
    input: CreateAuditLogInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): AuditLog {
    const timestamp = new Date().toISOString();

    return {
      id,
      ...timestamps,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      entity_display_name: input.entity_display_name,
      action: input.action,
      user_id: input.user_id,
      user_email: input.user_email,
      user_display_name: input.user_display_name,
      changes: input.changes || [],
      timestamp,
      ip_address: input.ip_address || "",
      user_agent: input.user_agent || "",
    };
  }

  protected apply_updates_to_entity(
    entity: AuditLog,
    updates: UpdateAuditLogInput,
  ): AuditLog {
    return {
      ...entity,
      ...updates,
    };
  }

  async find_by_filter(
    filter: AuditLogFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog> {
    try {
      let filtered_entities = await this.database.audit_logs.toArray();

      if (filter.entity_type) {
        filtered_entities = filtered_entities.filter(
          (log) => log.entity_type === filter.entity_type,
        );
      }

      if (filter.entity_id) {
        filtered_entities = filtered_entities.filter(
          (log) => log.entity_id === filter.entity_id,
        );
      }

      if (filter.user_id) {
        filtered_entities = filtered_entities.filter(
          (log) => log.user_id === filter.user_id,
        );
      }

      if (filter.action) {
        filtered_entities = filtered_entities.filter(
          (log) => log.action === filter.action,
        );
      }

      if (filter.from_date) {
        const from_timestamp = new Date(filter.from_date).getTime();
        filtered_entities = filtered_entities.filter(
          (log) => new Date(log.timestamp).getTime() >= from_timestamp,
        );
      }

      if (filter.to_date) {
        const to_timestamp = new Date(filter.to_date).getTime();
        filtered_entities = filtered_entities.filter(
          (log) => new Date(log.timestamp).getTime() <= to_timestamp,
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
        `Failed to filter audit logs: ${error_message}`,
      );
    }
  }

  async find_by_entity(
    entity_type: string,
    entity_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog> {
    return this.find_by_filter({ entity_type, entity_id }, options);
  }
}

export function create_default_audit_logs(): AuditLog[] {
  const now = new Date().toISOString();

  return [
    {
      id: "aud_default_1",
      entity_type: "organization",
      entity_id: "org_default_1",
      entity_display_name: "Uganda Hockey Association",
      action: "create",
      user_id: "usr_system",
      user_email: "system@sportsorg.local",
      user_display_name: "System",
      changes: [],
      timestamp: now,
      ip_address: "127.0.0.1",
      user_agent: "System Initialization",
      created_at: now,
      updated_at: now,
    },
    {
      id: "aud_default_2",
      entity_type: "sport",
      entity_id: "spt_field_hockey",
      entity_display_name: "Field Hockey",
      action: "create",
      user_id: "usr_system",
      user_email: "system@sportsorg.local",
      user_display_name: "System",
      changes: [],
      timestamp: now,
      ip_address: "127.0.0.1",
      user_agent: "System Initialization",
      created_at: now,
      updated_at: now,
    },
    {
      id: "aud_default_3",
      entity_type: "competition",
      entity_id: "cmp_default_1",
      entity_display_name: "National Hockey League 2025",
      action: "create",
      user_id: "usr_admin_1",
      user_email: "admin@ugandahockey.org",
      user_display_name: "Admin User",
      changes: [],
      timestamp: now,
      ip_address: "192.168.1.100",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserAuditLogRepository | null = null;

export function get_audit_log_repository(): InBrowserAuditLogRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserAuditLogRepository();
  }
  return singleton_instance;
}

export async function initialize_audit_log_repository(): Promise<void> {
  const repository = get_audit_log_repository();
  const has_data = await repository.has_data();

  if (!has_data) {
    await repository.seed_with_data(create_default_audit_logs());
  }
}

export async function reset_audit_log_repository(): Promise<void> {
  const repository = get_audit_log_repository();
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_audit_logs());
}
