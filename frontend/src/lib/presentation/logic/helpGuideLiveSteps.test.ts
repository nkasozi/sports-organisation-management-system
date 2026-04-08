import { describe, expect, it } from "vitest";

import { HELP_GUIDE_LIVE_STEPS } from "./helpGuideLiveSteps";

describe("helpGuideLiveSteps", () => {
  it("defines the seven live-operations guide steps in order", () => {
    expect(HELP_GUIDE_LIVE_STEPS).toHaveLength(7);
    expect(HELP_GUIDE_LIVE_STEPS.map((step) => step.step_number)).toEqual([
      17, 18, 19, 20, 21, 22, 23,
    ]);
    expect(HELP_GUIDE_LIVE_STEPS[0]).toMatchObject({
      title: "Assign Officials to Fixtures",
      link: "/fixtures",
    });
    expect(HELP_GUIDE_LIVE_STEPS[6]).toMatchObject({
      title: "View Competition Results",
      link: "/competition-results",
    });
    expect(
      HELP_GUIDE_LIVE_STEPS.every((step) => step.details.length === 7),
    ).toBe(true);
  });
});
