import { describe, expect, it } from "vitest";

import {
  HELP_FAQ_ITEMS,
  HELP_OVERVIEW_CARDS,
  HELP_SUPPORT_EMAIL,
} from "./helpPageContent";
import { HELP_GUIDE_STEPS } from "./helpPageGuideSteps";

describe("HELP_GUIDE_STEPS", () => {
  it("uses sequential step numbers", () => {
    expect(
      HELP_GUIDE_STEPS.map((current_step) => current_step.step_number),
    ).toEqual(HELP_GUIDE_STEPS.map((_, index) => index + 1));
  });

  it("provides a valid link and at least one detail for each step", () => {
    for (const current_step of HELP_GUIDE_STEPS) {
      expect(current_step.link.startsWith("/")).toBe(true);
      expect(current_step.details.length).toBeGreaterThan(0);
      expect(current_step.title.length).toBeGreaterThan(0);
      expect(current_step.description.length).toBeGreaterThan(0);
    }
  });
});

describe("help page content", () => {
  it("provides populated faq entries", () => {
    expect(HELP_FAQ_ITEMS.length).toBeGreaterThan(0);

    for (const current_item of HELP_FAQ_ITEMS) {
      expect(current_item.question.length).toBeGreaterThan(0);
      expect(current_item.answer.length).toBeGreaterThan(0);
    }
  });

  it("provides overview cards with destinations", () => {
    expect(HELP_OVERVIEW_CARDS.length).toBeGreaterThan(0);

    for (const current_card of HELP_OVERVIEW_CARDS) {
      expect(current_card.title.length).toBeGreaterThan(0);
      expect(current_card.description.length).toBeGreaterThan(0);
      expect(
        current_card.href.startsWith("/") || current_card.href.startsWith("#"),
      ).toBe(true);
    }
  });

  it("uses a support mailto destination", () => {
    expect(HELP_SUPPORT_EMAIL.startsWith("mailto:")).toBe(true);
  });
});
