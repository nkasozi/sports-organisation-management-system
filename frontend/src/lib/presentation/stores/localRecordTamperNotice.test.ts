import { get } from "svelte/store";
import { describe, expect, it } from "vitest";

import type { LocalRecordTamperReport } from "$lib/infrastructure/localVault/localVaultContracts";

import { create_local_record_tamper_notice_store } from "./localRecordTamperNotice";

function create_fake_notifier(): {
  notifier: never;
  report: (table_name: string) => void;
} {
  const listeners: Array<(report: LocalRecordTamperReport) => void> = [];
  return {
    notifier: {
      report: () => {},
      subscribe: (listener: (report: LocalRecordTamperReport) => void) => {
        listeners.push(listener);
        return () => true;
      },
    } as never,
    report: (table_name: string) =>
      listeners.forEach((listener) =>
        listener({ table_name, record_count: 1, detected_at: "now" }),
      ),
  };
}

describe("create_local_record_tamper_notice_store", () => {
  it("shows the notice once per affected table", () => {
    const fake = create_fake_notifier();
    const store = create_local_record_tamper_notice_store(fake.notifier);

    fake.report("teams");
    fake.report("teams");
    fake.report("players");

    expect(get(store)).toEqual({
      status: "visible",
      table_names: ["teams", "players"],
    });
  });

  it("stays hidden for tables the user already dismissed", () => {
    const fake = create_fake_notifier();
    const store = create_local_record_tamper_notice_store(fake.notifier);
    fake.report("teams");

    store.dismiss();
    fake.report("teams");

    expect(get(store)).toEqual({ status: "hidden" });
    fake.report("fixtures");
    expect(get(store)).toEqual({
      status: "visible",
      table_names: ["fixtures"],
    });
  });
});
