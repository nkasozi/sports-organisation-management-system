import { describe, expect, it, vi } from "vitest";

import { auto_create_fixture_details_setup } from "./fixtureDetailsAutoSetup";
import {
  create_auto_setup_dependencies,
  makeFixture,
} from "./fixtureDetailsAutoSetup.test_support";

function page_of<T>(items: T[]): object {
  return {
    success: true,
    data: {
      items,
      total_count: items.length,
      page_number: 1,
      page_size: 100,
      total_pages: 1,
    },
  };
}

describe("auto-assigning officials from the sport's requirements", () => {
  it("assigns two umpires and a scorer for netball", async () => {
    const dependencies = create_auto_setup_dependencies();
    dependencies.official_use_cases.list = vi
      .fn()
      .mockResolvedValue(page_of([{ id: "o1" }, { id: "o2" }, { id: "o3" }]));
    dependencies.game_official_role_use_cases.list = vi.fn().mockResolvedValue(
      page_of([
        { id: "role_scorer", name: "Scorer", code: "SCORER" },
        { id: "role_umpire", name: "Umpire", code: "UMPIRE" },
      ]),
    );

    const result = await auto_create_fixture_details_setup(
      makeFixture(),
      dependencies,
      [
        {
          role_id: "umpire",
          role_name: "Umpire",
          minimum_count: 2,
          is_mandatory: true,
        },
        {
          role_id: "scorer",
          role_name: "Scorer",
          minimum_count: 1,
          is_mandatory: true,
        },
      ],
    );

    expect(result.success).toBe(true);
    expect(
      vi.mocked(dependencies.fixture_details_setup_use_cases.create).mock
        .calls[0][0].assigned_officials,
    ).toEqual([
      { official_id: "o1", role_id: "role_umpire" },
      { official_id: "o2", role_id: "role_umpire" },
      { official_id: "o3", role_id: "role_scorer" },
    ]);
    expect(dependencies.game_official_role_use_cases.list).toHaveBeenCalledWith(
      { organization_id: "org-1" },
      expect.anything(),
    );
  });
});
