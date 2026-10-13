import type { LiveGameDetailDataDependencies } from "$lib/presentation/logic/liveGameDetailData";
import type { LiveGameDetailPageActionDependencies } from "$lib/presentation/logic/liveGameDetailPageActions";
import type {
  LiveGameDetailDerivedState,
  LiveGameDetailEventState,
  LiveGameDetailModalState,
  LiveGameDetailPageState,
  LiveGameDetailToastState,
} from "$lib/presentation/logic/liveGameDetailPageState";

import { create_live_game_detail_clock_handlers } from "./liveGameDetailControllerClock";
import { create_live_game_detail_event_handlers } from "./liveGameDetailControllerEventActions";
import { create_live_game_detail_game_handlers } from "./liveGameDetailControllerGameActions";
import { create_live_game_detail_period_handlers } from "./liveGameDetailControllerPeriodActions";
import { create_live_game_detail_report_handlers } from "./liveGameDetailControllerReportActions";

type LiveGameDetailControllerRuntimeCommand = {
  action_dependencies: LiveGameDetailPageActionDependencies;
  data_dependencies: LiveGameDetailDataDependencies;
  fixture_id: () => string;
  get_branding_logo_url: () => string;
  get_event_state: () => LiveGameDetailEventState;
  get_modal_state: () => LiveGameDetailModalState;
  get_page_state: () => LiveGameDetailPageState;
  get_view_state: () => LiveGameDetailDerivedState;
  goto: (path: string) => Promise<unknown>;
  raw_token: () => string;
  set_event_state: (state: LiveGameDetailEventState) => void;
  set_modal_state: (state: LiveGameDetailModalState) => void;
  set_page_state: (state: LiveGameDetailPageState) => void;
  set_toast_state: (state: LiveGameDetailToastState) => void;
};

type LiveGameDetailClockHandlers = ReturnType<
  typeof create_live_game_detail_clock_handlers
>;

function build_clock_handlers(
  command: LiveGameDetailControllerRuntimeCommand,
): LiveGameDetailClockHandlers {
  return create_live_game_detail_clock_handlers({
    data_dependencies: command.data_dependencies,
    fixture_id: command.fixture_id,
    get_event_state: command.get_event_state,
    get_page_state: command.get_page_state,
    goto: command.goto,
    raw_token: command.raw_token,
    set_page_state: command.set_page_state,
  });
}

function build_event_handlers(
  command: LiveGameDetailControllerRuntimeCommand,
): ReturnType<typeof create_live_game_detail_event_handlers> {
  return create_live_game_detail_event_handlers({
    action_dependencies: command.action_dependencies,
    get_event_state: command.get_event_state,
    get_page_state: command.get_page_state,
    get_view_state: command.get_view_state,
    set_event_state: command.set_event_state,
    set_page_state: command.set_page_state,
    set_toast_state: command.set_toast_state,
  });
}

function build_game_handlers(
  command: LiveGameDetailControllerRuntimeCommand,
  clock_handlers: LiveGameDetailClockHandlers,
): ReturnType<typeof create_live_game_detail_game_handlers> {
  return create_live_game_detail_game_handlers({
    action_dependencies: command.action_dependencies,
    get_modal_state: command.get_modal_state,
    get_page_state: command.get_page_state,
    get_view_state: command.get_view_state,
    reload_fixture_bundle: clock_handlers.reload_fixture_bundle,
    set_modal_state: command.set_modal_state,
    set_page_state: command.set_page_state,
    set_toast_state: command.set_toast_state,
    start_clock: clock_handlers.start_clock,
    stop_clock: clock_handlers.stop_clock,
  });
}

function build_period_handlers(
  command: LiveGameDetailControllerRuntimeCommand,
  clock_handlers: LiveGameDetailClockHandlers,
): ReturnType<typeof create_live_game_detail_period_handlers> {
  return create_live_game_detail_period_handlers({
    action_dependencies: command.action_dependencies,
    get_modal_state: command.get_modal_state,
    get_page_state: command.get_page_state,
    get_view_state: command.get_view_state,
    set_modal_state: command.set_modal_state,
    set_page_state: command.set_page_state,
    set_toast_state: command.set_toast_state,
    start_clock: clock_handlers.start_clock,
    stop_clock: clock_handlers.stop_clock,
  });
}

function build_report_handlers(
  command: LiveGameDetailControllerRuntimeCommand,
): ReturnType<typeof create_live_game_detail_report_handlers> {
  return create_live_game_detail_report_handlers({
    action_dependencies: command.action_dependencies,
    get_branding_logo_url: command.get_branding_logo_url,
    get_page_state: command.get_page_state,
    set_page_state: command.set_page_state,
    set_toast_state: command.set_toast_state,
  });
}

export function create_live_game_detail_controller_runtime(
  command: LiveGameDetailControllerRuntimeCommand,
): LiveGameDetailClockHandlers &
  ReturnType<typeof create_live_game_detail_event_handlers> &
  ReturnType<typeof create_live_game_detail_game_handlers> &
  ReturnType<typeof create_live_game_detail_period_handlers> &
  ReturnType<typeof create_live_game_detail_report_handlers> {
  const clock_handlers = build_clock_handlers(command);
  const event_handlers = build_event_handlers(command);
  const game_handlers = build_game_handlers(command, clock_handlers);
  const period_handlers = build_period_handlers(command, clock_handlers);
  const report_handlers = build_report_handlers(command);
  return {
    ...clock_handlers,
    ...event_handlers,
    ...game_handlers,
    ...period_handlers,
    ...report_handlers,
  };
}
