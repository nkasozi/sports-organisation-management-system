import type { AuthorizationPort } from "$lib/core/interfaces/ports";
import { PUBLIC_VIEWER_LIVE_GAMES_MESSAGE } from "$lib/presentation/logic/liveGamesMessages";
import { access_denial_store } from "$lib/presentation/stores/accessDenial";

import {
  type LiveGameDetailClockContext,
  update_live_game_detail_clock_page_state,
} from "./liveGameDetailControllerClockTicking";

const LIVE_GAME_DETAIL_READ_ACCESS_STATUS = {
  GRANTED: "granted",
  DENIED: "denied",
  UNVERIFIED: "unverified",
} as const;

type LiveGameDetailReadAccessStatus =
  (typeof LIVE_GAME_DETAIL_READ_ACCESS_STATUS)[keyof typeof LIVE_GAME_DETAIL_READ_ACCESS_STATUS];

const LIVE_GAME_DETAIL_PERMISSION_LOG_EVENTS = {
  CHECK_FAILED: "live_game_detail_permission_check_failed",
  TOKEN_MISSING: "live_game_detail_permission_token_missing",
} as const;

const VIEW_ONLY_PERMISSION_MESSAGE =
  "You have view-only access to this live game. Game management actions are not available.";
const READ_DENIED_MESSAGE =
  "You do not have permission to view this live game.";
const READ_UNVERIFIED_MESSAGE =
  "We could not verify your access to this live game. Please try again.";
const DENIAL_REDIRECT_PATH = "/";

async function resolve_live_game_detail_read_access(
  raw_token: string,
  authorization_adapter: AuthorizationPort,
): Promise<LiveGameDetailReadAccessStatus> {
  const read_result = await authorization_adapter.check_entity_authorized(
    raw_token,
    "fixture",
    "read",
  );
  if (!read_result.success) {
    console.error("[LiveGameDetail] Read permission check failed", {
      event: LIVE_GAME_DETAIL_PERMISSION_LOG_EVENTS.CHECK_FAILED,
      action: "read",
      error: read_result.error,
    });
    return LIVE_GAME_DETAIL_READ_ACCESS_STATUS.UNVERIFIED;
  }
  return read_result.data.is_authorized
    ? LIVE_GAME_DETAIL_READ_ACCESS_STATUS.GRANTED
    : LIVE_GAME_DETAIL_READ_ACCESS_STATUS.DENIED;
}

function deny_live_game_detail_access(
  context: LiveGameDetailClockContext,
  denial_message: string,
): boolean {
  access_denial_store.set_denial(
    `/live-games/${context.command.fixture_id()}`,
    denial_message,
  );
  void context.command.goto(DENIAL_REDIRECT_PATH);
  return false;
}

async function apply_live_game_detail_modify_permission(
  context: LiveGameDetailClockContext,
  raw_token: string,
  authorization_adapter: AuthorizationPort,
): Promise<boolean> {
  const update_result = await authorization_adapter.check_entity_authorized(
    raw_token,
    "fixture",
    "update",
  );
  const can_modify_game =
    update_result.success && update_result.data.is_authorized;
  update_live_game_detail_clock_page_state(context, (page_state) => ({
    ...page_state,
    can_modify_game,
    permission_info_message: can_modify_game
      ? ""
      : VIEW_ONLY_PERMISSION_MESSAGE,
  }));
  return true;
}

function apply_public_viewer_watch_permission(
  context: LiveGameDetailClockContext,
): boolean {
  update_live_game_detail_clock_page_state(context, (page_state) => ({
    ...page_state,
    can_modify_game: false,
    permission_info_message: PUBLIC_VIEWER_LIVE_GAMES_MESSAGE,
  }));
  return true;
}

export async function apply_live_game_detail_fixture_permissions(
  context: LiveGameDetailClockContext,
  authorization_adapter: AuthorizationPort,
): Promise<boolean> {
  if (context.command.is_public_viewer())
    return apply_public_viewer_watch_permission(context);
  const raw_token = context.command.raw_token();
  if (!raw_token) {
    console.error("[LiveGameDetail] No session token for permission check", {
      event: LIVE_GAME_DETAIL_PERMISSION_LOG_EVENTS.TOKEN_MISSING,
    });
    return deny_live_game_detail_access(context, READ_UNVERIFIED_MESSAGE);
  }
  const read_access_status = await resolve_live_game_detail_read_access(
    raw_token,
    authorization_adapter,
  );
  switch (read_access_status) {
    case LIVE_GAME_DETAIL_READ_ACCESS_STATUS.GRANTED:
      return apply_live_game_detail_modify_permission(
        context,
        raw_token,
        authorization_adapter,
      );
    case LIVE_GAME_DETAIL_READ_ACCESS_STATUS.DENIED:
      return deny_live_game_detail_access(context, READ_DENIED_MESSAGE);
    case LIVE_GAME_DETAIL_READ_ACCESS_STATUS.UNVERIFIED:
      return deny_live_game_detail_access(context, READ_UNVERIFIED_MESSAGE);
  }
}
