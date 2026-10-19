import { type Mock, vi } from "vitest";

import {
  create_local_vault_prompt_gate,
  type LocalVaultPromptGate,
} from "./localVaultPromptGate";

export const PENDING_KEY = { data_key: new Uint8Array(32), record: {} };

interface PromptActionTestContext {
  gate: LocalVaultPromptGate;
  vault_service: Record<
    | "unlock_with_passkey"
    | "unlock_with_pin"
    | "create_passkey_unlock"
    | "create_pin_unlock",
    Mock
  >;
  context: never;
}

export function create_context(): PromptActionTestContext {
  const gate = create_local_vault_prompt_gate(() => true);
  const vault_service = {
    unlock_with_passkey: vi.fn(async () => ({
      success: true as const,
      data: "passkey" as const,
    })),
    unlock_with_pin: vi.fn(async () => ({
      success: true as const,
      data: "pin" as const,
    })),
    create_passkey_unlock: vi.fn(async () => ({
      success: true as const,
      data: PENDING_KEY,
    })),
    create_pin_unlock: vi.fn(async () => ({
      success: true as const,
      data: PENDING_KEY,
    })),
  };
  return { gate, vault_service, context: { gate, vault_service } as never };
}
