import { describe, expect, it, vi } from "vitest";

import { resolve_selected_organization_id } from "./calendarPageShellControllerInitialData";

vi.mock("$lib/infrastructure/sync/convexPublicDataService", () => ({
  fetch_public_data_from_convex: vi.fn(),
}));

const ORGANIZATIONS = [
  { id: "org_empty", name: "A New Union" },
  { id: "org_busy", name: "Uganda Hockey Association" },
] as never;

const competition_use_cases = {
  list: vi.fn(async (filter: { organization_id: string }) => ({
    success: true,
    data: {
      items: filter.organization_id === "org_busy" ? [{ id: "c1" }] : [],
    },
  })),
} as never;

describe("calendar opens on an organisation with competitions", () => {
  it("skips an empty organisation when none was chosen before", async () => {
    expect(
      await resolve_selected_organization_id(
        ORGANIZATIONS,
        "",
        competition_use_cases,
      ),
    ).toBe("org_busy");
  });

  it("keeps the organisation chosen before", async () => {
    expect(
      await resolve_selected_organization_id(
        ORGANIZATIONS,
        "org_empty",
        competition_use_cases,
      ),
    ).toBe("org_empty");
  });
});
