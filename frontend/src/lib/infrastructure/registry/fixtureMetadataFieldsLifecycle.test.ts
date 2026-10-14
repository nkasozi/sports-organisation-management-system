import { describe, expect, it } from "vitest";

import { FIXTURE_STATUS } from "../../core/entities/StatusConstants";
import {
  FIXTURE_AWAY_TEAM_SCORE_FIELD,
  FIXTURE_HOME_TEAM_SCORE_FIELD,
  FIXTURE_STATUS_FIELD,
} from "./fixtureMetadataFields";

describe("fixture form fields follow the game lifecycle", () => {
  it("offers exactly the fixture statuses the lifecycle knows", () => {
    expect(FIXTURE_STATUS_FIELD.enum_values).toEqual(
      Object.values(FIXTURE_STATUS),
    );
    expect(FIXTURE_STATUS_FIELD.enum_values).not.toContain("paused");
  });

  it("shows the status but does not let the generic form change it", () => {
    expect(FIXTURE_STATUS_FIELD.is_read_only).toBe(true);
  });

  it.each([FIXTURE_HOME_TEAM_SCORE_FIELD, FIXTURE_AWAY_TEAM_SCORE_FIELD])(
    "keeps the $field_name read only",
    (field) => {
      expect(field.is_read_only).toBe(true);
    },
  );
});
