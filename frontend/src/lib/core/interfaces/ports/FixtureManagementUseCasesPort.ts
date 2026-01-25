import type {
  FixtureManagement,
  CreateFixtureManagementInput,
  UpdateFixtureManagementInput,
} from "../../entities/FixtureManagement";
import type { FixtureManagementFilter } from "../adapters/FixtureManagementRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";

export interface FixtureManagementUseCasesPort {
  create(input: CreateFixtureManagementInput): AsyncResult<FixtureManagement>;
  get_by_id(id: string): AsyncResult<FixtureManagement>;
  update(
    id: string,
    input: UpdateFixtureManagementInput,
  ): AsyncResult<FixtureManagement>;
  delete(id: string): AsyncResult<boolean>;
  list(
    filter?: FixtureManagementFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureManagement>;
  list_by_fixture(
    fixture_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureManagement>;
  list_by_official(
    official_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureManagement>;
  confirm_assignment(id: string): AsyncResult<FixtureManagement>;
  decline_assignment(id: string): AsyncResult<FixtureManagement>;
}
