import { beforeEach, describe, expect, it, vi } from "vitest";

import { InBrowserFixtureLineupRepository } from "./InBrowserFixtureLineupRepository";
import { get_game_event_log_repository } from "./InBrowserGameEventLogRepository";
import { get_live_game_log_repository } from "./InBrowserLiveGameLogRepository";
import {
  get_fake_table,
  reset_fake_database,
  seed_fake_table,
} from "./InBrowserRepositoryFakeDatabase.test_support";
import { ids_of, row } from "./InBrowserRepositoryFilterCases.test_support";

vi.mock("./database", async () => {
  const support =
    await import("./InBrowserRepositoryFakeDatabase.test_support");
  return { get_database: () => support.fake_database };
});

describe("InBrowser game day repositories", () => {
  beforeEach(() => {
    reset_fake_database();
  });

  it("reads fixture lineups by fixture and team with page options", async () => {
    seed_fake_table("fixture_lineups", [
      row("l1", { fixture_id: "f1", team_id: "t1" }),
      row("l2", { fixture_id: "f1", team_id: "t2" }),
    ]);
    const repository = new InBrowserFixtureLineupRepository();

    const page = await repository.find_by_fixture("f1" as never, {
      page: 2,
      page_size: 1,
    });
    const team_page = await repository.find_by_fixture_and_team(
      "f1" as never,
      "t2" as never,
    );
    const one = await repository.get_lineup_for_team_in_fixture(
      "f1" as never,
      "t1" as never,
    );

    expect(
      ids_of(await repository.get_lineups_for_fixture("f1" as never)),
    ).toEqual(["l1", "l2"]);
    expect(ids_of(page)).toEqual(["l2"]);
    expect(page.success && page.data.page_size).toBe(1);
    expect(ids_of(team_page)).toEqual(["l2"]);
    expect(one.success && one.data.id).toBe("l1");
    expect(
      await repository.get_lineup_for_team_in_fixture(
        "f9" as never,
        "t1" as never,
      ),
    ).toEqual({
      success: false,
      error: "No lineup found for this team in this fixture",
    });
  });

  it("filters game events by live game, fixture, player, scoring and cards", async () => {
    seed_fake_table("game_event_logs", [
      row("e1", {
        live_game_log_id: "g",
        fixture_id: "f",
        player_id: "p",
        event_type: "goal",
        voided: false,
      }),
      row("e2", {
        live_game_log_id: "g",
        fixture_id: "f",
        player_id: "q",
        event_type: "yellow_card",
        voided: false,
      }),
      row("e3", {
        live_game_log_id: "g",
        fixture_id: "f",
        player_id: "p",
        event_type: "goal",
        voided: true,
      }),
    ]);
    const repository = get_game_event_log_repository();

    expect(
      ids_of(await repository.get_events_for_live_game("g" as never)),
    ).toEqual(["e1", "e2"]);
    expect(
      ids_of(
        await repository.get_events_for_fixture("f" as never, {
          page: 1,
          page_size: 1,
        }),
      ),
    ).toEqual(["e1"]);
    expect(
      ids_of(await repository.get_events_for_player("p" as never)),
    ).toEqual(["e1"]);
    expect(
      ids_of(await repository.get_scoring_events_for_live_game("g" as never)),
    ).toEqual(["e1"]);
    expect(
      ids_of(await repository.get_card_events_for_live_game("g" as never)),
    ).toEqual(["e2"]);
  });

  it("voids game events with reviewer details", async () => {
    seed_fake_table("game_event_logs", [row("e1", { voided: false })]);

    const result = await get_game_event_log_repository().void_event(
      "e1" as never,
      "mistake",
      "u1" as never,
    );

    expect(result.success && result.data).toMatchObject({
      voided: true,
      voided_reason: "mistake",
      reviewed: true,
      reviewed_by_user_id: "u1",
    });
    expect(get_fake_table("game_event_logs").rows[0].voided).toBe(true);
  });

  it("reads live game logs for fixtures, active games and completed games", async () => {
    seed_fake_table("live_game_logs", [
      row("g1", {
        organization_id: "o1",
        fixture_id: "f1",
        game_status: "in_progress",
        started_at: "2024-01-01T10:00:00.000Z",
        created_at: "2024-01-01T00:00:00.000Z",
      }),
      row("g2", {
        organization_id: "o2",
        fixture_id: "f2",
        game_status: "paused",
        started_at: "",
        created_at: "2024-02-01T00:00:00.000Z",
      }),
      row("g3", {
        organization_id: "o1",
        fixture_id: "f3",
        game_status: "completed",
      }),
    ]);
    const repository = get_live_game_log_repository();

    const by_fixture = await repository.get_live_game_log_for_fixture(
      "f2" as never,
    );

    expect(by_fixture.success && by_fixture.data.id).toBe("g2");
    expect(
      await repository.get_live_game_log_for_fixture("f9" as never),
    ).toEqual({
      success: false,
      error: "No live game log found for this fixture",
    });
    expect(ids_of(await repository.get_active_games())).toEqual(["g2", "g1"]);
    expect(ids_of(await repository.get_active_games("o1" as never))).toEqual([
      "g1",
    ]);
    expect(ids_of(await repository.find_completed_games())).toEqual(["g3"]);
    expect(ids_of(await repository.find_completed_games("o2"))).toEqual([]);
    expect(
      ids_of(
        await repository.find_by_organization("o1" as never, {
          page: 1,
          page_size: 1,
        }),
      ),
    ).toEqual(["g1"]);
  });

  it("stamps started_at and ended_at on live game status transitions", async () => {
    seed_fake_table("live_game_logs", [
      row("g1", { game_status: "pre_game", started_at: "", ended_at: "" }),
    ]);
    const repository = get_live_game_log_repository();

    const started = await repository.update(
      "g1" as never,
      { game_status: "in_progress" } as never,
    );
    const ended = await repository.update(
      "g1" as never,
      { game_status: "abandoned" } as never,
    );

    expect(started.success && started.data.started_at).not.toBe("");
    expect(started.success && started.data.ended_at).toBe("");
    expect(ended.success && ended.data.ended_at).not.toBe("");
  });
});
