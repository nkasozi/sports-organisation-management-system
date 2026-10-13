import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { download_match_report_for_fixture } from "$lib/presentation/logic/matchReportPageDownload";
import { load_match_report_page_data } from "$lib/presentation/logic/matchReportPageLoad";
import { build_match_report_download_request } from "$lib/presentation/logic/matchReportPageTransitions";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import {
  download_match_report_for_page,
  load_match_report_page,
  MATCH_REPORT_DOWNLOAD_OUTCOME,
} from "./matchReportPageActions";
import { MATCH_REPORT_PAGE_TEXT } from "./matchReportPageMessages";
import { MATCH_REPORT_PAGE_STATUS } from "./matchReportPageStatus";

vi.mock("$lib/presentation/logic/matchReportPageDependencies", () => ({
  match_report_page_dependencies: {},
}));
vi.mock("$lib/presentation/logic/matchReportPageLoad", () => ({
  load_match_report_page_data: vi.fn(),
}));
vi.mock("$lib/presentation/logic/matchReportPageDownload", () => ({
  download_match_report_for_fixture: vi.fn(),
}));
vi.mock("$lib/presentation/logic/matchReportPageTransitions", () => ({
  build_match_report_download_request: vi.fn(),
}));

const MISSING_DATA = { status: PRESENCE_STATUS.MISSING } as const;

describe("load_match_report_page", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => true);
  });

  it("fails with a friendly message when the fixture id is missing", async () => {
    const outcome = await load_match_report_page("", MISSING_DATA);

    expect(outcome.page_status_state).toEqual({
      status: MATCH_REPORT_PAGE_STATUS.FAILED,
      message: MATCH_REPORT_PAGE_TEXT.missing_fixture_id,
    });
  });

  it("hides technical load errors from the user", async () => {
    vi.mocked(load_match_report_page_data).mockResolvedValue(
      create_failure_result("Dexie: table missing"),
    );

    const outcome = await load_match_report_page("fixture-1", MISSING_DATA);

    expect(outcome.page_status_state).toEqual({
      status: MATCH_REPORT_PAGE_STATUS.FAILED,
      message: MATCH_REPORT_PAGE_TEXT.load_failed,
    });
    expect(outcome.page_data_state).toBe(MISSING_DATA);
  });
});

describe("download_match_report_for_page", () => {
  it("skips when there is nothing to download", async () => {
    vi.mocked(build_match_report_download_request).mockReturnValue(
      create_failure_result("missing"),
    );

    const outcome = await download_match_report_for_page(MISSING_DATA, "", "f");

    expect(outcome).toEqual({ status: MATCH_REPORT_DOWNLOAD_OUTCOME.SKIPPED });
  });

  it("returns a friendly failure message when the download fails", async () => {
    vi.mocked(build_match_report_download_request).mockReturnValue(
      create_success_result({} as never),
    );
    vi.mocked(download_match_report_for_fixture).mockResolvedValue(
      create_failure_result("jsPDF crashed"),
    );

    const outcome = await download_match_report_for_page(MISSING_DATA, "", "f");

    expect(outcome).toEqual({
      status: MATCH_REPORT_DOWNLOAD_OUTCOME.FAILED,
      message: MATCH_REPORT_PAGE_TEXT.download_failed,
    });
  });
});
