import type { TeamProfile } from "$lib/core/entities/TeamProfile";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type PaginatedAsyncResult,
} from "$lib/core/types/Result";

export const TEAM_PROFILE_PREVIEW_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  LOADED: "loaded",
  NOT_FOUND: "not_found",
  FAILED: "failed",
} as const;

export const TEAM_PROFILE_PREVIEW_MESSAGES = {
  LOAD_FAILED:
    "We couldn't load this team's public profile right now. Please try again.",
  COPY_FAILED: "We couldn't copy the link. Please copy it manually.",
  LINK_COPIED: "Link copied to clipboard.",
  VISIBILITY_PUBLIC: "Public",
  VISIBILITY_PRIVATE: "Private",
} as const;

const TEAM_PROFILE_PUBLIC_VISIBILITY = "public";
const TEAM_PROFILE_PREVIEW_PATH_PREFIX = "/team-profile/";
export const TEAM_PROFILE_PREVIEW_WINDOW_TARGET = "_blank";

const TEAM_PROFILE_PREVIEW_LOAD_FAILED_EVENT =
  "team_profile_preview_load_failed";
const TEAM_PROFILE_LINK_COPY_FAILED_EVENT = "team_profile_link_copy_failed";

export type TeamProfilePreviewState =
  | { status: typeof TEAM_PROFILE_PREVIEW_STATUS.IDLE }
  | { status: typeof TEAM_PROFILE_PREVIEW_STATUS.LOADING }
  | {
      status: typeof TEAM_PROFILE_PREVIEW_STATUS.LOADED;
      profile: TeamProfile;
      preview_url: string;
      is_public: boolean;
    }
  | { status: typeof TEAM_PROFILE_PREVIEW_STATUS.NOT_FOUND }
  | { status: typeof TEAM_PROFILE_PREVIEW_STATUS.FAILED; message: string };

interface TeamProfilePreviewQuery {
  team_id: string;
  origin: string;
  list_team_profiles(filter: {
    team_id: string;
  }): PaginatedAsyncResult<TeamProfile>;
}

const NOT_FOUND_STATE: TeamProfilePreviewState = {
  status: TEAM_PROFILE_PREVIEW_STATUS.NOT_FOUND,
};

function build_loaded_state(
  profile: TeamProfile,
  origin: string,
): TeamProfilePreviewState {
  if (!profile.profile_slug) return NOT_FOUND_STATE;
  return {
    status: TEAM_PROFILE_PREVIEW_STATUS.LOADED,
    profile,
    preview_url: `${origin}${TEAM_PROFILE_PREVIEW_PATH_PREFIX}${profile.profile_slug}`,
    is_public: profile.visibility === TEAM_PROFILE_PUBLIC_VISIBILITY,
  };
}

export async function load_team_profile_preview(
  query: TeamProfilePreviewQuery,
): Promise<TeamProfilePreviewState> {
  const result = await query.list_team_profiles({ team_id: query.team_id });
  if (!result.success) {
    console.error("[TeamProfilePreview] Failed to load team profile", {
      event: TEAM_PROFILE_PREVIEW_LOAD_FAILED_EVENT,
      team_id: query.team_id,
      error: result.error,
    });
    return {
      status: TEAM_PROFILE_PREVIEW_STATUS.FAILED,
      message: TEAM_PROFILE_PREVIEW_MESSAGES.LOAD_FAILED,
    };
  }
  const [first_profile] = result.data.items;
  return first_profile
    ? build_loaded_state(first_profile, query.origin)
    : NOT_FOUND_STATE;
}

export async function copy_team_profile_link(
  preview_url: string,
  write_text: (text: string) => Promise<void>,
): AsyncResult<string> {
  try {
    await write_text(preview_url);
    return create_success_result(TEAM_PROFILE_PREVIEW_MESSAGES.LINK_COPIED);
  } catch (error) {
    console.error("[TeamProfilePreview] Failed to copy link", {
      event: TEAM_PROFILE_LINK_COPY_FAILED_EVENT,
      error: String(error),
    });
    return create_failure_result(TEAM_PROFILE_PREVIEW_MESSAGES.COPY_FAILED);
  }
}
