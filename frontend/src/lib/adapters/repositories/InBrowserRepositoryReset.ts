import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { ScalarInput } from "../../core/types/DomainScalars";
import type { AsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";

interface ResettableRepository<TEntity extends BaseEntity> {
  clear_all_data(): AsyncResult<boolean>;
  has_data(): AsyncResult<boolean>;
  seed_with_data(entities: ScalarInput<TEntity>[]): AsyncResult<number>;
}

export async function reset_repository_data<TEntity extends BaseEntity>(
  repository: ResettableRepository<TEntity>,
  default_entities: ScalarInput<TEntity>[],
): AsyncResult<number> {
  const clear_result = await repository.clear_all_data();
  if (!clear_result.success) return clear_result;
  return repository.seed_with_data(default_entities);
}

export async function ensure_repository_seeded<TEntity extends BaseEntity>(
  repository: ResettableRepository<TEntity>,
  create_default_entities: () => ScalarInput<TEntity>[],
): AsyncResult<number> {
  const has_data_result = await repository.has_data();
  if (!has_data_result.success) return has_data_result;
  if (has_data_result.data) return create_success_result(0);
  return repository.seed_with_data(create_default_entities());
}
