import type { Fixture } from "$lib/core/entities/Fixture";

import { decide_live_game_control, LIVE_GAME_ACTOR } from "./liveGameControl";
import {
  type LiveGameDetailClockContext,
  update_live_game_detail_clock_page_state,
} from "./liveGameDetailControllerClockTicking";

export async function apply_live_game_detail_control(
  context: LiveGameDetailClockContext,
  fixture: Fixture,
): Promise<boolean> {
  const identity = await context.command.load_live_game_identity(
    fixture.organization_id,
  );
  const control = decide_live_game_control({
    ...identity,
    assigned_officials: fixture.assigned_officials ?? [],
  });
  update_live_game_detail_clock_page_state(context, (page_state) => ({
    ...page_state,
    live_game_actor: control.actor,
    correction_author_name: identity.display_name,
    correction_author_role: identity.role_label,
    can_modify_game:
      page_state.can_modify_game && control.actor !== LIVE_GAME_ACTOR.WATCHER,
    permission_info_message:
      page_state.permission_info_message || control.notice,
  }));
  return true;
}
