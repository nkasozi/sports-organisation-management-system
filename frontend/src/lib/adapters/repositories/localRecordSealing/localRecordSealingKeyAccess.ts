import { OptionStatus } from "$lib/core/types/Option";

import {
  type LocalRecordSealingDependencies,
  LocalRecordSealingEvent,
  LocalRecordSealingFailure,
  type LocalRecordSealingOperationValue,
} from "./localRecordSealingTypes";

type LocalDataKeyGuard = <TResult>(
  operation: LocalRecordSealingOperationValue,
  run: (data_key: Uint8Array) => Promise<TResult>,
) => Promise<TResult>;

export function with_local_data_key(
  dependencies: LocalRecordSealingDependencies,
  table_name: string,
): LocalDataKeyGuard {
  return <TResult>(
    operation: LocalRecordSealingOperationValue,
    run: (data_key: Uint8Array) => Promise<TResult>,
  ): Promise<TResult> => {
    const data_key = dependencies.read_data_key();
    switch (data_key.status) {
      case OptionStatus.SOME:
        return run(data_key.value);
      case OptionStatus.NONE:
        console.error("[LocalRecordSealing] Local data is locked", {
          event: LocalRecordSealingEvent.LOCKED_ACCESS_REJECTED,
          table_name,
          operation,
        });
        return Promise.reject(new Error(LocalRecordSealingFailure.LOCKED));
    }
  };
}
