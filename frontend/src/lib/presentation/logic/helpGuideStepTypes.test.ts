import { describe, expect, it } from "vitest";

import { create_help_guide_step } from "./helpGuideStepTypes";

describe("helpGuideStepTypes", () => {
  it("builds a guide step from the provided values", () => {
    expect(
      create_help_guide_step(
        3,
        "Create Teams",
        "Register competition teams.",
        "/teams",
        ["Open Teams", "Add Team"],
      ),
    ).toEqual({
      step_number: 3,
      title: "Create Teams",
      description: "Register competition teams.",
      link: "/teams",
      details: ["Open Teams", "Add Team"],
    });
  });
});
