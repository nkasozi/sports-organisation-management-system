import type { FilterableRepository, QueryOptions } from "./Repository";
import type {
  AuditLog,
  CreateAuditLogInput,
} from "../../../../entities/AuditLog";
import type { PaginatedAsyncResult } from "../../../../types/Result";

export interface AuditLogFilter {
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  action?: string;
  organization_id?: string;
  from_date?: string;
  to_date?: string;
}

export type UpdateAuditLogInput = Partial<Omit<AuditLog, "id" | "created_at">>;

export interface AuditLogRepository extends FilterableRepository<
  AuditLog,
  CreateAuditLogInput,
  UpdateAuditLogInput,
  AuditLogFilter
> {
  find_by_entity(
    entity_type: string,
    entity_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog>;
}
