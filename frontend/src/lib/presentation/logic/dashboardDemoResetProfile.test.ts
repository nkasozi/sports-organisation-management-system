import { readable } from "svelte/store";
import { describe, expect, it, vi } from "vitest";

import {
  finish_demo_reset,
  read_demo_profile_id,
  restore_demo_profile_after_reset,
} from "./dashboardDemoResetProfile";

function store(
  current_id: string,
  available_ids: string[],
  switch_profile: (id: string) => Promise<boolean>,
): never {
  return {
    ...readable(state(current_id, available_ids)),
    switch_profile,
  } as never;
}

function state(current_id: string, available_ids: string[]): never {
  return {
    current_profile: current_id
      ? { status: "present", profile: { id: current_id } }
      : { status: "missing" },
    available_profiles: available_ids.map((id) => ({ id })),
  } as never;
}

describe("keeping the demo profile across a demo data reset", () => {
  it("reads the current demo profile before the reset", () => {
    expect(read_demo_profile_id(state("super_admin", []))).toBe("super_admin");
    expect(read_demo_profile_id(state("", []))).toBe("");
  });

  it("switches back to the same demo profile after the reset", async () => {
    const switch_profile = vi.fn(async () => true);
    const restored = await restore_demo_profile_after_reset(
      "super_admin",
      store("public_viewer", ["public_viewer", "super_admin"], switch_profile),
    );
    expect(restored).toBe(true);
    expect(switch_profile).toHaveBeenCalledWith("super_admin");
  });

  it("saves the profile again even when the screen still shows it, because the reset cleared the saved choice", async () => {
    const switch_profile = vi.fn(async () => true);
    await restore_demo_profile_after_reset(
      "super_admin",
      store("super_admin", ["super_admin"], switch_profile),
    );
    expect(switch_profile).toHaveBeenCalledWith("super_admin");
  });

  it("does nothing when the profile no longer exists", async () => {
    const switch_profile = vi.fn(async () => true);
    await restore_demo_profile_after_reset(
      "gone",
      store("public_viewer", ["public_viewer"], switch_profile),
    );
    expect(switch_profile).not.toHaveBeenCalled();
  });
});

describe("finishing a demo data reset", () => {
  it("marks the device as set up and then keeps the demo profile, so a reload does not reset again", async () => {
    const calls: string[] = [];
    const finished = await finish_demo_reset("super_admin", {
      store: store(
        "public_viewer",
        ["public_viewer", "super_admin"],
        async (id) => {
          calls.push(`switch:${id}`);
          return true;
        },
      ),
      mark_device_set_up: async () => {
        calls.push("marked");
        return { success: true, data: true } as never;
      },
    });
    expect(finished).toBe(true);
    expect(calls).toEqual(["marked", "switch:super_admin"]);
  });
});
