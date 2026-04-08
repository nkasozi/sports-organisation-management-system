import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  create_live_game_detail_clock_handlers_mock,
  create_live_game_detail_event_handlers_mock,
  create_live_game_detail_game_handlers_mock,
  create_live_game_detail_period_handlers_mock,
  create_live_game_detail_report_handlers_mock,
} = vi.hoisted(() => ({
  create_live_game_detail_clock_handlers_mock: vi.fn(),
  create_live_game_detail_event_handlers_mock: vi.fn(),
  create_live_game_detail_game_handlers_mock: vi.fn(),
  create_live_game_detail_period_handlers_mock: vi.fn(),
  create_live_game_detail_report_handlers_mock: vi.fn(),
}));

vi.mock("./liveGameDetailControllerClock", () => ({
  create_live_game_detail_clock_handlers:
    create_live_game_detail_clock_handlers_mock,
}));

vi.mock("./liveGameDetailControllerEventActions", () => ({
  create_live_game_detail_event_handlers:
    create_live_game_detail_event_handlers_mock,
}));

vi.mock("./liveGameDetailControllerGameActions", () => ({
  create_live_game_detail_game_handlers:
    create_live_game_detail_game_handlers_mock,
}));

vi.mock("./liveGameDetailControllerPeriodActions", () => ({
  create_live_game_detail_period_handlers:
    create_live_game_detail_period_handlers_mock,
}));

vi.mock("./liveGameDetailControllerReportActions", () => ({
  create_live_game_detail_report_handlers:
    create_live_game_detail_report_handlers_mock,
}));

import { create_live_game_detail_controller_runtime } from "./liveGameDetailControllerRuntime";

describe("liveGameDetailControllerRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes clock, event, game, period, and report handlers into one runtime object", () => {
    const clock_handlers = {
      cleanup: vi.fn(),
      initialize: vi.fn(),
      reload_fixture_bundle: vi.fn(),
      start_clock: vi.fn(),
      stop_clock: vi.fn(),
    };
    const event_handlers = {
      cancel_event: vi.fn(),
      open_event_modal: vi.fn(),
      record_event: vi.fn(),
    };
    const game_handlers = { end_game: vi.fn(), start_game: vi.fn() };
    const period_handlers = {
      confirm_extra_time: vi.fn(),
      confirm_period: vi.fn(),
    };
    const report_handlers = { download_report: vi.fn() };
    create_live_game_detail_clock_handlers_mock.mockReturnValue(clock_handlers);
    create_live_game_detail_event_handlers_mock.mockReturnValue(event_handlers);
    create_live_game_detail_game_handlers_mock.mockReturnValue(game_handlers);
    create_live_game_detail_period_handlers_mock.mockReturnValue(
      period_handlers,
    );
    create_live_game_detail_report_handlers_mock.mockReturnValue(
      report_handlers,
    );

    const result = create_live_game_detail_controller_runtime({
      action_dependencies: { fixture_use_cases: {} } as never,
      data_dependencies: { fixture_use_cases: {} } as never,
      fixture_id: vi.fn(),
      get_branding_logo_url: vi.fn(),
      get_event_state: vi.fn(),
      get_modal_state: vi.fn(),
      get_page_state: vi.fn(),
      get_view_state: vi.fn(),
      goto: vi.fn(),
      raw_token: vi.fn(),
      set_event_state: vi.fn(),
      set_modal_state: vi.fn(),
      set_page_state: vi.fn(),
      set_toast_state: vi.fn(),
    });

    expect(create_live_game_detail_game_handlers_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        reload_fixture_bundle: clock_handlers.reload_fixture_bundle,
        start_clock: clock_handlers.start_clock,
        stop_clock: clock_handlers.stop_clock,
      }),
    );
    expect(create_live_game_detail_period_handlers_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        start_clock: clock_handlers.start_clock,
        stop_clock: clock_handlers.stop_clock,
      }),
    );
    expect(result).toEqual({
      ...clock_handlers,
      ...event_handlers,
      ...game_handlers,
      ...period_handlers,
      ...report_handlers,
    });
  });
});
