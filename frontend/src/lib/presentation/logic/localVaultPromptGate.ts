import type { PendingLocalVaultKey } from "$lib/infrastructure/localVault/localVaultContracts";

import {
  advance_local_vault_prompt_state,
  create_hidden_local_vault_prompt_state,
  create_protect_local_vault_prompt_state,
  create_unavailable_local_vault_prompt_state,
  create_unlock_local_vault_prompt_state,
  type LocalVaultPromptEvent,
  type LocalVaultPromptMethod,
  type LocalVaultPromptState,
  type LocalVaultUnlockPromptMethod,
} from "./localVaultPromptState";

export const LOCAL_VAULT_UNLOCK_RESOLUTION = {
  UNLOCKED: "unlocked",
  START_OVER: "start_over",
  RETRY: "retry",
} as const;

export const LOCAL_VAULT_PROTECTION_RESOLUTION = {
  PROTECTED: "protected",
  SIGN_OUT_REQUESTED: "sign_out_requested",
} as const;

export type LocalVaultUnlockResolution =
  (typeof LOCAL_VAULT_UNLOCK_RESOLUTION)[keyof typeof LOCAL_VAULT_UNLOCK_RESOLUTION];

export type LocalVaultProtectionResolution =
  | {
      kind: typeof LOCAL_VAULT_PROTECTION_RESOLUTION.PROTECTED;
      pending: PendingLocalVaultKey;
    }
  | { kind: typeof LOCAL_VAULT_PROTECTION_RESOLUTION.SIGN_OUT_REQUESTED };

const WAITER_STATUS = {
  IDLE: "idle",
  UNLOCK: "unlock",
  PROTECTION: "protection",
} as const;

type WaiterState =
  | { status: typeof WAITER_STATUS.IDLE }
  | {
      status: typeof WAITER_STATUS.UNLOCK;
      resolve: (resolution: LocalVaultUnlockResolution) => void;
    }
  | {
      status: typeof WAITER_STATUS.PROTECTION;
      resolve: (resolution: LocalVaultProtectionResolution) => void;
    };

export interface LocalVaultPromptGate {
  current(): LocalVaultPromptState;
  wait_for_unlock(
    method: LocalVaultUnlockPromptMethod,
    message: string,
  ): Promise<LocalVaultUnlockResolution>;
  wait_for_protection(
    method: LocalVaultPromptMethod,
    owner_label: string,
  ): Promise<LocalVaultProtectionResolution>;
  advance(event: LocalVaultPromptEvent): boolean;
  show_unavailable(message: string): boolean;
  finish_unlock(resolution: LocalVaultUnlockResolution): boolean;
  finish_protection(resolution: LocalVaultProtectionResolution): boolean;
}

interface GateMemory {
  prompt_state: LocalVaultPromptState;
  waiter: WaiterState;
  on_prompt_state_change: (prompt_state: LocalVaultPromptState) => boolean;
}

function show_prompt_state(
  memory: GateMemory,
  next_state: LocalVaultPromptState,
): boolean {
  memory.prompt_state = next_state;
  return memory.on_prompt_state_change(next_state);
}

function release_waiter(memory: GateMemory): WaiterState {
  const released = memory.waiter;
  memory.waiter = { status: WAITER_STATUS.IDLE };
  show_prompt_state(memory, create_hidden_local_vault_prompt_state());
  return released;
}

function finish_unlock_waiter(
  memory: GateMemory,
  resolution: LocalVaultUnlockResolution,
): boolean {
  const released = memory.waiter;
  if (released.status !== WAITER_STATUS.UNLOCK) return false;
  release_waiter(memory);
  released.resolve(resolution);
  return true;
}

function finish_protection_waiter(
  memory: GateMemory,
  resolution: LocalVaultProtectionResolution,
): boolean {
  const released = memory.waiter;
  if (released.status !== WAITER_STATUS.PROTECTION) return false;
  release_waiter(memory);
  released.resolve(resolution);
  return true;
}

function wait_for_unlock_choice(
  memory: GateMemory,
  method: LocalVaultUnlockPromptMethod,
  message: string,
): Promise<LocalVaultUnlockResolution> {
  show_prompt_state(
    memory,
    create_unlock_local_vault_prompt_state(method, message),
  );
  return new Promise((resolve) => {
    memory.waiter = { status: WAITER_STATUS.UNLOCK, resolve };
  });
}

function wait_for_protection_choice(
  memory: GateMemory,
  method: LocalVaultPromptMethod,
  owner_label: string,
): Promise<LocalVaultProtectionResolution> {
  show_prompt_state(
    memory,
    create_protect_local_vault_prompt_state(method, owner_label),
  );
  return new Promise((resolve) => {
    memory.waiter = { status: WAITER_STATUS.PROTECTION, resolve };
  });
}

export function create_local_vault_prompt_gate(
  on_prompt_state_change: (prompt_state: LocalVaultPromptState) => boolean,
): LocalVaultPromptGate {
  const memory: GateMemory = {
    prompt_state: create_hidden_local_vault_prompt_state(),
    waiter: { status: WAITER_STATUS.IDLE },
    on_prompt_state_change,
  };
  return {
    current: () => memory.prompt_state,
    wait_for_unlock: (method, message) =>
      wait_for_unlock_choice(memory, method, message),
    wait_for_protection: (method, owner_label) =>
      wait_for_protection_choice(memory, method, owner_label),
    advance: (event) =>
      show_prompt_state(
        memory,
        advance_local_vault_prompt_state(memory.prompt_state, event),
      ),
    show_unavailable: (message) =>
      show_prompt_state(
        memory,
        create_unavailable_local_vault_prompt_state(message),
      ),
    finish_unlock: (resolution) => finish_unlock_waiter(memory, resolution),
    finish_protection: (resolution) =>
      finish_protection_waiter(memory, resolution),
  };
}
