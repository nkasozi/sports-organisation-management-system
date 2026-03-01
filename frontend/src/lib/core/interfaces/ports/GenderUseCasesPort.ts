import type {
  Gender,
  CreateGenderInput,
  UpdateGenderInput,
} from "../../entities/Gender";
import type { GenderFilter } from "../adapters/GenderRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";

export interface GenderUseCasesPort {
  create(input: CreateGenderInput): AsyncResult<Gender>;
  update(id: string, input: UpdateGenderInput): AsyncResult<Gender>;
  delete(id: string): AsyncResult<boolean>;
  get_by_id(id: string): AsyncResult<Gender>;
  list(
    filter?: GenderFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Gender>;
  list_all(): PaginatedAsyncResult<Gender>;
}
