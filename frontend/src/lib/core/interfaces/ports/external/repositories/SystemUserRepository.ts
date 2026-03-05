import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type {
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput,
  SystemUserRole,
} from "../../../../entities/SystemUser";
import type { EntityStatus } from "../../../../entities/BaseEntity";

export interface SystemUserFilter {
  email_contains?: string;
  name_contains?: string;
  role?: SystemUserRole;
  status?: EntityStatus;
  organization_id?: string;
}

export interface SystemUserRepository extends FilterableRepository<
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput,
  SystemUserFilter
> {
  find_by_email(email: string): PaginatedAsyncResult<SystemUser>;
  find_by_role(
    role: SystemUserRole,
    options?: QueryOptions,
  ): PaginatedAsyncResult<SystemUser>;
  find_active_users(options?: QueryOptions): PaginatedAsyncResult<SystemUser>;
  find_admins(options?: QueryOptions): PaginatedAsyncResult<SystemUser>;
}
