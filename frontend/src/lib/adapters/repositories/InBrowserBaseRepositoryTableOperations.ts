import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { AsyncResult } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { format_repository_error } from "./InBrowserBaseRepositoryHelpers";

export async function count_entities<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
): AsyncResult<number> {
  try {
    return create_success_result(await table.count());
  } catch (error) {
    console.warn("[Repository] Failed to count entities", {
      event: "repository_count_entities_failed",
      error: String(error),
    });
    return create_failure_result(
      format_repository_error(error, "count entities"),
    );
  }
}

export async function seed_entities<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  entities: TEntity[],
  entity_prefix: string,
): AsyncResult<number> {
  try {
    await table.bulkPut(entities);
    console.log("[Repository] Seeded records successfully", {
      event: "repository_seed_success",
      entity_prefix,
      record_count: entities.length,
    });
    return create_success_result(entities.length);
  } catch (error) {
    console.error("[Repository] Failed to seed data", {
      event: "repository_seed_failed",
      entity_prefix,
      error: String(error),
    });
    return create_failure_result(
      format_repository_error(error, `seed ${entity_prefix}`),
    );
  }
}

export async function clear_entity_data<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  entity_prefix: string,
): Promise<void> {
  try {
    await table.clear();
  } catch (error) {
    console.error(`[${entity_prefix}] Failed to clear data`, {
      event: "repository_clear_failed",
      entity_prefix,
      error: String(error),
    });
  }
}

export async function table_has_data<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  entity_prefix: string,
): Promise<boolean> {
  try {
    return (await table.count()) > 0;
  } catch (error) {
    console.warn(`[${entity_prefix}] Failed to check data existence`, {
      event: "repository_has_data_check_failed",
      entity_prefix,
      error: String(error),
    });
    return false;
  }
}
