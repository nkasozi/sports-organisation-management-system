import { describe, expect, it } from "vitest";

import { HELP_GUIDE_COMPETITION_STEPS } from "./helpGuideCompetitionSteps";
import { HELP_GUIDE_LIVE_STEPS } from "./helpGuideLiveSteps";
import { HELP_GUIDE_SETUP_STEPS } from "./helpGuideSetupSteps";
import { HELP_GUIDE_STEPS } from "./helpPageGuideSteps";

describe("helpPageGuideSteps", () => {
  it("concatenates setup, competition, and live steps into a single ordered guide", () => {
    expect(HELP_GUIDE_STEPS).toHaveLength(
      HELP_GUIDE_SETUP_STEPS.length +
        HELP_GUIDE_COMPETITION_STEPS.length +
        HELP_GUIDE_LIVE_STEPS.length,
    );
    expect(HELP_GUIDE_STEPS.map((step) => step.step_number)).toEqual(
      Array.from({ length: 23 }, (_, index) => index + 1),
    );
    expect(HELP_GUIDE_STEPS[0]).toEqual(HELP_GUIDE_SETUP_STEPS[0]);
    expect(HELP_GUIDE_STEPS[22]).toEqual(HELP_GUIDE_LIVE_STEPS[6]);
  });
});
