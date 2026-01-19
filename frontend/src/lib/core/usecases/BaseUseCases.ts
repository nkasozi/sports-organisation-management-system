import type {
  BaseEntity,
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";

export type { EntityOperationResult, EntityListResult };

export interface BaseUseCases<
  T extends BaseEntity,
  CreateInput,
  UpdateInput,
  Filter = any,
> {
  create(input: CreateInput): Promise<EntityOperationResult<T>>;
  get_by_id(id: string): Promise<EntityOperationResult<T>>;
  list(
    filter?: Filter,
    pagination?: { page: number; page_size: number },
  ): Promise<EntityListResult<T>>;
  update(id: string, input: UpdateInput): Promise<EntityOperationResult<T>>;
  delete(id: string): Promise<EntityOperationResult<boolean>>;
}
