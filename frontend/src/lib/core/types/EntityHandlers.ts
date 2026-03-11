import type { BaseEntity, EntityListResult } from "../entities/BaseEntity";
import type { AsyncResult } from "../types/Result";

export type CrudFunctionality = "create" | "edit" | "delete";

const CRUD_FUNCTIONALITIES = {
  CREATE: "create" as CrudFunctionality,
  EDIT: "edit" as CrudFunctionality,
  DELETE: "delete" as CrudFunctionality,
};

export function is_functionality_disabled(
  functionality: CrudFunctionality,
  disabled_functionalities: CrudFunctionality[],
): boolean {
  return disabled_functionalities.includes(functionality);
}

export type EntityCreateHandler<
  TInput = Record<string, unknown>,
  TEntity extends BaseEntity = BaseEntity,
> = (input: TInput) => AsyncResult<TEntity>;

export type EntityUpdateHandler<
  TInput = Record<string, unknown>,
  TEntity extends BaseEntity = BaseEntity,
> = (id: string, input: TInput) => AsyncResult<TEntity>;

export type EntityDeleteHandler = (id: string) => AsyncResult<boolean>;

export type EntityListHandler<TEntity extends BaseEntity = BaseEntity> = (
  filter?: Record<string, string>,
  options?: { page_number?: number; page_size?: number },
) => Promise<
  | EntityListResult<TEntity>
  | { success: true; data: { items: TEntity[]; total_count: number } }
  | { success: false; error: string }
>;

export type EntityGetByIdHandler<TEntity extends BaseEntity = BaseEntity> = (
  id: string,
) => AsyncResult<TEntity>;

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
