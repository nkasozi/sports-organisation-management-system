export const MATCH_REPORT_PAGE_STATUS = {
  LOADING: "loading",
  FAILED: "failed",
  READY: "ready",
} as const;

export type MatchReportPageStatusState =
  | { status: typeof MATCH_REPORT_PAGE_STATUS.LOADING }
  | { status: typeof MATCH_REPORT_PAGE_STATUS.FAILED; message: string }
  | { status: typeof MATCH_REPORT_PAGE_STATUS.READY };

export const MATCH_REPORT_LIVE_POLL_STATUS = {
  STOPPED: "stopped",
  ACTIVE: "active",
} as const;

export type MatchReportLivePollState =
  | { status: typeof MATCH_REPORT_LIVE_POLL_STATUS.STOPPED }
  | {
      status: typeof MATCH_REPORT_LIVE_POLL_STATUS.ACTIVE;
      interval_id: ReturnType<typeof setInterval>;
    };

export const MATCH_REPORT_LOADING_STATE: MatchReportPageStatusState = {
  status: MATCH_REPORT_PAGE_STATUS.LOADING,
};

export const MATCH_REPORT_READY_STATE: MatchReportPageStatusState = {
  status: MATCH_REPORT_PAGE_STATUS.READY,
};

export function create_match_report_failed_state(
  message: string,
): MatchReportPageStatusState {
  return { status: MATCH_REPORT_PAGE_STATUS.FAILED, message };
}

export function stop_match_report_live_poll(
  live_poll_state: MatchReportLivePollState,
): MatchReportLivePollState {
  switch (live_poll_state.status) {
    case MATCH_REPORT_LIVE_POLL_STATUS.ACTIVE:
      clearInterval(live_poll_state.interval_id);
      return { status: MATCH_REPORT_LIVE_POLL_STATUS.STOPPED };
    case MATCH_REPORT_LIVE_POLL_STATUS.STOPPED:
      return live_poll_state;
  }
}
