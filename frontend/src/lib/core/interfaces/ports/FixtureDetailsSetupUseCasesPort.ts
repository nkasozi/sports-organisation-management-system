import type {
  FixtureDetailsSetup,
  CreateFixtureDetailsSetupInput,
  UpdateFixtureDetailsSetupInput,
} from "../../entities/FixtureDetailsSetup";
import type { FixtureDetailsSetupFilter } from "../adapters/FixtureDetailsSetupRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";

export interface FixtureDetailsSetupUseCasesPort {
  create(
    input: CreateFixtureDetailsSetupInput,
  ): AsyncResult<FixtureDetailsSetup>;
  get_by_id(id: string): AsyncResult<FixtureDetailsSetup>;
  update(
    id: string,
    input: UpdateFixtureDetailsSetupInput,
  ): AsyncResult<FixtureDetailsSetup>;
  delete(id: string): AsyncResult<boolean>;
  list(
    filter?: FixtureDetailsSetupFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup>;
  list_by_fixture(
    fixture_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup>;
  list_by_official(
    official_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<FixtureDetailsSetup>;
  confirm_assignment(id: string): AsyncResult<FixtureDetailsSetup>;
  decline_assignment(id: string): AsyncResult<FixtureDetailsSetup>;
}
