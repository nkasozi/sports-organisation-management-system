import { get } from "svelte/store";
import { beforeEach, describe, expect, it } from "vitest";

import {
  announce_saved_record,
  concept_saved_notice,
  describe_saved_record,
} from "./conceptSavedNotice";

describe("concept saved notice", () => {
  beforeEach(() => {
    concept_saved_notice.clear();
  });

  it("remembers what was just created and where to show the next steps", () => {
    expect(announce_saved_record("Team", "Lira Rhinos", "/teams")).toBe(true);

    expect(get(concept_saved_notice)).toEqual({
      status: "saved",
      concept_id: "teams",
      record_label: "Lira Rhinos",
      target_path: "/teams",
    });
  });

  it("ignores records that are not part of the guide", () => {
    expect(announce_saved_record("GameEventType", "Goal", "/event-types")).toBe(
      false,
    );
    expect(get(concept_saved_notice)).toEqual({ status: "none" });
  });

  it("forgets the notice once the user moves to another page", () => {
    announce_saved_record("Venue", "Lugogo", "/venues");

    concept_saved_notice.leave_path("/venues");
    expect(get(concept_saved_notice).status).toBe("saved");

    concept_saved_notice.leave_path("/teams");
    expect(get(concept_saved_notice)).toEqual({ status: "none" });
  });

  it("names people by their full name and everything else by its name", () => {
    expect(
      describe_saved_record({ first_name: "Ada", last_name: "Okello" }),
    ).toBe("Ada Okello");
    expect(describe_saved_record({ name: "Lugogo" })).toBe("Lugogo");
    expect(describe_saved_record({ id: "x" })).toBe("");
  });
});
