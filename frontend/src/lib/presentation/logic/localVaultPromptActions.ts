import {
  type AsyncResult,
  create_failure_result,
} from "$lib/core/types/Result";
import {
  LOCAL_VAULT_MODE,
  type LocalVaultService,
} from "$lib/infrastructure/localVault/localVaultContracts";
import { LOCAL_VAULT_MESSAGE } from "$lib/infrastructure/localVault/localVaultMessages";

import {
  LOCAL_VAULT_PROTECTION_RESOLUTION,
  LOCAL_VAULT_UNLOCK_RESOLUTION,
  type LocalVaultPromptGate,
} from "./localVaultPromptGate";
import {
  LOCAL_VAULT_PIN_MINIMUM_LENGTH,
  LOCAL_VAULT_PROMPT_MESSAGE,
} from "./localVaultPromptMessages";
import {
  is_local_vault_prompt_working,
  LOCAL_VAULT_PROMPT_EVENT,
  LOCAL_VAULT_PROMPT_KIND,
} from "./localVaultPromptState";

export type LocalVaultUnlockInput =
  | { method: typeof LOCAL_VAULT_MODE.PASSKEY }
  | { method: typeof LOCAL_VAULT_MODE.PIN; pin: string };

export type LocalVaultProtectionInput =
  | { method: typeof LOCAL_VAULT_MODE.PASSKEY }
  | {
      method: typeof LOCAL_VAULT_MODE.PIN;
      pin: string;
      pin_confirmation: string;
    };

interface LocalVaultPromptActionContext {
  gate: LocalVaultPromptGate;
  vault_service: Pick<
    LocalVaultService,
    | "unlock_with_passkey"
    | "unlock_with_pin"
    | "create_passkey_unlock"
    | "create_pin_unlock"
  >;
}

const LOCAL_VAULT_PROMPT_ATTEMPT_FAILED_EVENT =
  "local_vault_prompt_attempt_failed";
const LOCAL_VAULT_PROTECTION_SWITCHED_TO_PIN_EVENT =
  "local_vault_protection_switched_to_pin";
const LOCAL_VAULT_PROMPT_ATTEMPT_CRASHED_EVENT =
  "local_vault_prompt_attempt_crashed";

async function settle_attempt<TData>(
  attempt: AsyncResult<TData>,
): AsyncResult<TData> {
  try {
    return await attempt;
  } catch (error) {
    console.error("[LocalVault] Unlock prompt attempt crashed", {
      event: LOCAL_VAULT_PROMPT_ATTEMPT_CRASHED_EVENT,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}

function reject_attempt(gate: LocalVaultPromptGate, message: string): boolean {
  gate.advance({ type: LOCAL_VAULT_PROMPT_EVENT.SUBMIT_STARTED });
  gate.advance({ type: LOCAL_VAULT_PROMPT_EVENT.SUBMIT_FAILED, message });
  return false;
}

const FRIENDLY_VAULT_MESSAGES: ReadonlySet<string> = new Set(
  Object.values(LOCAL_VAULT_MESSAGE),
);

function report_failed_attempt(
  gate: LocalVaultPromptGate,
  error: string,
  fallback_message: string,
): boolean {
  console.warn("[LocalVault] Unlock prompt attempt failed", {
    event: LOCAL_VAULT_PROMPT_ATTEMPT_FAILED_EVENT,
    error,
  });
  const message = FRIENDLY_VAULT_MESSAGES.has(error) ? error : fallback_message;
  gate.advance({ type: LOCAL_VAULT_PROMPT_EVENT.SUBMIT_FAILED, message });
  return false;
}

function switch_protection_to_pin(
  gate: LocalVaultPromptGate,
  message: string,
): boolean {
  console.warn("[LocalVault] Fingerprint unlock unavailable, offering a PIN", {
    event: LOCAL_VAULT_PROTECTION_SWITCHED_TO_PIN_EVENT,
  });
  gate.advance({ type: LOCAL_VAULT_PROMPT_EVENT.SWITCHED_TO_PIN, message });
  return false;
}

function find_pin_setup_problem(pin: string, pin_confirmation: string): string {
  if (pin.length < LOCAL_VAULT_PIN_MINIMUM_LENGTH)
    return LOCAL_VAULT_PROMPT_MESSAGE.PIN_TOO_SHORT;
  return pin === pin_confirmation
    ? ""
    : LOCAL_VAULT_PROMPT_MESSAGE.PIN_MISMATCH;
}

export async function submit_local_vault_unlock(
  context: LocalVaultPromptActionContext,
  input: LocalVaultUnlockInput,
): Promise<boolean> {
  const prompt_state = context.gate.current();
  if (prompt_state.kind !== LOCAL_VAULT_PROMPT_KIND.UNLOCK) return false;
  if (is_local_vault_prompt_working(prompt_state)) return false;
  if (prompt_state.method !== input.method) return false;
  if (input.method === LOCAL_VAULT_MODE.PIN && input.pin.length === 0)
    return reject_attempt(
      context.gate,
      LOCAL_VAULT_PROMPT_MESSAGE.PIN_REQUIRED,
    );
  const attempt =
    input.method === LOCAL_VAULT_MODE.PASSKEY
      ? context.vault_service.unlock_with_passkey()
      : context.vault_service.unlock_with_pin(input.pin);
  context.gate.advance({ type: LOCAL_VAULT_PROMPT_EVENT.SUBMIT_STARTED });
  const result = await settle_attempt(attempt);
  if (result.success)
    return context.gate.finish_unlock(LOCAL_VAULT_UNLOCK_RESOLUTION.UNLOCKED);
  const fallback_message =
    input.method === LOCAL_VAULT_MODE.PASSKEY
      ? LOCAL_VAULT_PROMPT_MESSAGE.PASSKEY_UNLOCK_FAILED
      : LOCAL_VAULT_PROMPT_MESSAGE.PIN_UNLOCK_FAILED;
  return report_failed_attempt(context.gate, result.error, fallback_message);
}

export async function submit_local_vault_protection(
  context: LocalVaultPromptActionContext,
  input: LocalVaultProtectionInput,
): Promise<boolean> {
  const prompt_state = context.gate.current();
  if (prompt_state.kind !== LOCAL_VAULT_PROMPT_KIND.PROTECT) return false;
  if (is_local_vault_prompt_working(prompt_state)) return false;
  const pin_problem =
    input.method === LOCAL_VAULT_MODE.PIN
      ? find_pin_setup_problem(input.pin, input.pin_confirmation)
      : "";
  if (pin_problem.length > 0) return reject_attempt(context.gate, pin_problem);
  const attempt =
    input.method === LOCAL_VAULT_MODE.PASSKEY
      ? context.vault_service.create_passkey_unlock(prompt_state.owner_label)
      : context.vault_service.create_pin_unlock(input.pin);
  context.gate.advance({ type: LOCAL_VAULT_PROMPT_EVENT.SUBMIT_STARTED });
  const result = await settle_attempt(attempt);
  if (result.success)
    return context.gate.finish_protection({
      kind: LOCAL_VAULT_PROTECTION_RESOLUTION.PROTECTED,
      pending: result.data,
    });
  if (result.error === LOCAL_VAULT_MESSAGE.PASSKEY_UNAVAILABLE)
    return switch_protection_to_pin(context.gate, result.error);
  const fallback_message =
    input.method === LOCAL_VAULT_MODE.PASSKEY
      ? LOCAL_VAULT_PROMPT_MESSAGE.PASSKEY_SETUP_FAILED
      : LOCAL_VAULT_PROMPT_MESSAGE.PIN_SETUP_FAILED;
  return report_failed_attempt(context.gate, result.error, fallback_message);
}
