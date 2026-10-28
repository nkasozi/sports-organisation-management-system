export const UNAUTHORIZED_REASON_CODE = {
  MISSING_EMAIL: "missing_email",
  ACCESS_DENIED: "access_denied",
  NOT_REGISTERED: "not_registered",
} as const;

type UnauthorizedReasonCode =
  (typeof UNAUTHORIZED_REASON_CODE)[keyof typeof UNAUTHORIZED_REASON_CODE];

export const UNAUTHORIZED_REASON_MESSAGE = {
  DEFAULT_DENIAL: "You don't have access to this system.",
  MISSING_EMAIL:
    "Your account has no email address. Authentication requires an email. Please contact your administrator.",
  ACCESS_DENIED:
    "Your account doesn't have access to this system yet. Please contact your organization administrator.",
  NOT_REGISTERED:
    "The email you signed in with isn't registered in this system, so you were signed out. Ask your organization administrator to add you, then sign in again.",
} as const;

const UNAUTHORIZED_REASON_QUERY_PARAMETER = "reason";

const UNAUTHORIZED_PATH = "/unauthorized";

const KNOWN_REASON_CODES: ReadonlySet<string> = new Set(
  Object.values(UNAUTHORIZED_REASON_CODE),
);

export function build_unauthorized_reason_path(
  reason_code: UnauthorizedReasonCode,
): string {
  const query = new URLSearchParams({
    [UNAUTHORIZED_REASON_QUERY_PARAMETER]: reason_code,
  });
  return `${UNAUTHORIZED_PATH}?${query.toString()}`;
}

function describe_reason_code(reason_code: UnauthorizedReasonCode): string {
  switch (reason_code) {
    case UNAUTHORIZED_REASON_CODE.MISSING_EMAIL:
      return UNAUTHORIZED_REASON_MESSAGE.MISSING_EMAIL;
    case UNAUTHORIZED_REASON_CODE.ACCESS_DENIED:
      return UNAUTHORIZED_REASON_MESSAGE.ACCESS_DENIED;
    case UNAUTHORIZED_REASON_CODE.NOT_REGISTERED:
      return UNAUTHORIZED_REASON_MESSAGE.NOT_REGISTERED;
  }
}

function is_known_reason_code(value: string): value is UnauthorizedReasonCode {
  return KNOWN_REASON_CODES.has(value);
}

export function resolve_unauthorized_reason_message(
  search_params: URLSearchParams,
): string {
  const reason_value =
    search_params.get(UNAUTHORIZED_REASON_QUERY_PARAMETER) ?? "";
  return is_known_reason_code(reason_value)
    ? describe_reason_code(reason_value)
    : UNAUTHORIZED_REASON_MESSAGE.DEFAULT_DENIAL;
}
