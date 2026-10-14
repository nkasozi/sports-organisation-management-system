import { describe, expect, it } from "vitest";

import {
  collect_hidden_conflict_ids,
  normalize_remote_data_status,
} from "./syncConflictVisibility";

describe("normalize_remote_data_status", () => {
  it("recognises a hidden server copy", () => {
    expect(normalize_remote_data_status("hidden")).toBe("hidden");
  });

  it("treats visible and older servers without a status as visible", () => {
    expect(normalize_remote_data_status("visible")).toBe("visible");
    expect(normalize_remote_data_status(void 0)).toBe("visible");
  });
});

describe("collect_hidden_conflict_ids", () => {
  it("collects only conflicts whose server copy is hidden", () => {
    expect([
      ...collect_hidden_conflict_ids([
        { local_id: "a", remote_data_status: "hidden" },
        { local_id: "b", remote_data_status: "visible" },
        { local_id: "c" },
      ]),
    ]).toEqual(["a"]);
  });

  it("returns nothing when the response has no conflict list", () => {
    expect(collect_hidden_conflict_ids(void 0).size).toBe(0);
  });
});
