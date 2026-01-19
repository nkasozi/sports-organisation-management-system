import type {
  Qualification,
  CreateQualificationInput,
  UpdateQualificationInput,
  QualificationHolderType,
} from "../../entities/Qualification";
import type { QualificationFilter } from "../adapters/QualificationRepository";
import type { QueryOptions } from "../adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../../types/Result";

export interface QualificationUseCasesPort {
  create(input: CreateQualificationInput): AsyncResult<Qualification>;
  update(
    id: string,
    input: UpdateQualificationInput,
  ): AsyncResult<Qualification>;
  delete(id: string): AsyncResult<boolean>;
  get_by_id(id: string): AsyncResult<Qualification>;
  list(
    filter?: QualificationFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification>;
  list_by_holder(
    holder_type: QualificationHolderType,
    holder_id: string,
  ): PaginatedAsyncResult<Qualification>;
  list_all(): PaginatedAsyncResult<Qualification>;
}
