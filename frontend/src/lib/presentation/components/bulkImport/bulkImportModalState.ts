import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import type { BulkImportResult } from "$lib/presentation/logic/bulkImportTypes";

export const BULK_IMPORT_MODAL_STEP = {
  DOWNLOAD: "download",
  UPLOAD: "upload",
  PROCESSING: "processing",
  RESULTS: "results",
  FAILED: "failed",
} as const;

export const BULK_IMPORT_FILE_SELECTION_STATUS = {
  EMPTY: "empty",
  SELECTED: "selected",
} as const;

export const BULK_IMPORT_MESSAGES = {
  FILE_READ_FAILED:
    "We couldn't read that file. Please check it is a CSV file and try again.",
  FAILED_TITLE: "Import failed",
  START_OVER: "Start Over",
} as const;

export const BULK_IMPORT_FILE_NAME_SUFFIX = {
  TEMPLATE: "_import_template.csv",
  FAILURES: "_import_failures.csv",
} as const;

const BULK_IMPORT_FILE_READ_FAILED_EVENT = "bulk_import_file_read_failed";

export type BulkImportFileSelection =
  | { status: typeof BULK_IMPORT_FILE_SELECTION_STATUS.EMPTY }
  | { status: typeof BULK_IMPORT_FILE_SELECTION_STATUS.SELECTED; file: File };

export interface BulkImportSummaryState {
  failure_count: number;
  success_count: number;
  import_results: BulkImportResult[];
}

export type BulkImportModalState =
  | { step: typeof BULK_IMPORT_MODAL_STEP.DOWNLOAD }
  | {
      step: typeof BULK_IMPORT_MODAL_STEP.UPLOAD;
      selection: BulkImportFileSelection;
    }
  | { step: typeof BULK_IMPORT_MODAL_STEP.PROCESSING }
  | ({ step: typeof BULK_IMPORT_MODAL_STEP.RESULTS } & BulkImportSummaryState)
  | { step: typeof BULK_IMPORT_MODAL_STEP.FAILED; message: string };

export const INITIAL_BULK_IMPORT_MODAL_STATE: BulkImportModalState = {
  step: BULK_IMPORT_MODAL_STEP.DOWNLOAD,
};

export const EMPTY_UPLOAD_STATE: BulkImportModalState = {
  step: BULK_IMPORT_MODAL_STEP.UPLOAD,
  selection: { status: BULK_IMPORT_FILE_SELECTION_STATUS.EMPTY },
};

export function select_bulk_import_file(
  files: ArrayLike<File>,
): BulkImportModalState {
  if (files.length === 0) return EMPTY_UPLOAD_STATE;
  return {
    step: BULK_IMPORT_MODAL_STEP.UPLOAD,
    selection: {
      status: BULK_IMPORT_FILE_SELECTION_STATUS.SELECTED,
      file: files[0],
    },
  };
}

export function build_bulk_import_results_state(
  summary: BulkImportSummaryState,
): BulkImportModalState {
  return {
    step: BULK_IMPORT_MODAL_STEP.RESULTS,
    failure_count: summary.failure_count,
    success_count: summary.success_count,
    import_results: summary.import_results,
  };
}

export async function read_bulk_import_file(file: File): AsyncResult<string> {
  try {
    return create_success_result(await file.text());
  } catch (error) {
    console.error("[BulkImport] Failed to read import file", {
      event: BULK_IMPORT_FILE_READ_FAILED_EVENT,
      error: String(error),
    });
    return create_failure_result(BULK_IMPORT_MESSAGES.FILE_READ_FAILED);
  }
}
