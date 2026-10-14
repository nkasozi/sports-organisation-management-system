import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { create_fixture_lineup_use_cases } from "./FixtureLineupUseCases";
import { create_fixture_repository_with_status } from "./FixtureLineupUseCases.test_support";

const mocks = vi.hoisted(() => ({ emit_entity_updated: vi.fn() }));

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_updated: mocks.emit_entity_updated },
}));

interface LineupDouble {
  id: string;
  status: string;
  selected_players: unknown[];
}

interface LineupRepositoryDouble {
  find_by_id: Mock;
  update: Mock;
  delete_by_id: Mock;
  create: Mock;
  get_lineup_for_team_in_fixture: Mock;
  get_lineups_for_fixture: Mock;
}

interface FoundLineup {
  success: true;
  data: LineupDouble;
}

function lineup(
  status: string,
  selected_players: unknown[] = [{ id: "p1" }],
): LineupDouble {
  return { id: "l1", status, selected_players };
}

function create_repository(existing: unknown): LineupRepositoryDouble {
  return {
    find_by_id: vi.fn().mockResolvedValue(existing),
    update: vi.fn((id: string, updates: object) =>
      Promise.resolve({
        success: true,
        data: { ...lineup("draft"), ...updates, id },
      }),
    ),
    delete_by_id: vi.fn().mockResolvedValue({ success: true, data: true }),
    create: vi.fn().mockResolvedValue({ success: true, data: lineup("draft") }),
    get_lineup_for_team_in_fixture: vi.fn(),
    get_lineups_for_fixture: vi
      .fn()
      .mockResolvedValue({ success: true, data: [] }),
  };
}

function use_cases_for(existing: unknown): {
  repository: LineupRepositoryDouble;
  use_cases: ReturnType<typeof create_fixture_lineup_use_cases>;
} {
  const repository = create_repository(existing);
  return {
    repository,
    use_cases: create_fixture_lineup_use_cases(
      repository as never,
      create_fixture_repository_with_status("scheduled"),
    ),
  };
}

const found = (status: string, players?: unknown[]): FoundLineup => ({
  success: true,
  data: lineup(status, players),
});
const MISSING = { success: false, error: "missing" };

describe("FixtureLineupUseCases transitions", () => {
  beforeEach(() => {
    mocks.emit_entity_updated.mockReset();
  });

  it("submits draft lineups and emits the status change", async () => {
    const { repository, use_cases } = use_cases_for(found("draft"));

    const result = await use_cases.submit_lineup("l1");

    expect(result.success && result.data.status).toBe("submitted");
    expect(repository.update.mock.calls[0][1]).toMatchObject({
      status: "submitted",
    });
    expect(mocks.emit_entity_updated).toHaveBeenCalledWith(
      "fixturelineup",
      "l1",
      "l1",
      lineup("draft"),
      expect.objectContaining({ status: "submitted" }),
      ["status", "submitted_at"],
    );
  });

  it.each([
    [MISSING, "Lineup not found"],
    [found("locked"), "Cannot submit a locked lineup"],
    [found("submitted"), "Lineup is already submitted"],
    [found("draft", []), "Cannot submit an empty lineup"],
  ])("rejects submitting %#", async (existing, error) => {
    const { repository, use_cases } = use_cases_for(existing);

    expect(await use_cases.submit_lineup("l1")).toEqual({
      success: false,
      error,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("locks lineups and emits the status change", async () => {
    const { repository, use_cases } = use_cases_for(found("submitted"));

    const result = await use_cases.lock_lineup("l1");

    expect(repository.update).toHaveBeenCalledWith("l1", { status: "locked" });
    expect(result.success && result.data.status).toBe("locked");
    expect(mocks.emit_entity_updated.mock.calls[0][5]).toEqual(["status"]);
  });

  it.each([
    [MISSING, "Lineup not found"],
    [found("locked"), "Lineup is already locked"],
    [found("draft", []), "Cannot lock an empty lineup"],
  ])("rejects locking %#", async (existing, error) => {
    expect(await use_cases_for(existing).use_cases.lock_lineup("l1")).toEqual({
      success: false,
      error,
    });
  });

  it("protects locked or missing lineups from update and delete", async () => {
    const locked = use_cases_for(found("locked")).use_cases;
    const missing = use_cases_for(MISSING).use_cases;

    expect(await locked.update("l1", {})).toEqual({
      success: false,
      error: "Cannot update a locked lineup",
    });
    expect(await locked.delete("l1")).toEqual({
      success: false,
      error: "Cannot delete a locked lineup",
    });
    expect(await missing.update("l1", {})).toEqual({
      success: false,
      error: "Lineup not found",
    });
    expect(await missing.delete("l1")).toEqual({
      success: false,
      error: "Lineup not found",
    });
  });

  it("rejects duplicate lineups and delegates fixture lookups", async () => {
    const { repository, use_cases } = use_cases_for(MISSING);
    repository.get_lineup_for_team_in_fixture
      .mockResolvedValueOnce(found("draft"))
      .mockResolvedValueOnce(MISSING)
      .mockResolvedValueOnce(found("submitted"));

    expect(
      await use_cases.create({ fixture_id: "f1", team_id: "t1" } as never),
    ).toEqual({
      success: false,
      error: "A lineup already exists for this team in this fixture",
    });
    expect(
      (await use_cases.create({ fixture_id: "f1", team_id: "t1" } as never))
        .success,
    ).toBe(true);
    expect(await use_cases.get_lineups_for_fixture("f1")).toEqual({
      success: true,
      data: [],
    });
    expect(await use_cases.get_lineup_for_team_in_fixture("f1", "t1")).toEqual(
      found("submitted"),
    );
    expect(repository.get_lineup_for_team_in_fixture).toHaveBeenLastCalledWith(
      "f1",
      "t1",
    );
  });
});
