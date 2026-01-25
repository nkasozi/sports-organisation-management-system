import type {
  BaseEntity,
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";

export type EntityCreateHandler<
  TInput = Record<string, unknown>,
  TEntity extends BaseEntity = BaseEntity,
> = (input: TInput) => Promise<EntityOperationResult<TEntity>>;

export type EntityUpdateHandler<
  TInput = Record<string, unknown>,
  TEntity extends BaseEntity = BaseEntity,
> = (id: string, input: TInput) => Promise<EntityOperationResult<TEntity>>;

export type EntityDeleteHandler = (
  id: string,
) => Promise<EntityOperationResult<boolean>>;

export type EntityListHandler<TEntity extends BaseEntity = BaseEntity> = (
  filter?: Record<string, string>,
  options?: { page_number?: number; page_size?: number },
) => Promise<
  | EntityListResult<TEntity>
  | EntityOperationResult<{ items: TEntity[]; total_count: number }>
>;

export type EntityGetByIdHandler<TEntity extends BaseEntity = BaseEntity> = (
  id: string,
) => Promise<EntityOperationResult<TEntity>>;

export interface EntityCrudHandlers<
  TEntity extends BaseEntity = BaseEntity,
  TCreateInput = Record<string, unknown>,
  TUpdateInput = Record<string, unknown>,
> {
  create?: EntityCreateHandler<TCreateInput, TEntity>;
  update?: EntityUpdateHandler<TUpdateInput, TEntity>;
  delete?: EntityDeleteHandler;
  list?: EntityListHandler<TEntity>;
  get_by_id?: EntityGetByIdHandler<TEntity>;
}

export type OnEntitySavedCallback<TEntity extends BaseEntity = BaseEntity> = (
  entity: TEntity,
  is_new: boolean,
) => void;

export type OnEntityDeletedCallback<TEntity extends BaseEntity = BaseEntity> = (
  entity: TEntity,
) => void;

export type OnFormCancelledCallback = () => void;

export type OnEditRequestedCallback<TEntity extends BaseEntity = BaseEntity> = (
  entity: TEntity,
) => void;

export type OnCreateRequestedCallback = () => void;

export interface EntityViewCallbacks<TEntity extends BaseEntity = BaseEntity> {
  on_edit_requested?: OnEditRequestedCallback<TEntity>;
  on_create_requested?: OnCreateRequestedCallback;
  on_save_completed?: OnEntitySavedCallback<TEntity>;
  on_delete_completed?: OnEntityDeletedCallback<TEntity>;
  on_cancel?: OnFormCancelledCallback;
}
