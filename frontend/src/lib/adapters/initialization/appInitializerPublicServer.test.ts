import { describe, expect, it } from "vitest";

import { determine_seeding_strategy } from "./appInitializer";
import {
  PUBLIC_DATA_SOURCE,
  SEEDING_COMPLETION_STATE,
} from "./initializationConstants";

describe("signed-out visitor on a site with a server", () => {
  it.each([
    ["/live-games", SEEDING_COMPLETION_STATE.NOT_COMPLETE],
    ["/competition-results", SEEDING_COMPLETION_STATE.COMPLETE],
    ["/calendar", SEEDING_COMPLETION_STATE.UNREADABLE],
  ])("reads real public data from the server on %s", (path, state) => {
    expect(
      determine_seeding_strategy(
        false,
        path,
        state,
        false,
        PUBLIC_DATA_SOURCE.SERVER,
      ),
    ).toBe("public_server_data");
  });

  it("still skips seeding once the visitor signs in", () => {
    expect(
      determine_seeding_strategy(
        true,
        "/teams",
        SEEDING_COMPLETION_STATE.NOT_COMPLETE,
        false,
        PUBLIC_DATA_SOURCE.SERVER,
      ),
    ).toBe("skip_seeding");
  });
});
