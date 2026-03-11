import type { Table } from "dexie";
import type {
  AuditLog,
  CreateAuditLogInput,
} from "../../core/entities/AuditLog";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  QueryOptions,
  AuditLogRepository,
  AuditLogFilter,
  UpdateAuditLogInput,
} from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import {
  search_audit_logs_from_convex,
  is_convex_available,
  AUDIT_LOG_PAGE_SIZE,
} from "../../infrastructure/sync/convexAuditLogService";

const ENTITY_PREFIX = "aud";

class InBrowserAuditLogRepository
  extends InBrowserBaseRepository<
    AuditLog,
    CreateAuditLogInput,
    UpdateAuditLogInput,
    AuditLogFilter
  >
  implements AuditLogRepository
{
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
      organization_id: input.organization_id,
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

  protected apply_entity_filter(
    entities: AuditLog[],
    filter: AuditLogFilter,
  ): AuditLog[] {
    let filtered = entities;

    if (filter.entity_type) {
      filtered = filtered.filter(
        (log) => log.entity_type === filter.entity_type,
      );
    }

    if (filter.entity_id) {
      filtered = filtered.filter((log) => log.entity_id === filter.entity_id);
    }

    if (filter.user_id) {
      filtered = filtered.filter((log) => log.user_id === filter.user_id);
    }

    if (filter.action) {
      filtered = filtered.filter((log) => log.action === filter.action);
    }

    if (filter.organization_id) {
      filtered = filtered.filter(
        (log) => log.organization_id === filter.organization_id,
      );
    }

    if (filter.from_date) {
      const from_timestamp = new Date(filter.from_date).getTime();
      filtered = filtered.filter(
        (log) => new Date(log.timestamp).getTime() >= from_timestamp,
      );
    }

    if (filter.to_date) {
      const to_timestamp = new Date(filter.to_date).getTime();
      filtered = filtered.filter(
        (log) => new Date(log.timestamp).getTime() <= to_timestamp,
      );
    }

    return filtered;
  }

  async find_all(
    filter?: AuditLogFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog> {
    if (is_convex_available()) {
      const convex_result = await search_audit_logs_from_convex(filter || {}, {
        page_number: options?.page_number || 1,
        page_size: options?.page_size || AUDIT_LOG_PAGE_SIZE,
      });

      if (convex_result.success) {
        console.log(
          `[AuditLog] Fetched ${convex_result.data.length} logs from Convex`,
        );
        const page_size = convex_result.page_size;
        const total_count = convex_result.total_count;
        return create_success_result({
          items: convex_result.data,
          total_count: total_count,
          page_number: convex_result.page_number,
          page_size: page_size,
          total_pages: Math.ceil(total_count / page_size),
        });
      }

      console.warn(
        "[AuditLog] Convex query failed, falling back to local:",
        convex_result.error_message,
      );
    }

    console.log("[AuditLog] Querying local database");
    return super.find_all(filter, options);
  }

  async find_by_entity(
    entity_type: string,
    entity_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog> {
    return this.find_all({ entity_type, entity_id }, options);
  }
}

let singleton_instance: InBrowserAuditLogRepository | null = null;

export function get_audit_log_repository(): InBrowserAuditLogRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserAuditLogRepository();
  }
  return singleton_instance;
}
