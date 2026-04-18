import type {
  CreateFixtureDetailsSetupInput,
  FixtureDetailsSetup,
  UpdateFixtureDetailsSetupInput,
} from "../../../../entities/FixtureDetailsSetup";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type { PaginatedAsyncResult } from "../../../../types/Result";
import type { FilterableRepository, QueryOptions } from "./Repository";

export interface FixtureDetailsSetupFilter {
  organization_id?: ScalarValueInput<FixtureDetailsSetup["organization_id"]>;
  fixture_id?: ScalarValueInput<FixtureDetailsSetup["fixture_id"]>;
  official_id?: ScalarValueInput<
    FixtureDetailsSetup["assigned_officials"][number]["official_id"]
  >;
  role_id?: ScalarValueInput<
    FixtureDetailsSetup["assigned_officials"][number]["role_id"]
  >;
  confirmation_status?: FixtureDetailsSetup["confirmation_status"];
}

export interface FixtureDetailsSetupRepository extends FilterableRepository<
  FixtureDetailsSetup,
  CreateFixtureDetailsSetupInput,
  UpdateFixtureDetailsSetupInput,
  FixtureDetailsSetupFilter
> {
  find_by_fixture(
    fixture_id: ScalarValueInput<FixtureDetailsSetup["fixture_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup>;
  find_by_official(
    official_id: ScalarValueInput<
      FixtureDetailsSetup["assigned_officials"][number]["official_id"]
    >,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup>;
}
