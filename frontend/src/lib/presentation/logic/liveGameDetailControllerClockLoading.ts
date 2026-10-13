import { browser } from "$app/environment";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
import { load_live_game_detail_bundle } from "$lib/presentation/logic/liveGameDetailData";
import {
  apply_live_game_detail_bundle,
  type LiveGameDetailPageState,
} from "$lib/presentation/logic/liveGameDetailPageState";

import { should_resume_live_game_detail_clock } from "./liveGameDetailControllerClockSaving";
import {
  type LiveGameDetailClockContext,
  start_live_game_detail_clock,
  update_live_game_detail_clock_page_state,
} from "./liveGameDetailControllerClockTicking";
import { apply_live_game_detail_fixture_permissions } from "./liveGameDetailFixturePermissions";
import {
  begin_live_game_detail_load,
  fail_live_game_detail_load,
  finish_live_game_detail_load,
} from "./liveGameDetailPageStateMachine";

const MISSING_FIXTURE_ID_MESSAGE = "No fixture ID provided";

export async function reload_live_game_detail_fixture_bundle(
  context: LiveGameDetailClockContext,
): Promise<LiveGameDetailPageState["fixture"]> {
  const result = await load_live_game_detail_bundle(
    context.command.fixture_id(),
    context.command.data_dependencies,
    context.now(),
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
  if (fixture && should_resume_live_game_detail_clock(context, fixture))
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
  const should_continue = await apply_live_game_detail_fixture_permissions(
    context,
    get_authorization_adapter(),
  );
  if (!should_continue) return;
  await load_live_game_detail_fixture_or_error(context);
}
