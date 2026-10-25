import { describe, expect, it } from "vitest";

import {
  describe_created_record,
  describe_deleted_record,
  describe_updated_record,
} from "./AuditChangeDetails";

const GOAL = {
  id: "e1",
  event_type: "goal",
  minute: 14,
  team_side: "away",
  player_name: "Robert Kizza",
  secondary_player_name: "",
};

describe("audit details say what changed, from what to what", () => {
  it("lists the values of a created record, without bookkeeping fields", () => {
    expect(
      describe_created_record({
        id: "t1",
        name: "Lira Rhinos",
        founded_year: 1991,
        is_active: true,
        created_at: "2026-10-25",
        updated_at: "2026-10-25",
        version: 3,
      }),
    ).toEqual([
      { field_name: "Name", old_value: "", new_value: "Lira Rhinos" },
      { field_name: "Founded year", old_value: "", new_value: "1991" },
      { field_name: "Is active", old_value: "", new_value: "Yes" },
    ]);
  });

  it("keeps the values of a deleted record", () => {
    expect(
      describe_deleted_record({ id: "v1", name: "Jinja Hockey Ground" }),
    ).toEqual([
      { field_name: "Name", old_value: "Jinja Hockey Ground", new_value: "" },
    ]);
  });

  it("shows plain field changes from old to new", () => {
    expect(
      describe_updated_record(
        { id: "f1", home_team_score: 0, venue: "Lugogo", updated_at: "a" },
        { id: "f1", home_team_score: 1, venue: "Lugogo", updated_at: "b" },
      ),
    ).toEqual([
      { field_name: "Home team score", old_value: "0", new_value: "1" },
    ]);
  });

  it("describes live game events added, changed and removed", () => {
    const edited = { ...GOAL, minute: 15, player_name: "Victor Mbabazi" };
    const card = {
      id: "e2",
      event_type: "yellow_card",
      minute: 20,
      team_side: "home",
      player_name: "Alex Kibuuka",
      secondary_player_name: "",
    };
    expect(
      describe_updated_record({ game_events: [] }, { game_events: [GOAL] }),
    ).toEqual([
      {
        field_name: "Game events: added",
        old_value: "",
        new_value: "Goal 14' Robert Kizza (away)",
      },
    ]);
    expect(
      describe_updated_record(
        { game_events: [GOAL, card] },
        { game_events: [edited] },
      ),
    ).toEqual([
      {
        field_name: "Game events: changed",
        old_value: "Goal 14' Robert Kizza (away)",
        new_value: "Goal 15' Victor Mbabazi (away)",
      },
      {
        field_name: "Game events: removed",
        old_value: "Yellow Card 20' Alex Kibuuka (home)",
        new_value: "",
      },
    ]);
  });

  it("summarises nested settings instead of printing [object Object]", () => {
    expect(
      describe_updated_record(
        { rule_overrides: { points_config_override: { points_for_win: 3 } } },
        { rule_overrides: { points_config_override: { points_for_win: 2 } } },
      ),
    ).toEqual([
      {
        field_name: "Rule overrides",
        old_value: "Points config override: Points for win: 3",
        new_value: "Points config override: Points for win: 2",
      },
    ]);
  });

  it("lists plain arrays readably", () => {
    expect(
      describe_updated_record(
        { team_ids: ["a", "b"] },
        { team_ids: ["a", "b", "c"] },
      ),
    ).toEqual([
      { field_name: "Team ids", old_value: "a, b", new_value: "a, b, c" },
    ]);
  });

  it("never stores ID numbers or secrets in the audit trail", () => {
    expect(
      describe_updated_record(
        { identifier_value: "CM123", notes: "old" },
        { identifier_value: "CM456", notes: "old" },
      ),
    ).toEqual([
      {
        field_name: "Identifier value",
        old_value: "•••• (hidden)",
        new_value: "•••• (hidden)",
      },
    ]);
  });

  it("names a reference field after what it points to, not its id", () => {
    expect(
      describe_updated_record(
        { organization_id: "Old Association" },
        { organization_id: "Uganda Hockey Association" },
      ),
    ).toEqual([
      {
        field_name: "Organization",
        old_value: "Old Association",
        new_value: "Uganda Hockey Association",
      },
    ]);
  });

  it("summarises embedded images and long values instead of dumping them", () => {
    const [image, notes] = describe_created_record({
      image_url: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
      notes: "x".repeat(300),
    });

    expect(image.new_value).toBe("(image)");
    expect(notes.new_value.length).toBeLessThanOrEqual(121);
    expect(notes.new_value.endsWith("…")).toBe(true);
  });
});
