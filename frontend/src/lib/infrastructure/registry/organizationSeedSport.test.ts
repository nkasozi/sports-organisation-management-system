import { describe, expect, it, vi } from "vitest";

import { OptionStatus } from "$lib/core/types/Option";

import { find_organization_seed_sport } from "./organizationSeedSport";

describe("find_organization_seed_sport", () => {
  it("returns the organisation's sport", async () => {
    const sport = { id: "sport_netball", code: "NETBALL" };
    const get_by_id = vi.fn(async () => ({ success: true, data: sport }));

    const seed_sport = await find_organization_seed_sport(
      { id: "org_1", sport_id: "sport_netball" } as never,
      { get_by_id } as never,
    );

    expect(get_by_id).toHaveBeenCalledWith("sport_netball");
    expect(seed_sport).toEqual({ status: OptionStatus.SOME, value: sport });
  });

  it("falls back to the default set and logs when the sport is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const seed_sport = await find_organization_seed_sport(
      { id: "org_1", sport_id: "sport_gone" } as never,
      {
        get_by_id: async () => ({ success: false, error: "Sport not found" }),
      } as never,
    );

    expect(seed_sport).toEqual({ status: OptionStatus.NONE });
    expect(warn).toHaveBeenCalledWith(
      "[UseCaseFactories] Organization sport unavailable for defaults",
      expect.objectContaining({
        event: "use_case_registry_organization_seed_sport_missing",
        organization_id: "org_1",
      }),
    );
    warn.mockRestore();
  });
});
