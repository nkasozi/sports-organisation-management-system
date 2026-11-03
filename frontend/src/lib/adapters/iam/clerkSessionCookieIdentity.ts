import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import { base64_url_decode } from "$lib/infrastructure/utils/JwtTokenUtils";

const CLERK_SESSION_COOKIE_NAME = "__session";
const CLERK_SESSION_COOKIE_SUFFIX_PREFIX = "__session_";
const COOKIE_PAIR_SEPARATOR = ";";
const COOKIE_NAME_VALUE_SEPARATOR = "=";
const TOKEN_SEGMENT_SEPARATOR = ".";
const TOKEN_PAYLOAD_SEGMENT_INDEX = 1;
const STRING_TYPE_NAME = "string";
const SESSION_COOKIE_UNREADABLE_EVENT = "clerk_session_cookie_unreadable";

export interface ClerkSessionCookieIdentity {
  user_id: string;
  session_id: string;
}

function is_session_cookie_name(cookie_name: string): boolean {
  return (
    cookie_name === CLERK_SESSION_COOKIE_NAME ||
    cookie_name.startsWith(CLERK_SESSION_COOKIE_SUFFIX_PREFIX)
  );
}

function find_session_token(cookie_header: string): Option<string> {
  for (const cookie_pair of cookie_header.split(COOKIE_PAIR_SEPARATOR)) {
    const separator_index = cookie_pair.indexOf(COOKIE_NAME_VALUE_SEPARATOR);
    const cookie_name = cookie_pair.slice(0, separator_index).trim();
    if (separator_index > 0 && is_session_cookie_name(cookie_name))
      return create_some_option(cookie_pair.slice(separator_index + 1).trim());
  }
  return create_none_option();
}

function is_non_empty_text(value: unknown): value is string {
  return typeof value === STRING_TYPE_NAME && (value as string).length > 0;
}

function decode_token_identity(
  session_token: string,
): Option<ClerkSessionCookieIdentity> {
  try {
    const payload_segment = session_token.split(TOKEN_SEGMENT_SEPARATOR)[
      TOKEN_PAYLOAD_SEGMENT_INDEX
    ];
    const claims = JSON.parse(base64_url_decode(payload_segment)) as Record<
      string,
      unknown
    >;
    if (!is_non_empty_text(claims.sub) || !is_non_empty_text(claims.sid))
      return create_none_option();
    return create_some_option({ user_id: claims.sub, session_id: claims.sid });
  } catch (error) {
    console.warn("[Clerk] Session cookie could not be read", {
      event: SESSION_COOKIE_UNREADABLE_EVENT,
      error: String(error),
    });
    return create_none_option();
  }
}

export function read_clerk_session_cookie_identity(
  cookie_header: string,
): Option<ClerkSessionCookieIdentity> {
  const session_token = find_session_token(cookie_header);
  if (session_token.status !== OptionStatus.SOME) return create_none_option();
  return decode_token_identity(session_token.value);
}
