import type {
  CreateIdentificationTypeInput,
  IdentificationType,
  UpdateIdentificationTypeInput,
} from "../../../../entities/IdentificationType";
import type {
  EntityId,
  ScalarValueInput,
} from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { IdentificationTypeFilter } from "../../external/repositories/IdentificationTypeRepository";
import type { QueryOptions } from "../../external/repositories/Repository";

export interface IdentificationTypeUseCasesPort {
  create(input: CreateIdentificationTypeInput): AsyncResult<IdentificationType>;
  update(
    id: ScalarValueInput<IdentificationType["id"]>,
    input: UpdateIdentificationTypeInput,
  ): AsyncResult<IdentificationType>;
  delete(id: ScalarValueInput<IdentificationType["id"]>): AsyncResult<boolean>;
  get_by_id(
    id: ScalarValueInput<IdentificationType["id"]>,
  ): AsyncResult<IdentificationType>;
  list(
    filter?: IdentificationTypeFilter | Record<string, string>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<IdentificationType>;
  list_all(): PaginatedAsyncResult<IdentificationType>;
  list_types_by_sport(
    sport_id: ScalarValueInput<EntityId>,
  ): PaginatedAsyncResult<IdentificationType>;
}
