import type {
  CreateFixtureDetailsSetupInput,
  FixtureDetailsSetup,
  UpdateFixtureDetailsSetupInput,
} from "../../../../entities/FixtureDetailsSetup";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { FixtureDetailsSetupFilter } from "../../external/repositories/FixtureDetailsSetupRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

export interface FixtureDetailsSetupUseCasesPort {
  create(
    input: CreateFixtureDetailsSetupInput,
  ): AsyncResult<FixtureDetailsSetup>;
  get_by_id(id: FixtureDetailsSetup["id"]): AsyncResult<FixtureDetailsSetup>;
  update(
    id: FixtureDetailsSetup["id"],
    input: UpdateFixtureDetailsSetupInput,
  ): AsyncResult<FixtureDetailsSetup>;
  delete(id: FixtureDetailsSetup["id"]): AsyncResult<boolean>;
  list(
    filter?: FixtureDetailsSetupFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup>;
  list_by_fixture(
    fixture_id: FixtureDetailsSetup["fixture_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup>;
  list_by_official(
    official_id: FixtureDetailsSetup["assigned_officials"][number]["official_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup>;
  confirm_assignment(
    id: FixtureDetailsSetup["id"],
  ): AsyncResult<FixtureDetailsSetup>;
  decline_assignment(
    id: FixtureDetailsSetup["id"],
  ): AsyncResult<FixtureDetailsSetup>;
}
