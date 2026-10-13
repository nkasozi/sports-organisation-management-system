import { beforeEach, describe, expect, it, vi } from "vitest";

import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";
import { build_entity_authorization_filter } from "./listAuthorizationFilterLogic";

const { build_authorization_list_filter_mock } = vi.hoisted(() => ({
  build_authorization_list_filter_mock: vi.fn(),
}));

vi.mock("../../core/interfaces/ports", () => ({
  build_authorization_list_filter: build_authorization_list_filter_mock,
}));

const SCOPED_PROFILE = {
  player_id: "player_1",
  team_id: "team_1",
  official_id: "official_1",
};

function build_filter_for(
  entity_type: string,
  profile: Record<string, unknown>,
): unknown {
  return build_entity_authorization_filter(
    { status: "present", profile: profile as never },
    { status: "present", entity_metadata: { fields: [] } as never },
    entity_type,
  );
}

function ready(filter: Record<string, string>): unknown {
  return { status: "ready", filter_state: { status: "present", filter } };
}

describe("build_entity_authorization_filter scope characterization", () => {
  beforeEach(() => {
    build_authorization_list_filter_mock.mockImplementation(() => ({
      organization_id: "org_1",
    }));
  });

  it.each([
    ["player", { id: "player_1", team_id: "team_1" }],
    ["Player Profile", { player_id: "player_1" }],
    ["fixture", { team_id: "team_1" }],
    ["team", { id: "team_1" }],
    ["team_profile", { team_id: "team_1" }],
    ["official", { id: "official_1" }],
    ["venue", {}],
  ])("applies scoped overrides for %s", (entity_type, expected) => {
    expect(build_filter_for(entity_type, SCOPED_PROFILE)).toEqual(
      ready({ organization_id: "org_1", ...expected }),
    );
  });

  it("ignores wildcard and absent scopes", () => {
    expect(build_filter_for("player", { team_id: WILDCARD_SCOPE })).toEqual(
      ready({ organization_id: "org_1" }),
    );
  });

  it("returns an empty present filter when metadata is missing", () => {
    expect(
      build_entity_authorization_filter(
        { status: "present", profile: SCOPED_PROFILE as never },
        { status: "missing" },
        "player",
      ),
    ).toEqual(ready({}));
  });
});
