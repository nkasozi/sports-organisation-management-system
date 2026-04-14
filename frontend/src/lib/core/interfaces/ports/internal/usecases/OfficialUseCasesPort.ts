import type {
  CreateOfficialInput,
  Official,
  UpdateOfficialInput,
} from "../../../../entities/Official";
import type {
  EntityId,
  IsoDateString,
  ScalarValueInput,
} from "../../../../types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../../../types/Result";
import type { OfficialFilter } from "../../external/repositories/OfficialRepository";
import type { QueryOptions } from "../../external/repositories/Repository";
import type { BaseUseCasesPort } from "./BaseUseCasesPort";

export interface OfficialUseCasesPort extends BaseUseCasesPort<
  Official,
  CreateOfficialInput,
  UpdateOfficialInput,
  OfficialFilter
> {
  delete_officials(
    ids: Array<ScalarValueInput<Official["id"]>>,
  ): AsyncResult<number>;
  list_officials_by_organization(
    organization_id: ScalarValueInput<Official["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official>;
  list_officials_by_role_id(
    role_id: ScalarValueInput<EntityId>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official>;
  list_available_officials(
    date: ScalarValueInput<IsoDateString>,
    organization_id?: ScalarValueInput<Official["organization_id"]>,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official>;
}
