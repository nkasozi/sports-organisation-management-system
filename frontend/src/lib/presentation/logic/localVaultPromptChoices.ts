import {
  LOCAL_VAULT_PROTECTION_RESOLUTION,
  LOCAL_VAULT_UNLOCK_RESOLUTION,
  type LocalVaultPromptGate,
} from "./localVaultPromptGate";
import {
  is_local_vault_prompt_working,
  LOCAL_VAULT_PROMPT_KIND,
  LOCAL_VAULT_PROMPT_PHASE,
  LOCAL_VAULT_STORAGE_RETRY_METHOD,
} from "./localVaultPromptState";

export function confirm_local_vault_start_over(
  gate: LocalVaultPromptGate,
): boolean {
  const prompt_state = gate.current();
  if (prompt_state.kind !== LOCAL_VAULT_PROMPT_KIND.UNLOCK) return false;
  if (prompt_state.phase.status !== LOCAL_VAULT_PROMPT_PHASE.CONFIRM_START_OVER)
    return false;
  return gate.finish_unlock(LOCAL_VAULT_UNLOCK_RESOLUTION.START_OVER);
}

export function retry_local_vault_storage(gate: LocalVaultPromptGate): boolean {
  const prompt_state = gate.current();
  if (prompt_state.kind !== LOCAL_VAULT_PROMPT_KIND.UNLOCK) return false;
  if (prompt_state.method !== LOCAL_VAULT_STORAGE_RETRY_METHOD) return false;
  if (prompt_state.phase.status === LOCAL_VAULT_PROMPT_PHASE.CONFIRM_START_OVER)
    return false;
  return gate.finish_unlock(LOCAL_VAULT_UNLOCK_RESOLUTION.RETRY);
}

export function sign_out_instead_of_local_vault_protection(
  gate: LocalVaultPromptGate,
): boolean {
  const prompt_state = gate.current();
  if (prompt_state.kind !== LOCAL_VAULT_PROMPT_KIND.PROTECT) return false;
  if (is_local_vault_prompt_working(prompt_state)) return false;
  return gate.finish_protection({
    kind: LOCAL_VAULT_PROTECTION_RESOLUTION.SIGN_OUT_REQUESTED,
  });
}
