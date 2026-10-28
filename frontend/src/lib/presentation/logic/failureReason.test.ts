import { describe, expect, it } from "vitest";

import { with_failure_reason } from "./failureReason";

describe("with_failure_reason", () => {
  it("adds the real cause to a friendly message", () => {
    expect(
      with_failure_reason(
        "We couldn't load your dashboard.",
        "Team scope is invalid",
      ),
    ).toBe("We couldn't load your dashboard. Reason: Team scope is invalid");
  });

  it("keeps the friendly message alone when there is no cause to show", () => {
    expect(with_failure_reason("We couldn't load your dashboard.", "  ")).toBe(
      "We couldn't load your dashboard.",
    );
  });
});
