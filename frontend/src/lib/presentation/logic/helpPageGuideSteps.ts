import { HELP_GUIDE_COMPETITION_STEPS } from "./helpGuideCompetitionSteps";
import { HELP_GUIDE_LIVE_STEPS } from "./helpGuideLiveSteps";
import { HELP_GUIDE_SETUP_STEPS } from "./helpGuideSetupSteps";
import type { HelpGuideStep } from "./helpGuideStepTypes";

export const HELP_GUIDE_STEPS: HelpGuideStep[] = [
  ...HELP_GUIDE_SETUP_STEPS,
  ...HELP_GUIDE_COMPETITION_STEPS,
  ...HELP_GUIDE_LIVE_STEPS,
];
