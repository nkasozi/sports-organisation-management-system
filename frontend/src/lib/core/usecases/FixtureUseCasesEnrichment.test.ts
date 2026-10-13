import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FixtureRepository, TeamRepository } from "../interfaces/ports";
import { create_failure_result, create_success_result } from "../types/Result";
import { create_fixture_use_cases } from "./FixtureUseCases";
import {
  create_mock_repository,
  create_test_fixture,
} from "./FixtureUseCases.test_support";

const mocks = vi.hoisted(() => ({ emit_entity_created: vi.fn() }));

vi.mock("$lib/infrastructure/events/EventBus", () => ({
  EventBus: { emit_entity_created: mocks.emit_entity_created },
}));

function fixture_page(): unknown {
  return create_success_result({
    items: [create_test_fixture()],
    total_count: 1,
    page_number: 1,
    page_size: 10,
    total_pages: 1,
  });
}

describe("FixtureUseCases enrichment and generation", () => {
  let repository: FixtureRepository;

  beforeEach(() => {
    repository = create_mock_repository();
    mocks.emit_entity_created.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds team names when teams are available", async () => {
    vi.mocked(repository.find_all).mockResolvedValue(fixture_page() as never);
    const team_repository = {
      find_all: vi
        .fn()
        .mockResolvedValue(
          create_success_result({ items: [{ id: "team-1", name: "Lions" }] }),
        ),
    } as unknown as TeamRepository;

    const result = await create_fixture_use_cases(
      repository,
      team_repository,
    ).list();

    expect(result.success && result.data.items[0]).toMatchObject({
      home_team_name: "Lions",
      away_team_name: "team-2",
    });
  });

  it("keeps fixtures unchanged when team names cannot be loaded", async () => {
    vi.mocked(repository.find_all).mockResolvedValue(fixture_page() as never);
    const team_repository = {
      find_all: vi.fn().mockResolvedValue(create_failure_result("offline")),
    } as unknown as TeamRepository;

    const result = await create_fixture_use_cases(
      repository,
      team_repository,
    ).list();

    expect(result.success && result.data.items[0]).toEqual(
      create_test_fixture(),
    );
  });

  it("rejects generation when a round has no stage", async () => {
    const result = await create_fixture_use_cases(repository).generate_fixtures(
      {
        competition_id: "comp-1",
        team_ids: ["t1", "t2"],
        start_date: "2026-01-01",
        rounds: 2,
        stage_id_per_round: { 1: "stage-1" },
      } as never,
    );

    expect(result).toEqual(
      create_failure_result(
        "All rounds must be mapped to a stage. Missing stage mappings for rounds: 2",
      ),
    );
    expect(repository.create_many).not.toHaveBeenCalled();
  });
});
