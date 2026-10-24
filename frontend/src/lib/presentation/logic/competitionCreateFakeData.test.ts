import { describe, expect, it } from "vitest";

import { create_empty_competition_input } from "$lib/core/entities/Competition";
import {
  create_none_option,
  create_some_option,
  OptionStatus,
} from "$lib/core/types/Option";

import {
  build_competition_create_fake_fields,
  pick_fake_option_for_empty_choice,
} from "./competitionCreateFakeData";

describe("competition create fake data", () => {
  it("fills the competition details with a named, dated competition", () => {
    const filled = build_competition_create_fake_fields(
      create_empty_competition_input(),
    );

    expect(filled.name).toMatch(/\d{4}$/);
    expect(filled.description.length).toBeGreaterThan(20);
    expect(filled.registration_deadline < filled.start_date).toBe(true);
    expect(filled.start_date < filled.end_date).toBe(true);
  });

  it("keeps the organisation, format and teams already chosen", () => {
    const form_data = {
      ...create_empty_competition_input(),
      organization_id: "org_1",
      competition_format_id: "format_1",
      team_ids: ["team_1"],
    };

    const filled = build_competition_create_fake_fields(form_data);

    expect(filled.organization_id).toBe("org_1");
    expect(filled.competition_format_id).toBe("format_1");
    expect(filled.team_ids).toEqual(["team_1"]);
  });

  it("picks an option only when the choice is still empty", () => {
    const options = [
      { value: "org_1", label: "One" },
      { value: "org_2", label: "Two" },
    ];

    const picked = pick_fake_option_for_empty_choice("", options);
    expect(picked.status).toBe(OptionStatus.SOME);
    expect(pick_fake_option_for_empty_choice("org_1", options).status).toBe(
      OptionStatus.NONE,
    );
    expect(pick_fake_option_for_empty_choice("", []).status).toBe(
      OptionStatus.NONE,
    );
  });
});

describe("fill_competition_create_fake_data", () => {
  it("fills details and chooses an organisation and format through the normal change handlers", async () => {
    let form_data = create_empty_competition_input();
    const chosen: string[] = [];
    const { fill_competition_create_fake_data } =
      await import("./competitionCreateFakeData");

    await fill_competition_create_fake_data({
      get_form_data: () => form_data,
      set_form_data: (value) => (form_data = value),
      get_sport_name: () => create_some_option("Hockey"),
      get_organization_options: () => [{ value: "org_1", label: "One" }],
      get_competition_format_options: () => [
        { value: "format_1", label: "Cup" },
      ],
      change_organization: async (event) => {
        chosen.push(`org:${event.detail.value}`);
        form_data = { ...form_data, organization_id: event.detail.value };
      },
      change_format: (event) => {
        chosen.push(`format:${event.detail.value}`);
      },
    });

    expect(form_data.name).toContain("Hockey");
    expect(chosen).toEqual(["org:org_1", "format:format_1"]);
  });

  it("keeps an organisation that is already set", async () => {
    const chosen: string[] = [];
    const { fill_competition_create_fake_data } =
      await import("./competitionCreateFakeData");
    let form_data = {
      ...create_empty_competition_input(),
      organization_id: "org_mine",
    };

    await fill_competition_create_fake_data({
      get_form_data: () => form_data,
      set_form_data: (value) => (form_data = value),
      get_organization_options: () => [{ value: "org_1", label: "One" }],
      get_competition_format_options: () => [],
      get_sport_name: () => create_none_option(),
      change_organization: async (event) => {
        chosen.push(event.detail.value);
      },
      change_format: () => {},
    });

    expect(chosen).toEqual([]);
    expect(form_data.organization_id).toBe("org_mine");
  });
});
