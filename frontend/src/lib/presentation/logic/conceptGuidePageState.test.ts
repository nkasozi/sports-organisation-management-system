import { describe, expect, it } from "vitest";

import {
  build_guide_route_checker,
  choose_guide_organization_id,
  order_guide_competitions,
  to_guide_options,
} from "./conceptGuidePageState";

describe("concept guide page state", () => {
  const organizations = [
    { id: "org_a", name: "Netball League" },
    { id: "org_b", name: "Hockey Association" },
  ];

  it("shows the user's own organization when they belong to one", () => {
    expect(choose_guide_organization_id(organizations, "org_b")).toBe("org_b");
  });

  it("falls back to the first organization for admins and visitors", () => {
    expect(choose_guide_organization_id(organizations, "*")).toBe("org_a");
    expect(choose_guide_organization_id([], "org_b")).toBe("");
  });

  it("only offers links to pages the current role can open", () => {
    const can_open = build_guide_route_checker([
      {
        group_name: "Home",
        items: [{ name: "Teams", href: "/teams", icon: "" }],
      },
    ]);

    expect(can_open("/teams")).toBe(true);
    expect(can_open("/competition-results")).toBe(true);
    expect(can_open("/officials")).toBe(false);
  });

  it("turns records into select options sorted by name", () => {
    expect(to_guide_options(organizations)).toEqual([
      { value: "org_b", label: "Hockey Association" },
      { value: "org_a", label: "Netball League" },
    ]);
  });

  it("puts competitions that are running first, finished ones last", () => {
    const today = new Date(2026, 9, 25);
    const ordered = order_guide_competitions(
      [
        {
          id: "a",
          name: "Easter Cup",
          start_date: "2026-04-03",
          end_date: "2026-04-06",
        },
        {
          id: "b",
          name: "University Cup",
          start_date: "2026-11-25",
          end_date: "2027-01-25",
        },
        {
          id: "c",
          name: "National League",
          start_date: "2026-02-01",
          end_date: "2026-11-30",
        },
      ],
      today,
    );

    expect(ordered.map((competition) => competition.name)).toEqual([
      "National League",
      "University Cup",
      "Easter Cup",
    ]);
  });
});
