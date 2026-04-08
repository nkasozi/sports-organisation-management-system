import { describe, expect, it } from "vitest";

import { HELP_GUIDE_SETUP_STEPS } from "./helpGuideSetupSteps";

describe("helpGuideSetupSteps", () => {
  it("starts onboarding at sport creation and ends with official registration", () => {
    expect(HELP_GUIDE_SETUP_STEPS).toHaveLength(8);
    expect(HELP_GUIDE_SETUP_STEPS.map((step) => step.step_number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(HELP_GUIDE_SETUP_STEPS[0]).toMatchObject({
      title: "Create a Sport",
      link: "/sports/create",
    });
    expect(HELP_GUIDE_SETUP_STEPS[7]).toMatchObject({
      title: "Register Officials",
      link: "/officials",
    });
  });
});
