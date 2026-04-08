import { describe, expect, it, vi } from "vitest";

import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";

const { build_authorization_list_filter_mock } = vi.hoisted(() => ({
  build_authorization_list_filter_mock: vi.fn(),
}));

vi.mock("../../core/interfaces/ports", () => ({
  build_authorization_list_filter: build_authorization_list_filter_mock,
}));

import {
  apply_id_filter_to_entities,
  build_entity_authorization_filter,
  merge_entity_list_filters,
} from "./listAuthorizationFilterLogic";

describe("listAuthorizationFilterLogic", () => {
  it("returns a missing-profile result when no profile is available", () => {
    expect(build_entity_authorization_filter(null, null, "team")).toEqual({
      filter: null,
      profile_missing: true,
    });
  });

  it("adds entity-specific authorization overrides for player and team scopes", () => {
    build_authorization_list_filter_mock.mockImplementation(() => ({
      organization_id: "org_1",
    }));

    expect(
      build_entity_authorization_filter(
        {
          player_id: "player_1",
          team_id: "team_1",
          official_id: WILDCARD_SCOPE,
        } as never,
        {
          fields: [
            { field_name: "organization_id" },
            { field_name: "team_id" },
            { field_name: "player_id" },
          ],
        } as never,
        "player-team-membership",
      ),
    ).toEqual({
      filter: {
        organization_id: "org_1",
        player_id: "player_1",
      },
      profile_missing: false,
    });

    expect(
      build_entity_authorization_filter(
        {
          player_id: WILDCARD_SCOPE,
          team_id: "team_1",
          official_id: "official_1",
        } as never,
        {
          fields: [{ field_name: "id" }],
        } as never,
        "official",
      ),
    ).toEqual({
      filter: {
        organization_id: "org_1",
        id: "official_1",
      },
      profile_missing: false,
    });
  });

  it("applies id filters and merges list filters", () => {
    const entities = [{ id: "team_1" }, { id: "team_2" }] as never[];

    expect(apply_id_filter_to_entities(entities, { id: "team_2" })).toEqual([
      entities[1],
    ]);
    expect(
      merge_entity_list_filters({ competition_id: "competition_1" }, {}),
    ).toEqual({
      competition_id: "competition_1",
    });
    expect(
      merge_entity_list_filters(
        { competition_id: "competition_1" },
        { organization_id: "org_1" },
      ),
    ).toEqual({
      competition_id: "competition_1",
      organization_id: "org_1",
    });
    expect(merge_entity_list_filters(undefined, null)).toBeUndefined();
  });
});
