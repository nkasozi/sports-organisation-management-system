import type {
  CreateQualificationInput,
  Qualification,
  QualificationHolderType,
  UpdateQualificationInput,
} from "../../../../entities/Qualification";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { QualificationFilter } from "../../external/repositories/QualificationRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

export interface QualificationUseCasesPort {
  create(input: CreateQualificationInput): AsyncResult<Qualification>;
  update(
    id: Qualification["id"],
    input: UpdateQualificationInput,
  ): AsyncResult<Qualification>;
  delete(id: Qualification["id"]): AsyncResult<boolean>;
  get_by_id(id: Qualification["id"]): AsyncResult<Qualification>;
  list(
    filter?: QualificationFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Qualification>;
  list_by_holder(
    holder_type: QualificationHolderType,
    holder_id: Qualification["holder_id"],
  ): PaginatedAsyncResult<Qualification>;
  list_all(): PaginatedAsyncResult<Qualification>;
}
