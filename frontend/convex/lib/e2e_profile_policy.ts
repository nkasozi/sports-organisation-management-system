import { is_string } from "./value_guards";

export const E2E_PROFILES_ENVIRONMENT_VARIABLE = "E2E_PROFILES_ENABLED";
export const E2E_PROFILES_ENABLED_VALUE = "true";
export const E2E_PROFILE_EMAIL_SUFFIX = "+clerk_test@example.com";

export const E2E_PROFILE_ROLES = [
  "super_admin",
  "org_admin",
  "officials_manager",
  "team_manager",
  "official",
  "player",
  "public_viewer",
] as const;

export type E2eProfileRole = (typeof E2E_PROFILE_ROLES)[number];

export const E2eProfileRejection = {
  DISABLED: "E2E profiles are disabled on this deployment",
  EMAIL_NOT_TEST: `E2E profiles must use a ${E2E_PROFILE_EMAIL_SUFFIX} address`,
  ROLE_UNKNOWN: "E2E profile role is not a known role",
} as const;

export type E2eProfileDecision =
  | { allowed: true; email: string; role: E2eProfileRole }
  | { allowed: false; reason: string };

function is_e2e_profile_role(role: string): role is E2eProfileRole {
  return E2E_PROFILE_ROLES.some((known_role) => known_role === role);
}

export function decide_e2e_profile(command: {
  enabled_flag: unknown;
  email: string;
  role: string;
}): E2eProfileDecision {
  const email = command.email.trim().toLowerCase();
  const is_enabled =
    is_string(command.enabled_flag) &&
    command.enabled_flag === E2E_PROFILES_ENABLED_VALUE;
  if (!is_enabled)
    return { allowed: false, reason: E2eProfileRejection.DISABLED };
  if (!email.endsWith(E2E_PROFILE_EMAIL_SUFFIX))
    return { allowed: false, reason: E2eProfileRejection.EMAIL_NOT_TEST };
  if (!is_e2e_profile_role(command.role))
    return { allowed: false, reason: E2eProfileRejection.ROLE_UNKNOWN };
  return { allowed: true, email, role: command.role };
}
