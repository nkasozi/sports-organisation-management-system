import { describe, expect, it, vi } from "vitest";

import { suggest_fixture_setup_details } from "./dynamicEntityFormFakeDataFixtureSetup";

const { auto_populate_mock } = vi.hoisted(() => ({
  auto_populate_mock: vi.fn(),
}));

vi.mock("./fixtureDetailsSetupAutoPopulate", () => ({
  load_fixture_details_setup_auto_populated_data: auto_populate_mock,
}));

const load_dependencies = (): never => ({}) as never;

describe("fake fill on fixture details setup uses the real setup suggestions", () => {
  it("fills jerseys and officials for the chosen fixture, keeping locked fields", async () => {
    auto_populate_mock.mockResolvedValue({
      fixture_id: "f1",
      home_team_jersey_id: "j_home",
      assigned_officials: [{ official_id: "o1", role_id: "r1" }],
    });
    const suggestions = await suggest_fixture_setup_details(
      {
        entity_type: "FixtureDetailsSetup",
        form_data: { fixture_id: "f1" },
        locked_field_names: new Set(["home_team_jersey_id"]),
      },
      load_dependencies,
    );
    expect(auto_populate_mock).toHaveBeenCalledWith("f1", {});
    expect(suggestions).toEqual({
      fixture_id: "f1",
      assigned_officials: [{ official_id: "o1", role_id: "r1" }],
    });
  });

  it("suggests nothing for other forms or before a fixture is chosen", async () => {
    auto_populate_mock.mockClear();
    expect(
      await suggest_fixture_setup_details(
        { entity_type: "team", form_data: {}, locked_field_names: new Set() },
        load_dependencies,
      ),
    ).toEqual({});
    expect(
      await suggest_fixture_setup_details(
        {
          entity_type: "fixturedetailssetup",
          form_data: { fixture_id: "" },
          locked_field_names: new Set(),
        },
        load_dependencies,
      ),
    ).toEqual({});
    expect(auto_populate_mock).not.toHaveBeenCalled();
  });
});
