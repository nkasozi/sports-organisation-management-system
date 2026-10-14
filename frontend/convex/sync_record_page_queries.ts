import { v } from "convex/values";

import { query, type QueryCtx } from "./_generated/server";
import { require_auth, type SystemUserRecord } from "./lib/auth_middleware";
import { CallerScopeKind, resolve_caller_scope } from "./lib/caller_scope";
import {
  ConvexErrorCode,
  type ConvexFailure,
  log_convex_failure,
  NO_ERROR_MESSAGE,
} from "./lib/convex_errors";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./lib/option";
import {
  ORGANIZATIONS_TABLE_NAME,
  select_public_rows,
} from "./lib/public_read_support";
import { read_raw_record_page } from "./lib/record_page_reader";
import {
  clamp_change_page_size,
  DEFAULT_CHANGE_PAGE_SIZE,
} from "./lib/sync_change_feed";
import { authorize_records_for_reader } from "./lib/sync_read_authorization";
import {
  type AllowedSyncTable,
  is_global_table,
  is_public_table,
  validate_table_name,
} from "./lib/sync_validation";
import { strip_convex_fields } from "./sync_record_helpers";

const FIRST_LOCAL_ID = "";
const PUBLIC_PAGE_REJECTED_EVENT = "public_record_page_rejected";

interface RecordPageArguments {
  table_name: AllowedSyncTable;
  organization_id: Option<string>;
  after_local_id: string;
  page_size: number;
}

type RecordPageResponse =
  | {
      success: true;
      error: typeof NO_ERROR_MESSAGE;
      records: Array<Record<string, unknown>>;
      next_cursor: string;
      has_more: boolean;
    }
  | (ConvexFailure & {
      records: Array<Record<string, unknown>>;
      next_cursor: string;
      has_more: false;
    });

function build_failed_page(
  failure: ConvexFailure,
  after_local_id: string,
): RecordPageResponse {
  return {
    ...failure,
    records: [],
    next_cursor: after_local_id,
    has_more: false,
  };
}

function read_caller_organization(caller: SystemUserRecord): Option<string> {
  const caller_scope = resolve_caller_scope(caller);
  return caller_scope.kind === CallerScopeKind.ORGANIZATION
    ? create_some_option(caller_scope.organization_id)
    : create_none_option();
}

async function read_authenticated_page(
  ctx: QueryCtx,
  caller: SystemUserRecord,
  page_arguments: RecordPageArguments,
): Promise<RecordPageResponse> {
  const raw_page = await read_raw_record_page(ctx, {
    ...page_arguments,
    organization_id: read_caller_organization(caller),
  });
  const visible = await authorize_records_for_reader(ctx, {
    caller,
    table_name: page_arguments.table_name,
    records: raw_page.rows,
  });
  return {
    success: true,
    error: NO_ERROR_MESSAGE,
    records: visible.map(strip_convex_fields),
    next_cursor: raw_page.next_cursor,
    has_more: raw_page.has_more,
  };
}

function is_public_page_allowed(page_arguments: RecordPageArguments): boolean {
  if (!is_public_table(page_arguments.table_name)) return false;
  return (
    is_global_table(page_arguments.table_name) ||
    page_arguments.table_name === ORGANIZATIONS_TABLE_NAME ||
    page_arguments.organization_id.status === OptionStatus.SOME
  );
}

async function read_public_page(
  ctx: QueryCtx,
  page_arguments: RecordPageArguments,
): Promise<RecordPageResponse> {
  if (!is_public_page_allowed(page_arguments))
    return build_failed_page(
      log_convex_failure(ConvexErrorCode.INVALID_REQUEST, {
        event: PUBLIC_PAGE_REJECTED_EVENT,
        table_name: page_arguments.table_name,
      }),
      page_arguments.after_local_id,
    );
  const raw_page = await read_raw_record_page(ctx, page_arguments);
  return {
    success: true,
    error: NO_ERROR_MESSAGE,
    records: (
      await select_public_rows(ctx, {
        ...page_arguments,
        rows: raw_page.rows,
      })
    ).map(strip_convex_fields),
    next_cursor: raw_page.next_cursor,
    has_more: raw_page.has_more,
  };
}

function read_optional_text(value: string | undefined): Option<string> {
  const trimmed = (value ?? FIRST_LOCAL_ID).trim();
  return trimmed ? create_some_option(trimmed) : create_none_option();
}

export const get_records_page = query({
  args: {
    table_name: v.string(),
    organization_id: v.optional(v.string()),
    after_local_id: v.optional(v.string()),
    page_size: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<RecordPageResponse> => {
    const after_local_id = args.after_local_id ?? FIRST_LOCAL_ID;
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return build_failed_page(table_validation, after_local_id);
    const page_arguments: RecordPageArguments = {
      table_name: table_validation.data,
      organization_id: read_optional_text(args.organization_id),
      after_local_id,
      page_size: clamp_change_page_size(
        args.page_size ?? DEFAULT_CHANGE_PAGE_SIZE,
      ),
    };
    const auth_result = await require_auth(ctx);
    return auth_result.success
      ? read_authenticated_page(ctx, auth_result.data, page_arguments)
      : read_public_page(ctx, page_arguments);
  },
});
