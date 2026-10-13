import { create_none_option, create_some_option, type Option } from "./option";
import { SecurityEventType } from "./security_event_types";

export const SyncWriteStatus = {
  ALLOWED: "allowed",
  REJECTED: "rejected",
} as const;

export const SyncWriteRejection = {
  INVALID_URL: "rejected_invalid_url",
  WRONG_ORGANIZATION: "rejected_wrong_organization",
  PRIVILEGE_CHANGE: "rejected_privilege_change",
  MISSING_EMAIL: "skipped_no_email",
  PERMISSION_DENIED: "rejected_permission_denied",
  OUTSIDE_CALLER_SCOPE: "rejected_outside_caller_scope",
  VERIFICATION_CHANGE: "rejected_verification_change",
} as const;

export type SyncWriteRejectionValue =
  (typeof SyncWriteRejection)[keyof typeof SyncWriteRejection];

export type SyncWriteDecision =
  | {
      status: typeof SyncWriteStatus.ALLOWED;
      record_data: Record<string, unknown>;
    }
  | {
      status: typeof SyncWriteStatus.REJECTED;
      rejection: SyncWriteRejectionValue;
      reason: string;
    };

export const SYNC_WRITE_REJECTION_MESSAGES: Record<
  SyncWriteRejectionValue,
  string
> = {
  [SyncWriteRejection.INVALID_URL]:
    "Record contains a URL with a disallowed protocol",
  [SyncWriteRejection.WRONG_ORGANIZATION]:
    "Record organization does not match caller organization",
  [SyncWriteRejection.PRIVILEGE_CHANGE]: "Access denied",
  [SyncWriteRejection.MISSING_EMAIL]: "System user records require an email",
  [SyncWriteRejection.PERMISSION_DENIED]: "Access denied",
  [SyncWriteRejection.OUTSIDE_CALLER_SCOPE]:
    "Record is outside the records this account may change",
  [SyncWriteRejection.VERIFICATION_CHANGE]:
    "Only administrators can change verification status",
};

export function get_audit_event_type_for_rejection(
  rejection: SyncWriteRejectionValue,
): Option<string> {
  switch (rejection) {
    case SyncWriteRejection.WRONG_ORGANIZATION:
      return create_some_option<string>(SecurityEventType.ORG_SCOPE_VIOLATION);
    case SyncWriteRejection.PRIVILEGE_CHANGE:
    case SyncWriteRejection.VERIFICATION_CHANGE:
      return create_some_option<string>(
        SecurityEventType.ROLE_ESCALATION_BLOCKED,
      );
    case SyncWriteRejection.PERMISSION_DENIED:
    case SyncWriteRejection.OUTSIDE_CALLER_SCOPE:
      return create_some_option<string>(SecurityEventType.ACCESS_DENIED);
    case SyncWriteRejection.INVALID_URL:
    case SyncWriteRejection.MISSING_EMAIL:
      return create_none_option();
  }
}

export function allow_sync_write(
  record_data: Record<string, unknown>,
): SyncWriteDecision {
  return { status: SyncWriteStatus.ALLOWED, record_data };
}

export function reject_sync_write(
  rejection: SyncWriteRejectionValue,
  reason: string,
): SyncWriteDecision {
  return { status: SyncWriteStatus.REJECTED, rejection, reason };
}
