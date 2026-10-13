import { get_app_settings_storage } from "$lib/infrastructure/container";

const SESSION_SYNC_KEY = "sports_org_session_synced";
export const VERIFIED_SESSION_SYNC_MODE = "verified";
export const VERIFIED_USER_SESSION_SYNC_MODE = "verified_user";
export const ANONYMOUS_SESSION_SYNC_MODE = "anonymous";

const LEGACY_SESSION_SYNC_MARKER_VALUE = "true";
const STRING_TYPE_NAME = "string";
const SESSION_SYNC_MARKER_PARSE_FAILED_EVENT =
  "session_sync_marker_parse_failed";

export const SESSION_SYNC_STATE_STATUS = {
  MISSING: "missing",
  LEGACY: "legacy",
  ANONYMOUS: "anonymous",
  VERIFIED_SESSION: "verified_session",
  VERIFIED_USER: "verified_user",
} as const;

const STATE_STATUS = SESSION_SYNC_STATE_STATUS;

export type SessionSyncState =
  | { status: typeof STATE_STATUS.MISSING }
  | { status: typeof STATE_STATUS.LEGACY }
  | { status: typeof STATE_STATUS.ANONYMOUS }
  | { status: typeof STATE_STATUS.VERIFIED_SESSION; session_id: string }
  | {
      status: typeof STATE_STATUS.VERIFIED_USER;
      session_id: string;
      user_id: string;
    };

interface AnonymousSessionSyncMarker {
  mode: typeof ANONYMOUS_SESSION_SYNC_MODE;
}

interface LegacyVerifiedSessionSyncMarker {
  mode: typeof VERIFIED_SESSION_SYNC_MODE;
  session_id: string;
}

interface VerifiedUserSessionSyncMarker {
  mode: typeof VERIFIED_USER_SESSION_SYNC_MODE;
  session_id: string;
  user_id: string;
}

export type StoredSessionSyncMarker =
  | AnonymousSessionSyncMarker
  | LegacyVerifiedSessionSyncMarker
  | VerifiedUserSessionSyncMarker;

function create_missing_session_sync_state(): SessionSyncState {
  return { status: STATE_STATUS.MISSING };
}

export function is_non_empty_marker_identifier(
  value: unknown,
): value is string {
  return typeof value === STRING_TYPE_NAME && (value as string).length > 0;
}

function parse_verified_user_marker(
  parsed_marker: Record<string, unknown>,
): SessionSyncState {
  if (
    !is_non_empty_marker_identifier(parsed_marker.session_id) ||
    !is_non_empty_marker_identifier(parsed_marker.user_id)
  )
    return create_missing_session_sync_state();
  return {
    status: STATE_STATUS.VERIFIED_USER,
    session_id: parsed_marker.session_id,
    user_id: parsed_marker.user_id,
  };
}

function parse_stored_session_sync_marker(
  parsed_marker: Record<string, unknown>,
): SessionSyncState {
  switch (parsed_marker.mode) {
    case ANONYMOUS_SESSION_SYNC_MODE:
      return { status: STATE_STATUS.ANONYMOUS };
    case VERIFIED_USER_SESSION_SYNC_MODE:
      return parse_verified_user_marker(parsed_marker);
    case VERIFIED_SESSION_SYNC_MODE:
      return is_non_empty_marker_identifier(parsed_marker.session_id)
        ? {
            status: STATE_STATUS.VERIFIED_SESSION,
            session_id: parsed_marker.session_id,
          }
        : create_missing_session_sync_state();
    default:
      return create_missing_session_sync_state();
  }
}

function parse_session_sync_state(raw_value: string): SessionSyncState {
  if (raw_value.length === 0) return create_missing_session_sync_state();
  if (raw_value === LEGACY_SESSION_SYNC_MARKER_VALUE)
    return { status: STATE_STATUS.LEGACY };
  try {
    return parse_stored_session_sync_marker(
      JSON.parse(raw_value) as Record<string, unknown>,
    );
  } catch (error) {
    console.warn("[InitialSync] Failed to parse session sync marker", {
      event: SESSION_SYNC_MARKER_PARSE_FAILED_EVENT,
      error: String(error),
    });
    return create_missing_session_sync_state();
  }
}

export function build_anonymous_session_sync_marker(): AnonymousSessionSyncMarker {
  return { mode: ANONYMOUS_SESSION_SYNC_MODE };
}

export function build_verified_session_sync_marker(
  session_id: string,
): LegacyVerifiedSessionSyncMarker {
  return { mode: VERIFIED_SESSION_SYNC_MODE, session_id };
}

export function build_verified_user_session_sync_marker(
  session_id: string,
  user_id: string,
): VerifiedUserSessionSyncMarker {
  return { mode: VERIFIED_USER_SESSION_SYNC_MODE, session_id, user_id };
}

export async function read_session_sync_state_from_storage(): Promise<SessionSyncState> {
  const raw_session_sync_state =
    await get_app_settings_storage().get_setting(SESSION_SYNC_KEY);

  return parse_session_sync_state(raw_session_sync_state);
}

export async function write_session_sync_marker(
  marker: StoredSessionSyncMarker,
): Promise<boolean> {
  await get_app_settings_storage().set_setting(
    SESSION_SYNC_KEY,
    JSON.stringify(marker),
  );
  return true;
}

export async function remove_session_sync_marker(): Promise<boolean> {
  await get_app_settings_storage().remove_setting(SESSION_SYNC_KEY);
  return true;
}
