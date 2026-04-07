import type {
  CreateGenderInput,
  Gender,
  UpdateGenderInput,
} from "../../../../entities/Gender";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { GenderFilter } from "../../external/repositories/GenderRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

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
