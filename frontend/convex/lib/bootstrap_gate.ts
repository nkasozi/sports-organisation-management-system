import {
  GLOBAL_ORGANIZATION_ID,
  SUPER_ADMIN_ROLE,
  SystemUserStatus,
} from "./system_user_constants";

export const BootstrapPhase = {
  AWAITING_FIRST_SUPER_ADMIN: "awaiting_first_super_admin",
  ORPHANED_WITHOUT_SUPER_ADMIN: "orphaned_without_super_admin",
  ESTABLISHED: "established",
} as const;

export interface SystemUserCensus {
  has_registered_users: boolean;
  active_super_admin_count: number;
}

type BootstrapState =
  | { phase: typeof BootstrapPhase.AWAITING_FIRST_SUPER_ADMIN }
  | { phase: typeof BootstrapPhase.ORPHANED_WITHOUT_SUPER_ADMIN }
  | {
      phase: typeof BootstrapPhase.ESTABLISHED;
      active_super_admin_count: number;
    };

export const SeedCallerKind = {
  ANONYMOUS: "anonymous",
  UNREGISTERED: "unregistered",
  REGISTERED: "registered",
} as const;

export type SeedCaller =
  | { kind: typeof SeedCallerKind.ANONYMOUS }
  | { kind: typeof SeedCallerKind.UNREGISTERED; email: string }
  | {
      kind: typeof SeedCallerKind.REGISTERED;
      email: string;
      role: string;
      organization_id: string;
      status: string;
    };

export const SeedDecisionStatus = {
  ALLOWED: "allowed",
  REJECTED: "rejected",
} as const;

export const SeedRejection = {
  ANONYMOUS_CALLER: "anonymous_caller",
  BOOTSTRAP_CALLER_REGISTERED: "bootstrap_caller_registered",
  BOOTSTRAP_TARGET_NOT_CALLER: "bootstrap_target_not_caller",
  CALLER_NOT_SUPER_ADMIN: "caller_not_super_admin",
  NO_ACTIVE_SUPER_ADMIN: "no_active_super_admin",
} as const;

type SeedRejectionValue = (typeof SeedRejection)[keyof typeof SeedRejection];

type SeedDecision =
  | { status: typeof SeedDecisionStatus.ALLOWED }
  | {
      status: typeof SeedDecisionStatus.REJECTED;
      rejection: SeedRejectionValue;
    };

interface SuperAdminSeedCommand {
  bootstrap: BootstrapState;
  caller: SeedCaller;
  target_email: string;
}

const ALLOWED_SEED: SeedDecision = { status: SeedDecisionStatus.ALLOWED };

function reject_seed(rejection: SeedRejectionValue): SeedDecision {
  return { status: SeedDecisionStatus.REJECTED, rejection };
}

export function resolve_bootstrap_state(
  census: SystemUserCensus,
): BootstrapState {
  if (census.active_super_admin_count > 0)
    return {
      phase: BootstrapPhase.ESTABLISHED,
      active_super_admin_count: census.active_super_admin_count,
    };
  return census.has_registered_users
    ? { phase: BootstrapPhase.ORPHANED_WITHOUT_SUPER_ADMIN }
    : { phase: BootstrapPhase.AWAITING_FIRST_SUPER_ADMIN };
}

function decide_bootstrap_claim(
  caller: SeedCaller,
  target_email: string,
): SeedDecision {
  switch (caller.kind) {
    case SeedCallerKind.ANONYMOUS:
      return reject_seed(SeedRejection.ANONYMOUS_CALLER);
    case SeedCallerKind.REGISTERED:
      return reject_seed(SeedRejection.BOOTSTRAP_CALLER_REGISTERED);
    case SeedCallerKind.UNREGISTERED:
      return caller.email === target_email
        ? ALLOWED_SEED
        : reject_seed(SeedRejection.BOOTSTRAP_TARGET_NOT_CALLER);
  }
}

function decide_established_seed(caller: SeedCaller): SeedDecision {
  switch (caller.kind) {
    case SeedCallerKind.ANONYMOUS:
      return reject_seed(SeedRejection.ANONYMOUS_CALLER);
    case SeedCallerKind.UNREGISTERED:
      return reject_seed(SeedRejection.CALLER_NOT_SUPER_ADMIN);
    case SeedCallerKind.REGISTERED:
      return caller.role === SUPER_ADMIN_ROLE &&
        caller.organization_id === GLOBAL_ORGANIZATION_ID &&
        caller.status !== SystemUserStatus.INACTIVE
        ? ALLOWED_SEED
        : reject_seed(SeedRejection.CALLER_NOT_SUPER_ADMIN);
  }
}

export function decide_super_admin_seed(
  command: SuperAdminSeedCommand,
): SeedDecision {
  switch (command.bootstrap.phase) {
    case BootstrapPhase.AWAITING_FIRST_SUPER_ADMIN:
      return decide_bootstrap_claim(command.caller, command.target_email);
    case BootstrapPhase.ORPHANED_WITHOUT_SUPER_ADMIN:
      return reject_seed(SeedRejection.NO_ACTIVE_SUPER_ADMIN);
    case BootstrapPhase.ESTABLISHED:
      return decide_established_seed(command.caller);
  }
}
