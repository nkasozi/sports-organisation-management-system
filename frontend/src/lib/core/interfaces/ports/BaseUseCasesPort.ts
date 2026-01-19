import type {
  BaseEntity,
  EntityOperationResult,
  EntityListResult,
} from "../../entities/BaseEntity";
import type { QueryOptions } from "../adapters/Repository";

export type { EntityOperationResult, EntityListResult };

export interface BaseUseCasesPort<
  T extends BaseEntity,
  CreateInput,
  UpdateInput,
  Filter = unknown,
> {
  create(input: CreateInput): Promise<EntityOperationResult<T>>;
  get_by_id(id: string): Promise<EntityOperationResult<T>>;
  list(
    filter?: Filter,
    pagination?: QueryOptions,
  ): Promise<EntityListResult<T>>;
  update(id: string, input: UpdateInput): Promise<EntityOperationResult<T>>;
  delete(id: string): Promise<EntityOperationResult<boolean>>;
}
