import type { GenericId } from "convex/values";

import type { MutationCtx } from "../_generated/server";
import { type Option, option_from_document } from "./option";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { is_number } from "./value_guards";

const LOCAL_ID_INDEX_NAME = "by_local_id";
const DOCUMENT_ID_FIELD_NAME = "_id";
const VERSION_FIELD_NAME = "version";
const MISSING_VERSION = 0;

export async function load_existing_sync_record(
  ctx: MutationCtx,
  table_name: AllowedSyncTable,
  local_id: string,
): Promise<Option<Record<string, unknown>>> {
  const existing_record = await ctx.db
    .query(table_name)
    .withIndex(LOCAL_ID_INDEX_NAME, (query) => query.eq("local_id", local_id))
    .first();
  return option_from_document(existing_record);
}

export function read_document_id(
  record: Record<string, unknown>,
): GenericId<AllowedSyncTable> {
  return record[DOCUMENT_ID_FIELD_NAME] as GenericId<AllowedSyncTable>;
}

export function read_record_version(record: Record<string, unknown>): number {
  const version = record[VERSION_FIELD_NAME];
  return is_number(version) ? version : MISSING_VERSION;
}
