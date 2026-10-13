import { describe, expect, it, vi } from "vitest";

import type { TeamProfile } from "$lib/core/entities/TeamProfile";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  copy_team_profile_link,
  load_team_profile_preview,
  TEAM_PROFILE_PREVIEW_MESSAGES,
  TEAM_PROFILE_PREVIEW_STATUS,
} from "./teamProfilePreviewState";

const ORIGIN = "https://example.test";
const PROFILE = {
  id: "profile-1",
  team_id: "team-1",
  profile_slug: "lions",
  visibility: "public",
} as unknown as TeamProfile;

function page_of(items: TeamProfile[]): unknown {
  return create_success_result({
    items,
    total_count: items.length,
    page_number: 1,
    page_size: 10,
    total_pages: 1,
  });
}

describe("load_team_profile_preview", () => {
  it("returns a loaded state with the public preview url", async () => {
    const list = vi.fn(async () => page_of([PROFILE]));
    const state = await load_team_profile_preview({
      team_id: "team-1",
      origin: ORIGIN,
      list_team_profiles: list as never,
    });
    expect(list).toHaveBeenCalledWith({ team_id: "team-1" });
    expect(state).toEqual({
      status: TEAM_PROFILE_PREVIEW_STATUS.LOADED,
      profile: PROFILE,
      preview_url: `${ORIGIN}/team-profile/lions`,
      is_public: true,
    });
  });

  it("returns not_found when the team has no profile", async () => {
    const state = await load_team_profile_preview({
      team_id: "team-1",
      origin: ORIGIN,
      list_team_profiles: (async () => page_of([])) as never,
    });
    expect(state).toEqual({ status: TEAM_PROFILE_PREVIEW_STATUS.NOT_FOUND });
  });

  it("returns not_found when the profile has no slug", async () => {
    const state = await load_team_profile_preview({
      team_id: "team-1",
      origin: ORIGIN,
      list_team_profiles: (async () =>
        page_of([{ ...PROFILE, profile_slug: "" } as TeamProfile])) as never,
    });
    expect(state).toEqual({ status: TEAM_PROFILE_PREVIEW_STATUS.NOT_FOUND });
  });

  it("returns a friendly failure when loading fails", async () => {
    const state = await load_team_profile_preview({
      team_id: "team-1",
      origin: ORIGIN,
      list_team_profiles: (async () =>
        create_failure_result("db exploded")) as never,
    });
    expect(state).toEqual({
      status: TEAM_PROFILE_PREVIEW_STATUS.FAILED,
      message: TEAM_PROFILE_PREVIEW_MESSAGES.LOAD_FAILED,
    });
  });
});

describe("copy_team_profile_link", () => {
  it("returns a success message when the clipboard accepts the link", async () => {
    const write_text = vi.fn(async (): Promise<void> => Promise.resolve());
    const result = await copy_team_profile_link("url", write_text);
    expect(write_text).toHaveBeenCalledWith("url");
    expect(result).toEqual(
      create_success_result(TEAM_PROFILE_PREVIEW_MESSAGES.LINK_COPIED),
    );
  });

  it("returns a friendly failure when the clipboard rejects", async () => {
    const result = await copy_team_profile_link("url", async () =>
      Promise.reject(new Error("denied")),
    );
    expect(result).toEqual(
      create_failure_result(TEAM_PROFILE_PREVIEW_MESSAGES.COPY_FAILED),
    );
  });
});
