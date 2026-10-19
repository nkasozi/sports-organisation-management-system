import type {
  LocalRecordTamperNotifier,
  LocalRecordTamperReport,
} from "./localVaultContracts";

const TAMPER_LOG_EVENT = "local_record_tamper_detected";

function create_local_record_tamper_notifier(): LocalRecordTamperNotifier {
  const listeners = new Set<(report: LocalRecordTamperReport) => void>();
  return {
    report: (table_name: string, record_count: number) => {
      const report: LocalRecordTamperReport = {
        table_name,
        record_count,
        detected_at: new Date().toISOString(),
      };
      console.warn("[LocalVault] Altered local records were ignored", {
        event: TAMPER_LOG_EVENT,
        ...report,
      });
      listeners.forEach((listener) => listener(report));
    },
    subscribe: (listener: (report: LocalRecordTamperReport) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const local_record_tamper_notifier =
  create_local_record_tamper_notifier();
