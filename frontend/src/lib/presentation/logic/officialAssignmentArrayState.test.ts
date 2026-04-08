import { describe, expect, it } from "vitest";

import {
  compute_available_officials,
  load_assignment_options,
  reload_official_options,
} from "./officialAssignmentArrayState";

describe("officialAssignmentArrayState", () => {
  it("reloads officials into select options and falls back to an empty list on failure", async () => {
    expect(
      await reload_official_options({
        organization_id: "organization-1",
        official_use_cases: {
          list: async () => ({
            success: true,
            data: {
              items: [
                { id: "official-1", first_name: "Ada", last_name: "Stone" },
              ],
            },
          }),
        },
      }),
    ).toEqual([{ value: "official-1", label: "Ada Stone" }]);

    expect(
      await reload_official_options({
        organization_id: "organization-1",
        official_use_cases: { list: async () => ({ success: false }) },
      }),
    ).toEqual([]);
  });

  it("loads official and role options together and filters out already assigned officials", async () => {
    expect(
      await load_assignment_options({
        organization_id: "",
        official_use_cases: {
          list: async () => ({
            success: true,
            data: {
              items: [
                { id: "official-1", first_name: "Ada", last_name: "Stone" },
              ],
            },
          }),
        },
        role_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [{ id: "role-1", name: "Referee" }] },
          }),
        },
      }),
    ).toEqual({
      official_options: [{ value: "official-1", label: "Ada Stone" }],
      role_options: [{ value: "role-1", label: "Referee" }],
    });

    expect(
      compute_available_officials(
        [
          { value: "official-1", label: "Ada Stone" },
          { value: "official-2", label: "Ben Flint" },
        ],
        [{ official_id: "official-1" }, { official_id: "official-2" }] as never,
        1,
      ),
    ).toEqual([{ value: "official-2", label: "Ben Flint" }]);
  });
});
