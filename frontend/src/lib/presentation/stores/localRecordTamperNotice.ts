import { type Readable, writable } from "svelte/store";

import { local_record_tamper_notifier } from "$lib/infrastructure/localVault/localRecordTamperNotifier";
import type {
  LocalRecordTamperNotifier,
  LocalRecordTamperReport,
} from "$lib/infrastructure/localVault/localVaultContracts";

export const LOCAL_RECORD_TAMPER_NOTICE_STATUS = {
  HIDDEN: "hidden",
  VISIBLE: "visible",
} as const;

type LocalRecordTamperNoticeState =
  | { status: typeof LOCAL_RECORD_TAMPER_NOTICE_STATUS.HIDDEN }
  | {
      status: typeof LOCAL_RECORD_TAMPER_NOTICE_STATUS.VISIBLE;
      table_names: string[];
    };

interface LocalRecordTamperNoticeStore extends Readable<LocalRecordTamperNoticeState> {
  dismiss(): boolean;
}

const HIDDEN_STATE: LocalRecordTamperNoticeState = {
  status: LOCAL_RECORD_TAMPER_NOTICE_STATUS.HIDDEN,
};

function add_reported_table(
  state: LocalRecordTamperNoticeState,
  table_name: string,
): LocalRecordTamperNoticeState {
  const known_table_names =
    state.status === LOCAL_RECORD_TAMPER_NOTICE_STATUS.VISIBLE
      ? state.table_names
      : [];
  return {
    status: LOCAL_RECORD_TAMPER_NOTICE_STATUS.VISIBLE,
    table_names: known_table_names.includes(table_name)
      ? known_table_names
      : [...known_table_names, table_name],
  };
}

export function create_local_record_tamper_notice_store(
  notifier: LocalRecordTamperNotifier,
): LocalRecordTamperNoticeStore {
  const { subscribe, set, update } =
    writable<LocalRecordTamperNoticeState>(HIDDEN_STATE);
  const dismissed_table_names = new Set<string>();
  notifier.subscribe((report: LocalRecordTamperReport) => {
    if (dismissed_table_names.has(report.table_name)) return;
    update((state) => add_reported_table(state, report.table_name));
  });
  return {
    subscribe,
    dismiss: () => {
      update((state) => {
        if (state.status === LOCAL_RECORD_TAMPER_NOTICE_STATUS.VISIBLE)
          state.table_names.forEach((name) => dismissed_table_names.add(name));
        return state;
      });
      set(HIDDEN_STATE);
      return true;
    },
  };
}

export const local_record_tamper_notice_store =
  create_local_record_tamper_notice_store(local_record_tamper_notifier);
