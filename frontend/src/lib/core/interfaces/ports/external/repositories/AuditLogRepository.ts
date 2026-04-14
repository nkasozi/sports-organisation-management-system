import type {
  AuditLog,
  CreateAuditLogInput,
} from "../../../../entities/AuditLog";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface AuditLogFilter {
  entity_type?: string;
  entity_id?: ScalarValueInput<AuditLog["entity_id"]>;
  user_id?: ScalarValueInput<AuditLog["user_id"]>;
  action?: string;
  organization_id?: ScalarValueInput<AuditLog["organization_id"]>;
  from_date?: ScalarValueInput<AuditLog["timestamp"]>;
  to_date?: ScalarValueInput<AuditLog["timestamp"]>;
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
    entity_id: ScalarValueInput<AuditLog["entity_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<AuditLog>;
}
