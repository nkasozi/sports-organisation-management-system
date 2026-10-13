import { is_string } from "./value_guards";

export const BOOTSTRAP_ALLOWLIST_ENVIRONMENT_VARIABLE =
  "SUPER_ADMIN_BOOTSTRAP_EMAILS";

export const BOOTSTRAP_ALLOWLIST_NOT_CONFIGURED_MESSAGE = `Super admin bootstrap is disabled. Set the ${BOOTSTRAP_ALLOWLIST_ENVIRONMENT_VARIABLE} environment variable on the Convex deployment to a comma separated list of verified emails allowed to become the first super admin.`;

export const BootstrapAllowlistKind = {
  CONFIGURED: "configured",
  NOT_CONFIGURED: "not_configured",
} as const;

export type BootstrapAllowlist =
  | {
      kind: typeof BootstrapAllowlistKind.CONFIGURED;
      emails: readonly string[];
    }
  | { kind: typeof BootstrapAllowlistKind.NOT_CONFIGURED };

const ALLOWLIST_SEPARATOR = ",";

export function parse_bootstrap_allowlist(
  raw_allowlist: unknown,
): BootstrapAllowlist {
  const emails = is_string(raw_allowlist)
    ? raw_allowlist
        .split(ALLOWLIST_SEPARATOR)
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0)
    : [];
  return emails.length > 0
    ? { kind: BootstrapAllowlistKind.CONFIGURED, emails }
    : { kind: BootstrapAllowlistKind.NOT_CONFIGURED };
}

export function read_bootstrap_allowlist_from_environment(): BootstrapAllowlist {
  return parse_bootstrap_allowlist(
    process.env[BOOTSTRAP_ALLOWLIST_ENVIRONMENT_VARIABLE],
  );
}

export function is_email_allowlisted(
  allowlist: BootstrapAllowlist,
  email: string,
): boolean {
  switch (allowlist.kind) {
    case BootstrapAllowlistKind.CONFIGURED:
      return allowlist.emails.includes(email.trim().toLowerCase());
    case BootstrapAllowlistKind.NOT_CONFIGURED:
      return false;
  }
}
