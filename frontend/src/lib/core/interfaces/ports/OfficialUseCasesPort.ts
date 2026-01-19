import type {
  Official,
  CreateOfficialInput,
  UpdateOfficialInput,
} from "../../entities/Official";
import type { OfficialFilter } from "../adapters/OfficialRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface OfficialUseCasesPort extends BaseUseCasesPort<
  Official,
  CreateOfficialInput,
  UpdateOfficialInput,
  OfficialFilter
> {
  delete_officials(ids: string[]): Promise<AsyncResult<number>>;
  list_officials_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Official>>;
  list_officials_by_role_id(
    role_id: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Official>>;
  list_available_officials(
    date: string,
    organization_id?: string,
    options?: QueryOptions,
  ): Promise<PaginatedAsyncResult<Official>>;
}
