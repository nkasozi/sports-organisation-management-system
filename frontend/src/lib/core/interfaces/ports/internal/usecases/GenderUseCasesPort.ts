import type {
  CreateGenderInput,
  Gender,
  UpdateGenderInput,
} from "../../../../entities/Gender";
import type { ScalarValueInput } from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { GenderFilter } from "../../external/repositories/GenderRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

export interface GenderUseCasesPort {
  create(input: CreateGenderInput): AsyncResult<Gender>;
  update(
    id: ScalarValueInput<Gender["id"]>,
    input: UpdateGenderInput,
  ): AsyncResult<Gender>;
  delete(id: ScalarValueInput<Gender["id"]>): AsyncResult<boolean>;
  get_by_id(id: ScalarValueInput<Gender["id"]>): AsyncResult<Gender>;
  list(
    filter?: GenderFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Gender>;
  list_all(): PaginatedAsyncResult<Gender>;
}
