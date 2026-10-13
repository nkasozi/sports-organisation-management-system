import { describe, expect, it } from "vitest";

import { create_keyed_serial_executor } from "./KeyedSerialExecutor";

function create_deferred(): {
  promise: Promise<string>;
  resolve: (value: string) => void;
} {
  let resolve: (value: string) => void = () => {};
  const promise = new Promise<string>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("create_keyed_serial_executor", () => {
  it("runs tasks for the same key one after another", async () => {
    const executor = create_keyed_serial_executor();
    const order: string[] = [];
    const first_gate = create_deferred();
    const first = executor.run("fx1", async () => {
      order.push("first_started");
      await first_gate.promise;
      order.push("first_finished");
      return "first";
    });
    const second = executor.run("fx1", async () => {
      order.push("second_started");
      return "second";
    });
    await Promise.resolve();
    expect(order).toEqual(["first_started"]);
    first_gate.resolve("go");
    expect(await Promise.all([first, second])).toEqual(["first", "second"]);
    expect(order).toEqual([
      "first_started",
      "first_finished",
      "second_started",
    ]);
  });

  it("does not block tasks for other keys", async () => {
    const executor = create_keyed_serial_executor();
    const gate = create_deferred();
    const blocked = executor.run("fx1", () => gate.promise);
    expect(await executor.run("fx2", async () => "other")).toBe("other");
    gate.resolve("done");
    expect(await blocked).toBe("done");
  });

  it("keeps running later tasks after an earlier task rejects", async () => {
    const executor = create_keyed_serial_executor();
    const failing = executor.run("fx1", () => Promise.reject(new Error("x")));
    await expect(failing).rejects.toThrow("x");
    expect(await executor.run("fx1", async () => "after")).toBe("after");
  });
});
