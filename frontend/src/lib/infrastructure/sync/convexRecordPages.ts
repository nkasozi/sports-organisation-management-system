import { type Option, OptionStatus } from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import {
  is_record_value,
  is_string_value,
} from "$lib/infrastructure/utils/runtimeTypeGuards";

export type ConvexRecordQuery = (
  name: string,
  args: Record<string, unknown>,
) => Promise<unknown>;

interface ReadAllRecordPagesCommand {
  convex_query: ConvexRecordQuery;
  table_name: string;
  organization_scope: Option<string>;
}

type RemoteRecord = Record<string, unknown>;

interface RecordPage {
  records: RemoteRecord[];
  next_cursor: string;
  has_more: boolean;
}

const RECORDS_PAGE_QUERY_NAME = "sync:get_records_page";
const RECORDS_PAGE_SIZE = 200;
const FIRST_PAGE_CURSOR = "";
const INVALID_PAGE_ERROR = "Invalid record page response";
const STALLED_CURSOR_ERROR = "Record page cursor did not advance";
const BOOLEAN_TYPE_NAME = "boolean";
const RECORD_PAGE_FAILED_EVENT = "convex_record_page_read_failed";

function build_page_arguments(
  command: ReadAllRecordPagesCommand,
  after_local_id: string,
): Record<string, unknown> {
  const organization_arguments =
    command.organization_scope.status === OptionStatus.SOME
      ? { organization_id: command.organization_scope.value }
      : {};
  return {
    table_name: command.table_name,
    ...organization_arguments,
    after_local_id,
    page_size: RECORDS_PAGE_SIZE,
  };
}

function read_page_error(page: Record<string, unknown>): string {
  return is_string_value(page.error) && page.error.length > 0
    ? page.error
    : INVALID_PAGE_ERROR;
}

function parse_record_page(response: unknown): Result<RecordPage> {
  if (!is_record_value(response))
    return create_failure_result(INVALID_PAGE_ERROR);
  if (response.success !== true)
    return create_failure_result(read_page_error(response));
  const is_valid_page =
    Array.isArray(response.records) &&
    is_string_value(response.next_cursor) &&
    typeof response.has_more === BOOLEAN_TYPE_NAME;
  return is_valid_page
    ? create_success_result({
        records: response.records as RemoteRecord[],
        next_cursor: response.next_cursor as string,
        has_more: response.has_more as boolean,
      })
    : create_failure_result(INVALID_PAGE_ERROR);
}

async function fetch_record_page(
  command: ReadAllRecordPagesCommand,
  after_local_id: string,
): AsyncResult<RecordPage> {
  try {
    return parse_record_page(
      await command.convex_query(
        RECORDS_PAGE_QUERY_NAME,
        build_page_arguments(command, after_local_id),
      ),
    );
  } catch (error) {
    return create_failure_result(
      error instanceof Error ? error.message : String(error),
    );
  }
}

function log_page_failure(
  command: ReadAllRecordPagesCommand,
  after_local_id: string,
  error: string,
): Result<never> {
  console.warn("[RecordPages] Failed to read a record page", {
    event: RECORD_PAGE_FAILED_EVENT,
    table_name: command.table_name,
    has_organization_scope:
      command.organization_scope.status === OptionStatus.SOME,
    after_local_id,
    error,
  });
  return create_failure_result(error);
}

function is_cursor_stalled(page: RecordPage, after_local_id: string): boolean {
  return page.has_more && page.next_cursor === after_local_id;
}

export async function read_all_record_pages(
  command: ReadAllRecordPagesCommand,
): AsyncResult<RemoteRecord[]> {
  const records: RemoteRecord[] = [];
  let after_local_id = FIRST_PAGE_CURSOR;
  for (;;) {
    const page = await fetch_record_page(command, after_local_id);
    if (!page.success)
      return log_page_failure(command, after_local_id, page.error);
    records.push(...page.data.records);
    if (!page.data.has_more) return create_success_result(records);
    if (is_cursor_stalled(page.data, after_local_id))
      return log_page_failure(command, after_local_id, STALLED_CURSOR_ERROR);
    after_local_id = page.data.next_cursor;
  }
}
