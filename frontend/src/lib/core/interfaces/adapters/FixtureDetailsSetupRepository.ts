import type { FilterableRepository, QueryOptions } from "./Repository";
import type { PaginatedAsyncResult } from "../../types/Result";
import type {
  FixtureDetailsSetup,
  CreateFixtureDetailsSetupInput,
  UpdateFixtureDetailsSetupInput,
} from "../../entities/FixtureDetailsSetup";

export interface FixtureDetailsSetupFilter {
  fixture_id?: string;
  official_id?: string;
  role_id?: string;
  confirmation_status?: FixtureDetailsSetup["confirmation_status"];
}

export interface FixtureDetailsSetupRepository extends FilterableRepository<
  FixtureDetailsSetup,
  CreateFixtureDetailsSetupInput,
  UpdateFixtureDetailsSetupInput,
  FixtureDetailsSetupFilter
> {
  find_by_fixture(
    fixture_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup>;
  find_by_official(
    official_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup>;
}
