import { describe, expect, it, vi } from "vitest";

import {
  list_live_games_organization_candidates,
  load_first_organization_with_fixtures,
} from "./liveGamesOrganizationChoice";

const ORGANIZATIONS = [{ id: "org_empty" }, { id: "org_busy" }];

function fixtures_for(
  organization_id: string,
): Promise<{ success: true; data: { fixtures: string[] } }> {
  return Promise.resolve({
    success: true as const,
    data: { fixtures: organization_id === "org_busy" ? ["f1"] : [] },
  });
}

describe("live games opens on an organisation with fixtures", () => {
  it("moves past an organisation with no fixtures", async () => {
    const choice = await load_first_organization_with_fixtures(
      list_live_games_organization_candidates(
        ORGANIZATIONS,
        "org_empty",
        new URLSearchParams(),
      ),
      fixtures_for,
    );
    expect(choice.organization_id).toBe("org_busy");
  });

  it("keeps the organisation named in the link", async () => {
    const load = vi.fn(fixtures_for);
    const choice = await load_first_organization_with_fixtures(
      list_live_games_organization_candidates(
        ORGANIZATIONS,
        "org_empty",
        new URLSearchParams({ organization_id: "org_empty" }),
      ),
      load,
    );
    expect(choice.organization_id).toBe("org_empty");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("stays on the first organisation when none has fixtures", async () => {
    const choice = await load_first_organization_with_fixtures(
      ["org_a", "org_b"],
      fixtures_for,
    );
    expect(choice.organization_id).toBe("org_a");
  });
});
