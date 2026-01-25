import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";
import type {
  FixtureManagement,
  CreateFixtureManagementInput,
  UpdateFixtureManagementInput,
} from "../../entities/FixtureManagement";

export interface FixtureManagementFilter {
  fixture_id?: string;
  official_id?: string;
  role_id?: string;
  confirmation_status?: FixtureManagement["confirmation_status"];
}

export interface FixtureManagementRepository extends FilterableRepository<
  FixtureManagement,
  CreateFixtureManagementInput,
  UpdateFixtureManagementInput,
  FixtureManagementFilter
> {
  find_by_fixture(
    fixture_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureManagement>;
  find_by_official(
    official_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureManagement>;
}
