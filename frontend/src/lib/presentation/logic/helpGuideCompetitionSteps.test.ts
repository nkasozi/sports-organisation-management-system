import { describe, expect, it } from "vitest";

import { HELP_GUIDE_COMPETITION_STEPS } from "./helpGuideCompetitionSteps";

describe("helpGuideCompetitionSteps", () => {
  it("covers the competition setup journey from official roles to fixtures", () => {
    expect(HELP_GUIDE_COMPETITION_STEPS).toHaveLength(8);
    expect(
      HELP_GUIDE_COMPETITION_STEPS.map((step) => step.step_number),
    ).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
    expect(HELP_GUIDE_COMPETITION_STEPS[0]).toMatchObject({
      title: "Configure Official Roles",
      link: "/official-roles",
    });
    expect(HELP_GUIDE_COMPETITION_STEPS[7]).toMatchObject({
      title: "Create Fixtures",
      link: "/fixtures/create",
    });
  });
});
