import { describe, expect, it } from "vitest";

import {
  PROFILE_MANAGEMENT_ACTIONS,
  PROFILE_MANAGEMENT_PREVIEW_PATH_SEPARATOR,
  PROFILE_MANAGEMENT_STATUS_CLASS_BY_VALUE,
  PROFILE_MANAGEMENT_VISIBILITY_CLASS_BY_VALUE,
} from "./profileManagementPageConstants";

describe("profileManagementPageConstants", () => {
  it("defines stable CRUD action names and preview separator values", () => {
    expect(PROFILE_MANAGEMENT_ACTIONS).toEqual({
      READ: "read",
      CREATE: "create",
      UPDATE: "update",
      DELETE: "delete",
    });
    expect(PROFILE_MANAGEMENT_PREVIEW_PATH_SEPARATOR).toBe("/");
  });

  it("maps visibility and status values to badge classes", () => {
    expect(PROFILE_MANAGEMENT_VISIBILITY_CLASS_BY_VALUE.public).toContain(
      "bg-green-100",
    );
    expect(PROFILE_MANAGEMENT_VISIBILITY_CLASS_BY_VALUE.private).toContain(
      "bg-accent-100",
    );
    expect(PROFILE_MANAGEMENT_STATUS_CLASS_BY_VALUE.active).toContain(
      "bg-green-100",
    );
    expect(PROFILE_MANAGEMENT_STATUS_CLASS_BY_VALUE.inactive).toContain(
      "bg-accent-100",
    );
  });
});
