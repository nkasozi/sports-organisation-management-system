import { type Readable, writable } from "svelte/store";

import { local_vault_service } from "$lib/infrastructure/localVault/localVaultServiceInstance";

import {
  type LocalVaultProtectionInput,
  type LocalVaultUnlockInput,
  submit_local_vault_protection,
  submit_local_vault_unlock,
} from "./localVaultPromptActions";
import {
  confirm_local_vault_start_over,
  retry_local_vault_storage,
  sign_out_instead_of_local_vault_protection,
} from "./localVaultPromptChoices";
import {
  create_local_vault_prompt_gate,
  type LocalVaultPromptGate,
} from "./localVaultPromptGate";
import {
  create_hidden_local_vault_prompt_state,
  LOCAL_VAULT_PROMPT_EVENT,
  type LocalVaultPromptState,
} from "./localVaultPromptState";

export interface LocalVaultPromptHandlers {
  unlock(input: LocalVaultUnlockInput): Promise<boolean>;
  protect(input: LocalVaultProtectionInput): Promise<boolean>;
  request_start_over(): boolean;
  cancel_start_over(): boolean;
  confirm_start_over(): boolean;
  retry_storage(): boolean;
  sign_out_instead(): boolean;
  reload_page(): boolean;
}

const prompt_state_store = writable<LocalVaultPromptState>(
  create_hidden_local_vault_prompt_state(),
);

export const local_vault_prompt_store: Readable<LocalVaultPromptState> = {
  subscribe: prompt_state_store.subscribe,
};

export const local_vault_prompt_gate: LocalVaultPromptGate =
  create_local_vault_prompt_gate((prompt_state) => {
    prompt_state_store.set(prompt_state);
    return true;
  });

function create_local_vault_prompt_handlers(
  gate: LocalVaultPromptGate,
): LocalVaultPromptHandlers {
  const context = { gate, vault_service: local_vault_service };
  return {
    unlock: (input) => submit_local_vault_unlock(context, input),
    protect: (input) => submit_local_vault_protection(context, input),
    request_start_over: () =>
      gate.advance({ type: LOCAL_VAULT_PROMPT_EVENT.START_OVER_REQUESTED }),
    cancel_start_over: () =>
      gate.advance({ type: LOCAL_VAULT_PROMPT_EVENT.START_OVER_CANCELLED }),
    confirm_start_over: () => confirm_local_vault_start_over(gate),
    retry_storage: () => retry_local_vault_storage(gate),
    sign_out_instead: () => sign_out_instead_of_local_vault_protection(gate),
    reload_page: () => {
      window.location.reload();
      return true;
    },
  };
}

export const local_vault_prompt_handlers = create_local_vault_prompt_handlers(
  local_vault_prompt_gate,
);
