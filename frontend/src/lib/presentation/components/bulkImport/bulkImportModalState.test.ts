import { describe, expect, it } from "vitest";

import type { BulkImportResult } from "$lib/presentation/logic/bulkImportTypes";

import {
  build_bulk_import_results_state,
  BULK_IMPORT_FILE_SELECTION_STATUS,
  BULK_IMPORT_MESSAGES,
  BULK_IMPORT_MODAL_STEP,
  INITIAL_BULK_IMPORT_MODAL_STATE,
  read_bulk_import_file,
  select_bulk_import_file,
} from "./bulkImportModalState";

const RESULT_ROW: BulkImportResult = {
  error_message: "",
  original_data: {},
  row_number: 2,
  success: true,
};

function create_file(text_reader: () => Promise<string>): File {
  return { text: text_reader } as unknown as File;
}

describe("bulk import modal state", () => {
  it("starts on the download step", () => {
    expect(INITIAL_BULK_IMPORT_MODAL_STATE).toEqual({
      step: BULK_IMPORT_MODAL_STEP.DOWNLOAD,
    });
  });

  it("selecting a file moves to the upload step holding that file", () => {
    const file = create_file(async () => "csv");
    expect(select_bulk_import_file([file])).toEqual({
      step: BULK_IMPORT_MODAL_STEP.UPLOAD,
      selection: { status: BULK_IMPORT_FILE_SELECTION_STATUS.SELECTED, file },
    });
  });

  it("selecting nothing keeps the upload step with no file", () => {
    expect(select_bulk_import_file([])).toEqual({
      step: BULK_IMPORT_MODAL_STEP.UPLOAD,
      selection: { status: BULK_IMPORT_FILE_SELECTION_STATUS.EMPTY },
    });
  });

  it("builds the results state from a summary", () => {
    expect(
      build_bulk_import_results_state({
        failure_count: 0,
        success_count: 1,
        import_results: [RESULT_ROW],
      }),
    ).toEqual({
      step: BULK_IMPORT_MODAL_STEP.RESULTS,
      failure_count: 0,
      success_count: 1,
      import_results: [RESULT_ROW],
    });
  });

  it("reads file contents as a success result", async () => {
    const result = await read_bulk_import_file(create_file(async () => "a,b"));
    expect(result).toEqual({ success: true, data: "a,b" });
  });

  it("returns a friendly failure when the file cannot be read", async () => {
    const result = await read_bulk_import_file(
      create_file(async () => Promise.reject(new Error("disk gone"))),
    );
    expect(result).toEqual({
      success: false,
      error: BULK_IMPORT_MESSAGES.FILE_READ_FAILED,
    });
  });
});
