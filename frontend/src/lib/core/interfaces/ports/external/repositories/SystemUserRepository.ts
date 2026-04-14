import type { EntityStatus } from "../../../../entities/BaseEntity";
import type {
  CreateSystemUserInput,
  SystemUser,
  SystemUserRole,
  UpdateSystemUserInput,
} from "../../../../entities/SystemUser";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface SystemUserFilter {
  email_contains?: string;
  name_contains?: string;
  role?: SystemUserRole;
  status?: EntityStatus;
  organization_id?: SystemUser["organization_id"];
}

export interface SystemUserRepository extends FilterableRepository<
  SystemUser,
  CreateSystemUserInput,
  UpdateSystemUserInput,
  SystemUserFilter
> {
  find_by_email(
    email: ScalarValueInput<SystemUser["email"]>,
  ): PaginatedAsyncResult<SystemUser>;
  find_by_role(
    role: SystemUserRole,
    options?: QueryOptions,
  ): PaginatedAsyncResult<SystemUser>;
  find_active_users(options?: QueryOptions): PaginatedAsyncResult<SystemUser>;
  find_admins(options?: QueryOptions): PaginatedAsyncResult<SystemUser>;
}
