import { describe, expect, it } from "vitest";
import { vi } from "vitest";

import { OptionStatus } from "$lib/core/types/Option";

import {
  build_live_games_resume_start_url,
  find_fixture_to_resume_starting,
  resume_start_if_requested,
  select_live_games_organization_id,
} from "./liveGamesStartResume";

const SCHEDULED_FIXTURE = { id: "fixture-1", status: "scheduled" };
const LIVE_FIXTURE = { id: "fixture-2", status: "in_progress" };

describe("resuming a game start after fixture details are saved", () => {
  it("builds a live games link that names the fixture and its organisation", () => {
    expect(build_live_games_resume_start_url("fixture-1", "org-9")).toBe(
      "/live-games?start_fixture_id=fixture-1&organization_id=org-9",
    );
  });

  it("selects the organisation named in the link", () => {
    const organizations = [{ id: "org-1" }, { id: "org-9" }];

    expect(
      select_live_games_organization_id(
        organizations,
        new URLSearchParams("organization_id=org-9"),
      ),
    ).toBe("org-9");
    expect(
      select_live_games_organization_id(
        organizations,
        new URLSearchParams("organization_id=org-unknown"),
      ),
    ).toBe("org-1");
    expect(select_live_games_organization_id([], new URLSearchParams(""))).toBe(
      "",
    );
  });

  it("finds the scheduled fixture named in the link", () => {
    const resume = find_fixture_to_resume_starting(
      new URLSearchParams("start_fixture_id=fixture-1"),
      [SCHEDULED_FIXTURE, LIVE_FIXTURE] as never,
    );

    expect(resume).toEqual({
      status: OptionStatus.SOME,
      value: SCHEDULED_FIXTURE,
    });
  });

  it("does nothing when the link names no fixture or one already started", () => {
    expect(
      find_fixture_to_resume_starting(new URLSearchParams(""), [
        SCHEDULED_FIXTURE,
      ] as never).status,
    ).toBe(OptionStatus.NONE);
    expect(
      find_fixture_to_resume_starting(
        new URLSearchParams("start_fixture_id=fixture-2"),
        [LIVE_FIXTURE] as never,
      ).status,
    ).toBe(OptionStatus.NONE);
  });
});

describe("resume_start_if_requested", () => {
  it("opens the start confirmation and clears the request", () => {
    const request_start = vi.fn();
    const clear_request = vi.fn();

    const resumed = resume_start_if_requested({
      search_parameters: new URLSearchParams("start_fixture_id=fixture-1"),
      fixtures: [SCHEDULED_FIXTURE] as never,
      request_start,
      clear_request,
    });

    expect(resumed).toBe(true);
    expect(request_start).toHaveBeenCalledWith(SCHEDULED_FIXTURE);
    expect(clear_request).toHaveBeenCalledTimes(1);
  });

  it("leaves the page alone when nothing was requested", () => {
    const request_start = vi.fn();

    expect(
      resume_start_if_requested({
        search_parameters: new URLSearchParams(""),
        fixtures: [SCHEDULED_FIXTURE] as never,
        request_start,
        clear_request: vi.fn(),
      }),
    ).toBe(false);
    expect(request_start).not.toHaveBeenCalled();
  });
});
