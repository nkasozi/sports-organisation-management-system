import type {
  CreateFixtureDetailsSetupInput,
  FixtureDetailsSetup,
  UpdateFixtureDetailsSetupInput,
} from "../../../../entities/FixtureDetailsSetup";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface FixtureDetailsSetupFilter {
  organization_id?: string;
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
