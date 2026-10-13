import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  seed_demo_competition_stages,
  seed_demo_competitions,
  seed_demo_officials,
  seed_demo_players,
  seed_demo_team_staff,
  seed_demo_teams,
  seed_demo_venues,
} from "./demoEntitySeedersCore";
import {
  FAIL,
  LOOKUPS,
  NAMED,
  OK,
  PEOPLE,
  repository,
  VENUE_IDS,
  VENUES,
} from "./demoEntitySeedersCore.test_support";

const mocks = vi.hoisted(() => ({
  emit: vi.fn(),
  generators: {
    create_seed_players: vi.fn(),
    create_seed_venues: vi.fn(),
    create_seed_teams: vi.fn(),
    create_seed_team_staff: vi.fn(),
    create_seed_officials: vi.fn(),
    create_seed_competitions: vi.fn(),
    create_seed_competition_stages: vi.fn(),
  },
}));

vi.mock("../../infrastructure/utils/SeedDataGenerator", () => mocks.generators);
vi.mock("./seedingUserSetup", () => ({
  emit_entity_created_events: mocks.emit,
}));

function display_names(call_index: number): string[] {
  const [, entities, describe_entity] = mocks.emit.mock.calls[call_index];
  return (entities as never[]).map((entity) => describe_entity(entity));
}

describe("demoEntitySeedersCore", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.emit.mockReset();
    mocks.generators.create_seed_players.mockReturnValue(PEOPLE);
    mocks.generators.create_seed_venues.mockReturnValue(VENUES);
    mocks.generators.create_seed_teams.mockReturnValue(NAMED);
    mocks.generators.create_seed_team_staff.mockReturnValue(PEOPLE);
    mocks.generators.create_seed_officials.mockReturnValue(PEOPLE);
    mocks.generators.create_seed_competitions.mockReturnValue(NAMED);
    mocks.generators.create_seed_competition_stages.mockReturnValue(NAMED);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("seeds players one at a time and emits created events", async () => {
    const player_repository = repository(OK);

    const result = await seed_demo_players(
      "org1",
      player_repository,
      {} as never,
    );

    expect(result).toEqual({ success: true, data: 2 });
    expect(
      (player_repository as { seed_with_data: ReturnType<typeof vi.fn> })
        .seed_with_data.mock.calls,
    ).toEqual([[[PEOPLE[0]]], [[PEOPLE[1]]]]);
    expect(mocks.emit.mock.calls[0][0]).toBe("player");
    expect(display_names(0)).toEqual(["Ann Lee", "Bob Ray"]);
  });

  it("stops player seeding at the first failure", async () => {
    const result = await seed_demo_players(
      "org1",
      repository(FAIL),
      {} as never,
    );

    expect(result).toEqual({
      success: false,
      error: "Failed to seed demo players",
    });
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it("seeds venues and returns their ids", async () => {
    expect(await seed_demo_venues("org1", repository(OK))).toEqual({
      success: true,
      data: VENUE_IDS,
    });
    expect(mocks.emit.mock.calls[0][0]).toBe("venue");
  });

  it("rejects incomplete or failed venue seeding", async () => {
    mocks.generators.create_seed_venues.mockReturnValue(VENUES.slice(0, 4));

    expect(await seed_demo_venues("org1", repository(OK))).toEqual({
      success: false,
      error: "Failed to seed demo venues",
    });
    expect(await seed_demo_venues("org1", repository(FAIL))).toEqual({
      success: false,
      error: "Failed to seed demo venues",
    });
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it("seeds batched entities and describes them for events", async () => {
    expect(await seed_demo_teams(repository(OK), VENUE_IDS)).toEqual({
      success: true,
      data: 1,
    });
    expect(await seed_demo_team_staff(repository(OK), LOOKUPS)).toEqual({
      success: true,
      data: 2,
    });
    expect(await seed_demo_officials("org1", repository(OK))).toEqual({
      success: true,
      data: 2,
    });
    expect(await seed_demo_competitions(repository(OK), LOOKUPS)).toEqual({
      success: true,
      data: 1,
    });
    expect(await seed_demo_competition_stages(repository(OK))).toEqual({
      success: true,
      data: 1,
    });

    expect(mocks.emit.mock.calls.map((call) => call[0])).toEqual([
      "team",
      "team_staff",
      "official",
      "competition",
      "competition_stage",
    ]);
    expect([0, 1, 2, 3, 4].map((index) => display_names(index)[0])).toEqual([
      "Alpha",
      "Ann Lee",
      "Ann Lee",
      "Alpha",
      "Alpha (c1)",
    ]);
    expect(mocks.generators.create_seed_teams).toHaveBeenCalledWith(
      "v1",
      "v2",
      "v3",
      "v4",
      "v5",
    );
    expect(mocks.generators.create_seed_team_staff).toHaveBeenCalledWith(
      "hc",
      "ac",
      "ph",
      "tm",
    );
    expect(mocks.generators.create_seed_competitions).toHaveBeenCalledWith({
      league: "f1",
    });
  });

  it("reports batched seeding failures", async () => {
    const failure = (
      plural_label: string,
    ): { success: false; error: string } => ({
      success: false,
      error: `Failed to seed demo ${plural_label}`,
    });

    expect(await seed_demo_teams(repository(FAIL), VENUE_IDS)).toEqual(
      failure("teams"),
    );
    expect(await seed_demo_team_staff(repository(FAIL), LOOKUPS)).toEqual(
      failure("team staff"),
    );
    expect(await seed_demo_officials("org1", repository(FAIL))).toEqual(
      failure("officials"),
    );
    expect(await seed_demo_competitions(repository(FAIL), LOOKUPS)).toEqual(
      failure("competitions"),
    );
    expect(await seed_demo_competition_stages(repository(FAIL))).toEqual(
      failure("competition stages"),
    );
    expect(mocks.emit).not.toHaveBeenCalled();
  });
});
