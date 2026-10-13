import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AsyncResult,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  type CoordinatorTestConfiguration,
  create_coordinator_test_subject,
  create_default_coordinator_test_configuration,
} from "./storageBackupCoordinatorTestHarness";

interface ControllableWrite {
  resolve: (result: Result<boolean>) => void;
}

function create_controllable_writes(): {
  writes: ControllableWrite[];
  write_backup_json: () => AsyncResult<boolean>;
} {
  const writes: ControllableWrite[] = [];
  return {
    writes,
    write_backup_json: () =>
      new Promise((resolve) => {
        writes.push({ resolve });
      }),
  };
}

describe("device backup writes", () => {
  let configuration: CoordinatorTestConfiguration;

  beforeEach(() => {
    configuration = create_default_coordinator_test_configuration();
  });

  it("serializes overlapping writes so a later write never starts before the earlier one settles", async () => {
    const { writes, write_backup_json } = create_controllable_writes();
    const { subject, write_backup_json_mock } = create_coordinator_test_subject(
      configuration,
      write_backup_json,
    );

    const first_write = subject.write_device_backup();
    const second_write = subject.write_device_backup();
    await vi.waitFor(() => expect(writes).toHaveLength(1));
    await Promise.resolve();
    expect(write_backup_json_mock).toHaveBeenCalledTimes(1);

    writes[0].resolve(create_success_result(true));
    await first_write;
    await vi.waitFor(() => expect(writes).toHaveLength(2));
    writes[1].resolve(create_success_result(true));

    expect((await second_write).success).toBe(true);
  });

  it("waits for every queued write before deleting and never recreates the backup afterwards", async () => {
    const { writes, write_backup_json } = create_controllable_writes();
    const { subject, recorder, write_backup_json_mock } =
      create_coordinator_test_subject(configuration, write_backup_json);

    const in_flight_write = subject.write_device_backup();
    const queued_write = subject.write_device_backup();
    await vi.waitFor(() => expect(writes).toHaveLength(1));
    const delete_promise = subject.delete_device_backup();
    writes[0].resolve(create_success_result(true));
    await in_flight_write;

    expect(await delete_promise).toEqual({ status: "deleted" });
    expect(await queued_write).toEqual({
      success: true,
      data: { status: "skipped_writer_closed" },
    });
    expect(await subject.write_device_backup()).toEqual({
      success: true,
      data: { status: "skipped_writer_closed" },
    });
    expect(write_backup_json_mock).toHaveBeenCalledTimes(1);
    expect(recorder.call_order).toEqual(["delete_backup"]);
  });
});
