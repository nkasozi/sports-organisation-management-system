import type {
  AuditLog,
  CreateAuditLogInput,
} from "../../core/entities/AuditLog";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import {
  generate_unique_id,
  create_timestamp_fields,
} from "../../core/entities/BaseEntity";

const AUDIT_LOG_STORAGE_KEY = "sports_org_audit_logs";
const AUDIT_LOG_ID_PREFIX = "aud";
const SIMULATED_NETWORK_DELAY_MS = 150;

export interface AuditLogFilter {
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  action?: string;
  from_date?: string;
  to_date?: string;
}

export class InMemoryAuditLogRepository {
  private storage_key: string;
  private entity_cache: Map<string, AuditLog> = new Map();
  private is_cache_initialized: boolean = false;

  constructor() {
    this.storage_key = AUDIT_LOG_STORAGE_KEY;
  }

  private async simulate_network_delay(): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, SIMULATED_NETWORK_DELAY_MS),
    );
  }

  private load_from_local_storage(): Map<string, AuditLog> {
    if (typeof window === "undefined") {
      return new Map();
    }

    const stored_data = localStorage.getItem(this.storage_key);
    if (!stored_data) {
      return new Map();
    }

    try {
      const parsed_array: AuditLog[] = JSON.parse(stored_data);
      const entity_map = new Map<string, AuditLog>();

      for (const entity of parsed_array) {
        entity_map.set(entity.id, entity);
      }

      return entity_map;
    } catch {
      return new Map();
    }
  }

  private save_to_local_storage(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const entities_array = Array.from(this.entity_cache.values());
      localStorage.setItem(this.storage_key, JSON.stringify(entities_array));
      return true;
    } catch {
      return false;
    }
  }

  private ensure_cache_initialized(): void {
    if (this.is_cache_initialized) {
      return;
    }

    this.entity_cache = this.load_from_local_storage();
    this.is_cache_initialized = true;
  }

  async create(input: CreateAuditLogInput): AsyncResult<AuditLog> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const id = generate_unique_id(AUDIT_LOG_ID_PREFIX);
    const timestamps = create_timestamp_fields();
    const timestamp = new Date().toISOString();

    const audit_log: AuditLog = {
      id,
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
      created_at: timestamps.created_at,
      updated_at: timestamps.updated_at,
    };

    this.entity_cache.set(id, audit_log);
    this.save_to_local_storage();

    return create_success_result(audit_log);
  }

  async find_all(options?: QueryOptions): PaginatedAsyncResult<AuditLog> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const all_logs = Array.from(this.entity_cache.values());
    const sorted_logs = this.sort_audit_logs(all_logs, options);
    const paginated_result = this.apply_pagination(sorted_logs, options);

    return create_success_result(paginated_result);
  }

  async find_by_id(id: string): AsyncResult<AuditLog> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const audit_log = this.entity_cache.get(id);

    if (!audit_log) {
      return create_failure_result(`Audit log with id '${id}' not found`);
    }

    return create_success_result(audit_log);
  }

  async find_by_filter(
    filter: AuditLogFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_logs = Array.from(this.entity_cache.values());

    if (filter.entity_type) {
      filtered_logs = filtered_logs.filter(
        (log) => log.entity_type === filter.entity_type,
      );
    }

    if (filter.entity_id) {
      filtered_logs = filtered_logs.filter(
        (log) => log.entity_id === filter.entity_id,
      );
    }

    if (filter.user_id) {
      filtered_logs = filtered_logs.filter(
        (log) => log.user_id === filter.user_id,
      );
    }

    if (filter.action) {
      filtered_logs = filtered_logs.filter(
        (log) => log.action === filter.action,
      );
    }

    if (filter.from_date) {
      const from_timestamp = new Date(filter.from_date).getTime();
      filtered_logs = filtered_logs.filter(
        (log) => new Date(log.timestamp).getTime() >= from_timestamp,
      );
    }

    if (filter.to_date) {
      const to_timestamp = new Date(filter.to_date).getTime();
      filtered_logs = filtered_logs.filter(
        (log) => new Date(log.timestamp).getTime() <= to_timestamp,
      );
    }

    const sorted_logs = this.sort_audit_logs(filtered_logs, options);
    const paginated_result = this.apply_pagination(sorted_logs, options);

    return create_success_result(paginated_result);
  }

  async find_by_entity(
    entity_type: string,
    entity_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog> {
    return this.find_by_filter({ entity_type, entity_id }, options);
  }

  async count(): AsyncResult<number> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    return create_success_result(this.entity_cache.size);
  }

  private sort_audit_logs(
    logs: AuditLog[],
    options?: QueryOptions,
  ): AuditLog[] {
    const sort_by = options?.sort_by || "timestamp";
    const sort_direction = options?.sort_direction || "desc";

    return [...logs].sort((a, b) => {
      const a_value = (a as unknown as Record<string, unknown>)[sort_by];
      const b_value = (b as unknown as Record<string, unknown>)[sort_by];

      if (typeof a_value === "string" && typeof b_value === "string") {
        const comparison = a_value.localeCompare(b_value);
        return sort_direction === "asc" ? comparison : -comparison;
      }

      return 0;
    });
  }

  private apply_pagination(
    logs: AuditLog[],
    options?: QueryOptions,
  ): {
    items: AuditLog[];
    total_count: number;
    page_number: number;
    page_size: number;
    total_pages: number;
  } {
    const page_number = options?.page_number || 1;
    const page_size = options?.page_size || 50;
    const total_count = logs.length;
    const total_pages = Math.ceil(total_count / page_size);

    const start_index = (page_number - 1) * page_size;
    const end_index = start_index + page_size;
    const items = logs.slice(start_index, end_index);

    return {
      items,
      total_count,
      page_number,
      page_size,
      total_pages,
    };
  }

  clear_cache(): void {
    this.entity_cache.clear();
    this.is_cache_initialized = false;

    if (typeof window !== "undefined") {
      localStorage.removeItem(this.storage_key);
    }
  }
}
