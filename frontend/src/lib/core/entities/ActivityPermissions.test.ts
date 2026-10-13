import { describe, expect, it } from "vitest";

import { can_delete_activity, can_edit_activity } from "./Activity";
import { create_activity } from "./ActivityTestBuilders.test_support";

describe("Activity Entity", () => {
  describe("can_edit_activity", () => {
    it("allows editing manual activities", () => {
      const activity = create_activity("manual");
      expect(can_edit_activity(activity)).toBe(true);
    });

    it("prevents editing competition-sourced activities", () => {
      const activity = create_activity("competition");
      expect(can_edit_activity(activity)).toBe(false);
    });

    it("prevents editing fixture-sourced activities", () => {
      const activity = create_activity("fixture");
      expect(can_edit_activity(activity)).toBe(false);
    });
  });
  describe("can_delete_activity", () => {
    it("allows deleting manual activities", () => {
      const activity = create_activity("manual");
      expect(can_delete_activity(activity)).toBe(true);
    });

    it("prevents deleting competition-sourced activities", () => {
      const activity = create_activity("competition");
      expect(can_delete_activity(activity)).toBe(false);
    });

    it("prevents deleting fixture-sourced activities", () => {
      const activity = create_activity("fixture");
      expect(can_delete_activity(activity)).toBe(false);
    });
  });
});
