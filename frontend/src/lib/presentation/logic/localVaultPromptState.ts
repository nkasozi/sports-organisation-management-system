import { LOCAL_VAULT_MODE } from "$lib/infrastructure/localVault/localVaultContracts";

export const LOCAL_VAULT_PROMPT_KIND = {
  HIDDEN: "hidden",
  UNLOCK: "unlock",
  PROTECT: "protect",
  UNAVAILABLE: "unavailable",
} as const;

export const LOCAL_VAULT_PROMPT_PHASE = {
  READY: "ready",
  WORKING: "working",
  FAILED: "failed",
  CONFIRM_START_OVER: "confirm_start_over",
} as const;

export const LOCAL_VAULT_PROMPT_EVENT = {
  SUBMIT_STARTED: "submit_started",
  SUBMIT_FAILED: "submit_failed",
  START_OVER_REQUESTED: "start_over_requested",
  START_OVER_CANCELLED: "start_over_cancelled",
  SWITCHED_TO_PIN: "switched_to_pin",
} as const;

export const LOCAL_VAULT_STORAGE_RETRY_METHOD = "retry_storage" as const;

export type LocalVaultPromptMethod =
  | typeof LOCAL_VAULT_MODE.PASSKEY
  | typeof LOCAL_VAULT_MODE.PIN;

export type LocalVaultPromptPhase =
  | { status: typeof LOCAL_VAULT_PROMPT_PHASE.READY }
  | { status: typeof LOCAL_VAULT_PROMPT_PHASE.WORKING }
  | { status: typeof LOCAL_VAULT_PROMPT_PHASE.FAILED; message: string }
  | { status: typeof LOCAL_VAULT_PROMPT_PHASE.CONFIRM_START_OVER };

export type LocalVaultUnlockPromptMethod =
  | LocalVaultPromptMethod
  | typeof LOCAL_VAULT_STORAGE_RETRY_METHOD;

export type VisibleLocalVaultPromptState =
  | {
      kind: typeof LOCAL_VAULT_PROMPT_KIND.UNLOCK;
      method: LocalVaultUnlockPromptMethod;
      phase: LocalVaultPromptPhase;
    }
  | {
      kind: typeof LOCAL_VAULT_PROMPT_KIND.PROTECT;
      method: LocalVaultPromptMethod;
      owner_label: string;
      phase: LocalVaultPromptPhase;
    }
  | { kind: typeof LOCAL_VAULT_PROMPT_KIND.UNAVAILABLE; message: string };

export type LocalVaultPromptState =
  | { kind: typeof LOCAL_VAULT_PROMPT_KIND.HIDDEN }
  | VisibleLocalVaultPromptState;

export type LocalVaultPromptEvent =
  | { type: typeof LOCAL_VAULT_PROMPT_EVENT.SUBMIT_STARTED }
  | { type: typeof LOCAL_VAULT_PROMPT_EVENT.SUBMIT_FAILED; message: string }
  | { type: typeof LOCAL_VAULT_PROMPT_EVENT.START_OVER_REQUESTED }
  | { type: typeof LOCAL_VAULT_PROMPT_EVENT.START_OVER_CANCELLED }
  | { type: typeof LOCAL_VAULT_PROMPT_EVENT.SWITCHED_TO_PIN; message: string };

const READY_PHASE: LocalVaultPromptPhase = {
  status: LOCAL_VAULT_PROMPT_PHASE.READY,
};

export function create_hidden_local_vault_prompt_state(): LocalVaultPromptState {
  return { kind: LOCAL_VAULT_PROMPT_KIND.HIDDEN };
}

export function create_unlock_local_vault_prompt_state(
  method: LocalVaultUnlockPromptMethod,
  message: string,
): LocalVaultPromptState {
  const phase: LocalVaultPromptPhase =
    message.length > 0
      ? { status: LOCAL_VAULT_PROMPT_PHASE.FAILED, message }
      : READY_PHASE;
  return { kind: LOCAL_VAULT_PROMPT_KIND.UNLOCK, method, phase };
}

export function create_protect_local_vault_prompt_state(
  method: LocalVaultPromptMethod,
  owner_label: string,
): LocalVaultPromptState {
  return {
    kind: LOCAL_VAULT_PROMPT_KIND.PROTECT,
    method,
    owner_label,
    phase: READY_PHASE,
  };
}

export function create_unavailable_local_vault_prompt_state(
  message: string,
): LocalVaultPromptState {
  return { kind: LOCAL_VAULT_PROMPT_KIND.UNAVAILABLE, message };
}

function next_phase(
  phase: LocalVaultPromptPhase,
  event: LocalVaultPromptEvent,
  allows_start_over: boolean,
): LocalVaultPromptPhase {
  const is_working = phase.status === LOCAL_VAULT_PROMPT_PHASE.WORKING;
  switch (event.type) {
    case LOCAL_VAULT_PROMPT_EVENT.SUBMIT_STARTED:
      return is_working ? phase : { status: LOCAL_VAULT_PROMPT_PHASE.WORKING };
    case LOCAL_VAULT_PROMPT_EVENT.SUBMIT_FAILED:
      return is_working
        ? { status: LOCAL_VAULT_PROMPT_PHASE.FAILED, message: event.message }
        : phase;
    case LOCAL_VAULT_PROMPT_EVENT.START_OVER_REQUESTED:
      return allows_start_over && !is_working
        ? { status: LOCAL_VAULT_PROMPT_PHASE.CONFIRM_START_OVER }
        : phase;
    case LOCAL_VAULT_PROMPT_EVENT.START_OVER_CANCELLED:
      return phase.status === LOCAL_VAULT_PROMPT_PHASE.CONFIRM_START_OVER
        ? READY_PHASE
        : phase;
    case LOCAL_VAULT_PROMPT_EVENT.SWITCHED_TO_PIN:
      return phase;
  }
}

function switch_protection_to_pin(
  state: Extract<
    LocalVaultPromptState,
    { kind: typeof LOCAL_VAULT_PROMPT_KIND.PROTECT }
  >,
  message: string,
): LocalVaultPromptState {
  return {
    ...state,
    method: LOCAL_VAULT_MODE.PIN,
    phase: { status: LOCAL_VAULT_PROMPT_PHASE.FAILED, message },
  };
}

export function advance_local_vault_prompt_state(
  state: LocalVaultPromptState,
  event: LocalVaultPromptEvent,
): LocalVaultPromptState {
  switch (state.kind) {
    case LOCAL_VAULT_PROMPT_KIND.HIDDEN:
    case LOCAL_VAULT_PROMPT_KIND.UNAVAILABLE:
      return state;
    case LOCAL_VAULT_PROMPT_KIND.UNLOCK:
      return { ...state, phase: next_phase(state.phase, event, true) };
    case LOCAL_VAULT_PROMPT_KIND.PROTECT:
      return event.type === LOCAL_VAULT_PROMPT_EVENT.SWITCHED_TO_PIN
        ? switch_protection_to_pin(state, event.message)
        : { ...state, phase: next_phase(state.phase, event, false) };
  }
}

export function is_local_vault_prompt_working(
  state: LocalVaultPromptState,
): boolean {
  switch (state.kind) {
    case LOCAL_VAULT_PROMPT_KIND.HIDDEN:
    case LOCAL_VAULT_PROMPT_KIND.UNAVAILABLE:
      return false;
    case LOCAL_VAULT_PROMPT_KIND.UNLOCK:
    case LOCAL_VAULT_PROMPT_KIND.PROTECT:
      return state.phase.status === LOCAL_VAULT_PROMPT_PHASE.WORKING;
  }
}
