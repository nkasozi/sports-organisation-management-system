import { describe, expect, it, vi } from "vitest";

import {
  build_confirmed_live_game_url,
  start_confirmed_live_game_if_requested,
} from "./liveGameDetailConfirmedStart";

function create_command(overrides: {
  search: string;
  fixture_status?: string;
  has_fixture?: boolean;
}): Parameters<typeof start_confirmed_live_game_if_requested>[0] {
  const has_fixture = overrides.has_fixture ?? true;
  return {
    search_parameters: new URLSearchParams(overrides.search),
    get_page_state: () =>
      ({
        fixture: has_fixture
          ? {
              id: "fixture_1",
              status: overrides.fixture_status ?? "scheduled",
            }
          : void 0,
      }) as never,
    start_game: vi.fn(async () => {}),
    clear_request: vi.fn(async () => {}),
  };
}

describe("build_confirmed_live_game_url", () => {
  it("marks the live game link as already confirmed", () => {
    expect(build_confirmed_live_game_url("fixture_1")).toBe(
      "/live-games/fixture_1?start_confirmed=true",
    );
  });
});

describe("start_confirmed_live_game_if_requested", () => {
  it("starts the game without asking again when the list page confirmed it", async () => {
    const command = create_command({ search: "start_confirmed=true" });

    await expect(start_confirmed_live_game_if_requested(command)).resolves.toBe(
      true,
    );

    expect(command.start_game).toHaveBeenCalledTimes(1);
    expect(command.clear_request).toHaveBeenCalledTimes(1);
  });

  it("waits for the user when the page was opened directly", async () => {
    const command = create_command({ search: "" });

    await expect(start_confirmed_live_game_if_requested(command)).resolves.toBe(
      false,
    );

    expect(command.start_game).not.toHaveBeenCalled();
    expect(command.clear_request).not.toHaveBeenCalled();
  });

  it("does not restart a game that is already running", async () => {
    const command = create_command({
      search: "start_confirmed=true",
      fixture_status: "in_progress",
    });

    await expect(start_confirmed_live_game_if_requested(command)).resolves.toBe(
      false,
    );

    expect(command.start_game).not.toHaveBeenCalled();
    expect(command.clear_request).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the fixture could not be loaded", async () => {
    const command = create_command({
      search: "start_confirmed=true",
      has_fixture: false,
    });

    await expect(start_confirmed_live_game_if_requested(command)).resolves.toBe(
      false,
    );

    expect(command.start_game).not.toHaveBeenCalled();
  });
});
