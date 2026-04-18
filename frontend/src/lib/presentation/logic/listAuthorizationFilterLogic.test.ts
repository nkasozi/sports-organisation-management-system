import { describe, expect, it, vi } from "vitest";

import { WILDCARD_SCOPE } from "../../core/entities/StatusConstants";
import {
  apply_id_filter_to_entities,
  build_entity_authorization_filter,
  merge_entity_list_filters,
} from "./listAuthorizationFilterLogic";

const { build_authorization_list_filter_mock } = vi.hoisted(() => ({
  build_authorization_list_filter_mock: vi.fn(),
}));

vi.mock("../../core/interfaces/ports", () => ({
  build_authorization_list_filter: build_authorization_list_filter_mock,
}));

describe("listAuthorizationFilterLogic", () => {
  it("returns a missing-profile result when no profile is available", () => {
    expect(
      build_entity_authorization_filter(
        { status: "missing" },
        { status: "missing" },
        "team",
      ),
    ).toEqual({ status: "profile_missing" });
  });

  it("adds entity-specific authorization overrides for player and team scopes", () => {
    build_authorization_list_filter_mock.mockImplementation(() => ({
      organization_id: "org_1",
    }));

    expect(
      build_entity_authorization_filter(
        {
          status: "present",
          profile: {
            player_id: "player_1",
            team_id: "team_1",
            official_id: WILDCARD_SCOPE,
          } as never,
        },
        {
          status: "present",
          entity_metadata: {
            fields: [
              { field_name: "organization_id" },
              { field_name: "team_id" },
              { field_name: "player_id" },
            ],
          } as never,
        },
        "player-team-membership",
      ),
    ).toEqual({
      status: "ready",
      filter_state: {
        status: "present",
        filter: {
          organization_id: "org_1",
          player_id: "player_1",
        },
      },
    });

    expect(
      build_entity_authorization_filter(
        {
          status: "present",
          profile: {
            player_id: WILDCARD_SCOPE,
            team_id: "team_1",
            official_id: "official_1",
          } as never,
        },
        {
          status: "present",
          entity_metadata: {
            fields: [{ field_name: "id" }],
          } as never,
        },
        "official",
      ),
    ).toEqual({
      status: "ready",
      filter_state: {
        status: "present",
        filter: {
          organization_id: "org_1",
          id: "official_1",
        },
      },
    });
  });

  it("applies id filters and merges list filters", () => {
    const entities = [{ id: "team_1" }, { id: "team_2" }] as never[];

    expect(apply_id_filter_to_entities(entities, { id: "team_2" })).toEqual([
      entities[1],
    ]);
    expect(
      merge_entity_list_filters(
        { competition_id: "competition_1" },
        { status: "present", filter: {} },
      ),
    ).toEqual({
      competition_id: "competition_1",
    });
    expect(
      merge_entity_list_filters(
        { competition_id: "competition_1" },
        { status: "present", filter: { organization_id: "org_1" } },
      ),
    ).toEqual({
      competition_id: "competition_1",
      organization_id: "org_1",
    });
    expect(
      merge_entity_list_filters(void 0, { status: "missing" }),
    ).toBeUndefined();
  });
});
