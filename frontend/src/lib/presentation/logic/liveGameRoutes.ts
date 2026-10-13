const LIVE_GAME_DETAIL_PATH_PREFIX = "/live-games/";

export const LEGACY_GAME_MANAGE_REDIRECT_STATUS = 308;

export function build_live_game_detail_url(fixture_id: string): string {
  return `${LIVE_GAME_DETAIL_PATH_PREFIX}${encodeURIComponent(fixture_id)}`;
}
