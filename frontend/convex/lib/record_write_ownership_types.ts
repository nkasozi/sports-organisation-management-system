import { ParentWriteRejection } from "./parent_scoped_write_ownership";

export const WriteOwnershipStatus = {
  ALLOWED: "allowed",
  REJECTED: "rejected",
} as const;

export const WriteOwnershipRejection = {
  CALLER_WITHOUT_SCOPE: "caller_without_scope",
  EXISTING_RECORD_FOREIGN: "existing_record_foreign",
  EXISTING_RECORD_SHARED: "existing_record_shared",
  INCOMING_RECORD_FOREIGN: "incoming_record_foreign",
  INCOMING_RECORD_GLOBAL: "incoming_record_global",
  ORGANIZATION_IDENTITY_FOREIGN: "organization_identity_foreign",
  ...ParentWriteRejection,
} as const;

export type WriteOwnershipRejectionValue =
  (typeof WriteOwnershipRejection)[keyof typeof WriteOwnershipRejection];

export type WriteOwnershipDecision =
  | {
      status: typeof WriteOwnershipStatus.ALLOWED;
      normalized_record: Record<string, unknown>;
    }
  | {
      status: typeof WriteOwnershipStatus.REJECTED;
      rejection: WriteOwnershipRejectionValue;
    };
