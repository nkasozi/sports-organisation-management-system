import type { CallerScope } from "./caller_scope";

export const SystemUserChangeKind = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export const SystemUserChangeStatus = {
  ALLOWED: "allowed",
  REJECTED: "rejected",
} as const;

export const SystemUserChangeRejection = {
  ROLE_NOT_ASSIGNABLE: "role_not_assignable",
  TARGET_NOT_BELOW_CALLER: "target_not_below_caller",
  SELF_PRIVILEGE_CHANGE: "self_privilege_change",
  GLOBAL_SCOPE_RESERVED: "global_scope_reserved",
  ORGANIZATION_OUTSIDE_SCOPE: "organization_outside_scope",
  LAST_SUPER_ADMIN: "last_super_admin",
  DUPLICATE_EMAIL: "duplicate_email",
  IDENTITY_CHANGE: "identity_change",
} as const;

export type SystemUserChangeRejectionValue =
  (typeof SystemUserChangeRejection)[keyof typeof SystemUserChangeRejection];

export interface SystemUserSnapshot {
  email: string;
  role: string;
  organization_id: string;
  status: string;
}

export type SystemUserChange =
  | {
      kind: typeof SystemUserChangeKind.CREATE;
      requested: SystemUserSnapshot;
      email_already_registered: boolean;
    }
  | {
      kind: typeof SystemUserChangeKind.UPDATE;
      current: SystemUserSnapshot;
      requested: SystemUserSnapshot;
    }
  | { kind: typeof SystemUserChangeKind.DELETE; current: SystemUserSnapshot };

export interface SystemUserChangeCommand {
  caller: SystemUserSnapshot;
  caller_scope: CallerScope;
  change: SystemUserChange;
  active_super_admin_count: number;
}

export type SystemUserChangeDecision =
  | { status: typeof SystemUserChangeStatus.ALLOWED }
  | {
      status: typeof SystemUserChangeStatus.REJECTED;
      rejection: SystemUserChangeRejectionValue;
    };
