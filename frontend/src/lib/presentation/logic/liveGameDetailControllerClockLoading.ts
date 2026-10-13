import { browser } from "$app/environment";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
import { load_live_game_detail_bundle } from "$lib/presentation/logic/liveGameDetailData";
import {
  apply_live_game_detail_bundle,
  type LiveGameDetailPageState,
} from "$lib/presentation/logic/liveGameDetailPageState";
import { access_denial_store } from "$lib/presentation/stores/accessDenial";

import {
  type LiveGameDetailClockContext,
  start_live_game_detail_clock,
  update_live_game_detail_clock_page_state,
} from "./liveGameDetailControllerClockTicking";
import {
  begin_live_game_detail_load,
  fail_live_game_detail_load,
  finish_live_game_detail_load,
} from "./liveGameDetailPageStateMachine";

const VIEW_ONLY_PERMISSION_MESSAGE =
  "You have view-only access to this live game. Game management actions are not available.";
const READ_DENIED_MESSAGE =
  "You do not have permission to view this live game.";
const MISSING_FIXTURE_ID_MESSAGE = "No fixture ID provided";

export async function reload_live_game_detail_fixture_bundle(
  context: LiveGameDetailClockContext,
): Promise<LiveGameDetailPageState["fixture"]> {
  const result = await load_live_game_detail_bundle(
    context.command.fixture_id(),
    context.command.data_dependencies,
  );
  if (!result.success) {
    update_live_game_detail_clock_page_state(context, (page_state) =>
      fail_live_game_detail_load(page_state, result.error_message),
    );
    return;
  }
  update_live_game_detail_clock_page_state(context, (page_state) =>
    result.data.fixture.status === FIXTURE_STATUS.COMPLETED
      ? {
          ...apply_live_game_detail_bundle(page_state, result.data),
          home_lineup_expanded: true,
          away_lineup_expanded: true,
        }
      : apply_live_game_detail_bundle(page_state, result.data),
  );
  return result.data.fixture;
}

async function load_live_game_detail_fixture(
  context: LiveGameDetailClockContext,
): Promise<void> {
  update_live_game_detail_clock_page_state(
    context,
    begin_live_game_detail_load,
  );
  const fixture = await reload_live_game_detail_fixture_bundle(context);
  update_live_game_detail_clock_page_state(
    context,
    finish_live_game_detail_load,
  );
  if (fixture?.status === FIXTURE_STATUS.IN_PROGRESS)
    start_live_game_detail_clock(context);
}

export async function load_live_game_detail_fixture_or_error(
  context: LiveGameDetailClockContext,
): Promise<void> {
  if (context.command.fixture_id()) {
    await load_live_game_detail_fixture(context);
    return;
  }
  update_live_game_detail_clock_page_state(context, (page_state) =>
    fail_live_game_detail_load(page_state, MISSING_FIXTURE_ID_MESSAGE),
  );
}

async function apply_live_game_detail_fixture_permissions(
  context: LiveGameDetailClockContext,
  raw_token: string,
): Promise<boolean> {
  const read_result = await get_authorization_adapter().check_entity_authorized(
    raw_token,
    "fixture",
    "read",
  );
  if (read_result.success && !read_result.data.is_authorized) {
    access_denial_store.set_denial(
      `/live-games/${context.command.fixture_id()}`,
      READ_DENIED_MESSAGE,
    );
    void context.command.goto("/");
    return false;
  }
  const update_result =
    await get_authorization_adapter().check_entity_authorized(
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

export async function initialize_live_game_detail_clock(
  context: LiveGameDetailClockContext,
): Promise<void> {
  if (!browser) return;
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success) {
    update_live_game_detail_clock_page_state(context, (page_state) =>
      fail_live_game_detail_load(page_state, auth_result.error_message),
    );
    return;
  }
  const raw_token = context.command.raw_token();
  const should_continue = raw_token
    ? await apply_live_game_detail_fixture_permissions(context, raw_token)
    : true;
  if (!should_continue) return;
  await load_live_game_detail_fixture_or_error(context);
}
