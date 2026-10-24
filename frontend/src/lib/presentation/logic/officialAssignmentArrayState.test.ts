import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  build_scoped_role_options,
  compute_available_officials,
  load_official_role_records,
  reload_official_options,
} from "./officialAssignmentArrayState";

const ROLE_RECORDS = [
  { id: "role-lead", name: "Lead Referee", code: "REFEREE", sport_id: "wcb" },
  { id: "role-umpire", name: "Umpire", code: "UMPIRE", sport_id: "wcb" },
  { id: "role-referee", name: "Referee", code: "REF", sport_id: "" },
  { id: "role-ar", name: "Assistant Referee", code: "AR", sport_id: "" },
];

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

  it("loads role records and returns no roles when the lookup fails", async () => {
    expect(
      await load_official_role_records({
        organization_id: "",
        role_use_cases: {
          list: async () => ({
            success: true,
            data: { items: [ROLE_RECORDS[0]] },
          }),
        },
      }),
    ).toEqual([ROLE_RECORDS[0]]);

    expect(
      await load_official_role_records({
        organization_id: "organization-1",
        role_use_cases: { list: async () => ({ success: false }) },
      }),
    ).toEqual([]);
  });

  it("only offers the roles of the fixture's sport", () => {
    expect(
      build_scoped_role_options(
        ROLE_RECORDS,
        create_some_option({
          sport_id: "wcb",
          requirements: [
            { role_id: "referee", role_name: "Lead Referee" },
            { role_id: "umpire", role_name: "Umpire" },
          ],
        }),
      ),
    ).toEqual([
      { value: "role-lead", label: "Lead Referee" },
      { value: "role-umpire", label: "Umpire" },
    ]);
  });

  it("offers every role when no fixture has been chosen yet", () => {
    expect(
      build_scoped_role_options(ROLE_RECORDS, create_none_option()),
    ).toHaveLength(4);
  });

  it("filters out already assigned officials", () => {
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
