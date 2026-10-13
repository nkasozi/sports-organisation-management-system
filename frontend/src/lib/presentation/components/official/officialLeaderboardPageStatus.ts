export const OFFICIAL_LEADERBOARD_PAGE_STATUS = {
  LOADING: "loading",
  FAILED: "failed",
  READY: "ready",
} as const;

export type OfficialLeaderboardPageStatusState =
  | { status: typeof OFFICIAL_LEADERBOARD_PAGE_STATUS.LOADING }
  | { status: typeof OFFICIAL_LEADERBOARD_PAGE_STATUS.FAILED; message: string }
  | { status: typeof OFFICIAL_LEADERBOARD_PAGE_STATUS.READY };

export function create_official_leaderboard_loading_state(): OfficialLeaderboardPageStatusState {
  return { status: OFFICIAL_LEADERBOARD_PAGE_STATUS.LOADING };
}

export function create_official_leaderboard_failed_state(
  message: string,
): OfficialLeaderboardPageStatusState {
  return { status: OFFICIAL_LEADERBOARD_PAGE_STATUS.FAILED, message };
}

export function create_official_leaderboard_ready_state(): OfficialLeaderboardPageStatusState {
  return { status: OFFICIAL_LEADERBOARD_PAGE_STATUS.READY };
}
