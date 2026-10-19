import type {
  DBCoreAddRequest,
  DBCoreMutateRequest,
  DBCoreMutateResponse,
  DBCorePutRequest,
  DBCoreTable,
} from "dexie";

import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import { seal_local_record } from "./localRecordSealer";
import {
  LocalRecordSealingEvent,
  LocalRecordSealingFailure,
  type LocalRecordSealingPlan,
} from "./localRecordSealingTypes";

const DBCoreMutationType = {
  ADD: "add",
  PUT: "put",
  DELETE: "delete",
  DELETE_RANGE: "deleteRange",
} as const;

function seal_values(
  plan: LocalRecordSealingPlan,
  data_key: Uint8Array,
  values: readonly unknown[],
): Result<object[]> {
  const sealed_values: object[] = [];
  for (const value of values) {
    const sealed = seal_local_record(plan, data_key, Object(value) as object);
    if (!sealed.success)
      return create_failure_result(LocalRecordSealingFailure.SEAL_FAILED);
    sealed_values.push(sealed.data);
  }
  return create_success_result(sealed_values);
}

function write_sealed_values(
  down_table: DBCoreTable,
  plan: LocalRecordSealingPlan,
  data_key: Uint8Array,
  request: DBCoreAddRequest | DBCorePutRequest,
): Promise<DBCoreMutateResponse> {
  const sealed_values = seal_values(plan, data_key, request.values);
  if (sealed_values.success)
    return down_table.mutate({ ...request, values: sealed_values.data });
  console.error("[LocalRecordSealing] Local records could not be sealed", {
    event: LocalRecordSealingEvent.SEAL_FAILED,
    table_name: plan.table_name,
    record_count: request.values.length,
    error: sealed_values.error,
  });
  return Promise.reject(new Error(sealed_values.error));
}

export function mutation_needs_data_key(request: DBCoreMutateRequest): boolean {
  switch (request.type) {
    case DBCoreMutationType.ADD:
    case DBCoreMutationType.PUT:
      return true;
    case DBCoreMutationType.DELETE:
    case DBCoreMutationType.DELETE_RANGE:
      return false;
  }
}

export function mutate_sealed_records(
  down_table: DBCoreTable,
  plan: LocalRecordSealingPlan,
  data_key: Uint8Array,
  request: DBCoreMutateRequest,
): Promise<DBCoreMutateResponse> {
  switch (request.type) {
    case DBCoreMutationType.ADD:
    case DBCoreMutationType.PUT:
      return write_sealed_values(down_table, plan, data_key, request);
    case DBCoreMutationType.DELETE:
    case DBCoreMutationType.DELETE_RANGE:
      return down_table.mutate(request);
  }
}
