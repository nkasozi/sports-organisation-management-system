import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { emit_entity_changed } from "../events/entityChangeEvents";
import {
  clear_user_context,
  EventBus,
  set_user_context,
} from "../events/EventBus";
import {
  initialize_audit_event_handlers,
  reset_audit_event_handlers,
} from "./AuditEventHandler";

const mock_create_audit_log = vi.fn().mockResolvedValue({ success: true });
const TEAMS: Record<string, { id: string; name: string }> = {
  t_home: { id: "t_home", name: "Weatherhead Hockey Club" },
  t_away: { id: "t_away", name: "Kampala Hockey Club" },
};

vi.mock("../container", () => ({
  get_repository_container: vi.fn(() => ({
    audit_log_repository: { create: mock_create_audit_log },
    team_repository: {
      find_by_id: vi.fn(async (id: string) =>
        TEAMS[id]
          ? { success: true, data: TEAMS[id] }
          : { success: false, error: "missing" },
      ),
    },
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  EventBus.clear_all_handlers();
  EventBus.enable();
  clear_user_context();
  reset_audit_event_handlers();
});

afterEach(() => {
  reset_audit_event_handlers();
});

async function recorded(): Promise<Record<string, unknown>> {
  await vi.waitFor(() => expect(mock_create_audit_log).toHaveBeenCalled());
  return mock_create_audit_log.mock.calls[0][0];
}

describe("initialize_audit_event_handlers", () => {
  it("returns true once and false after that", () => {
    expect(initialize_audit_event_handlers()).toBe(true);
    expect(initialize_audit_event_handlers()).toBe(false);
  });

  it("does not double-subscribe when called twice", async () => {
    initialize_audit_event_handlers();
    initialize_audit_event_handlers();
    emit_entity_changed({
      entity_type: "team",
      entity_id: "t1",
      action: "create",
      before: {},
      after: { id: "t1", name: "City FC" },
    });
    await recorded();
    expect(mock_create_audit_log).toHaveBeenCalledTimes(1);
  });

  it("can be initialised again after a reset", () => {
    initialize_audit_event_handlers();
    reset_audit_event_handlers();
    expect(initialize_audit_event_handlers()).toBe(true);
  });
});

describe("audit entries describe each change", () => {
  beforeEach(() => initialize_audit_event_handlers());

  it("records what was created, by whom", async () => {
    set_user_context({
      user_id: "u1",
      user_email: "admin@example.com",
      user_display_name: "Admin",
      organization_id: "org1",
    } as never);
    emit_entity_changed({
      entity_type: "team",
      entity_id: "t1",
      action: "create",
      before: {},
      after: { id: "t1", name: "City FC", founded_year: 1990 },
    });
    expect(await recorded()).toMatchObject({
      action: "create",
      entity_type: "team",
      entity_display_name: "City FC",
      user_display_name: "Admin",
      organization_id: "org1",
      changes: [
        { field_name: "Name", old_value: "", new_value: "City FC" },
        { field_name: "Founded year", old_value: "", new_value: "1990" },
      ],
    });
  });

  it("records what was deleted, crediting an anonymous demo user", async () => {
    emit_entity_changed({
      entity_type: "venue",
      entity_id: "v1",
      action: "delete",
      before: { id: "v1", name: "Jinja Hockey Ground" },
      after: {},
    });
    expect(await recorded()).toMatchObject({
      action: "delete",
      entity_display_name: "Jinja Hockey Ground",
      user_display_name: "Anonymous user",
      user_id: "anonymous",
      changes: [
        { field_name: "Name", old_value: "Jinja Hockey Ground", new_value: "" },
      ],
    });
  });

  it("names a fixture after its teams and shows live game events", async () => {
    const fixture = {
      id: "f1",
      home_team_id: "t_home",
      away_team_id: "t_away",
    };
    emit_entity_changed({
      entity_type: "fixture",
      entity_id: "f1",
      action: "update",
      before: { ...fixture, away_team_score: 0, game_events: [] },
      after: {
        ...fixture,
        away_team_score: 1,
        game_events: [
          {
            id: "e1",
            event_type: "goal",
            minute: 14,
            team_side: "away",
            player_name: "Robert Kizza",
          },
        ],
      },
    });
    expect(await recorded()).toMatchObject({
      action: "update",
      entity_display_name: "Weatherhead Hockey Club vs Kampala Hockey Club",
      changes: [
        { field_name: "Away team score", old_value: "0", new_value: "1" },
        {
          field_name: "Game events: added",
          old_value: "",
          new_value: "Goal 14' Robert Kizza (away)",
        },
      ],
    });
  });

  it("shows team names instead of ids when a reference changes", async () => {
    emit_entity_changed({
      entity_type: "playerteammembership",
      entity_id: "m1",
      action: "update",
      before: { id: "m1", team_id: "t_home" },
      after: { id: "m1", team_id: "t_away" },
    });
    expect((await recorded()).changes).toEqual([
      {
        field_name: "Team",
        old_value: "Weatherhead Hockey Club",
        new_value: "Kampala Hockey Club",
      },
    ]);
  });

  it("skips updates that changed nothing visible", async () => {
    emit_entity_changed({
      entity_type: "team",
      entity_id: "t1",
      action: "update",
      before: { id: "t1", name: "City FC", updated_at: "a" },
      after: { id: "t1", name: "City FC", updated_at: "b" },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mock_create_audit_log).not.toHaveBeenCalled();
  });
});
