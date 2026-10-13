import { describe, expect, it, vi } from "vitest";

import {
  type LiveGameDetailDataDependencies,
  load_live_game_detail_assigned_officials,
  load_live_game_detail_competition_context,
  load_live_game_detail_venue,
} from "./liveGameDetailDataLoaders";

type LoaderFixture = Parameters<typeof load_live_game_detail_venue>[0];

function create_dependencies(): LiveGameDetailDataDependencies {
  return {
    competition_use_cases: { get_by_id: vi.fn() },
    organization_use_cases: { get_by_id: vi.fn() },
    sport_use_cases: { get_by_id: vi.fn() },
    venue_use_cases: { get_by_id: vi.fn() },
    official_use_cases: { get_by_id: vi.fn() },
  } as unknown as LiveGameDetailDataDependencies;
}

describe("liveGameDetailDataLoaders", () => {
  it("treats a successful lookup without data as missing", async () => {
    const dependencies = create_dependencies();
    vi.mocked(dependencies.venue_use_cases.get_by_id).mockResolvedValue({
      success: true,
    } as never);

    await expect(
      load_live_game_detail_venue(
        { venue: "venue-1" } as LoaderFixture,
        dependencies,
      ),
    ).resolves.toEqual({ status: "none" });
  });

  it("returns the venue when the lookup succeeds", async () => {
    const dependencies = create_dependencies();
    vi.mocked(dependencies.venue_use_cases.get_by_id).mockResolvedValue({
      success: true,
      data: { id: "venue-1" },
    } as never);

    await expect(
      load_live_game_detail_venue(
        { venue: "venue-1" } as LoaderFixture,
        dependencies,
      ),
    ).resolves.toEqual({ status: "some", value: { id: "venue-1" } });
  });

  it("skips organization and sport lookups when the competition is missing", async () => {
    const dependencies = create_dependencies();

    await expect(
      load_live_game_detail_competition_context(
        { competition_id: "" } as LoaderFixture,
        dependencies,
      ),
    ).resolves.toEqual({
      competition: { status: "none" },
      organization: { status: "none" },
      sport: { status: "none" },
    });
    expect(dependencies.competition_use_cases.get_by_id).not.toHaveBeenCalled();
    expect(
      dependencies.organization_use_cases.get_by_id,
    ).not.toHaveBeenCalled();
  });

  it("loads competition, organization, and sport in sequence", async () => {
    const dependencies = create_dependencies();
    vi.mocked(dependencies.competition_use_cases.get_by_id).mockResolvedValue({
      success: true,
      data: { id: "competition-1", organization_id: "organization-1" },
    } as never);
    vi.mocked(dependencies.organization_use_cases.get_by_id).mockResolvedValue({
      success: true,
      data: { id: "organization-1", sport_id: "sport-1" },
    } as never);
    vi.mocked(dependencies.sport_use_cases.get_by_id).mockResolvedValue({
      success: false,
    } as never);

    const context = await load_live_game_detail_competition_context(
      { competition_id: "competition-1" } as LoaderFixture,
      dependencies,
    );

    expect(context.competition).toEqual({
      status: "some",
      value: { id: "competition-1", organization_id: "organization-1" },
    });
    expect(context.organization).toEqual({
      status: "some",
      value: { id: "organization-1", sport_id: "sport-1" },
    });
    expect(context.sport).toEqual({ status: "none" });
    expect(dependencies.sport_use_cases.get_by_id).toHaveBeenCalledWith(
      "sport-1",
    );
  });

  it("returns none for a missing venue and no officials when none are assigned", async () => {
    const dependencies = create_dependencies();
    const fixture = {
      venue: "",
      assigned_officials: [],
    } as unknown as LoaderFixture;

    await expect(
      load_live_game_detail_venue(fixture, dependencies),
    ).resolves.toEqual({ status: "none" });
    await expect(
      load_live_game_detail_assigned_officials(fixture, dependencies),
    ).resolves.toEqual([]);
    expect(dependencies.venue_use_cases.get_by_id).not.toHaveBeenCalled();
  });
});
