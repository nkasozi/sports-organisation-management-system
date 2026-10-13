import {
  create_hidden_startup_storage_recovery_prompt_state,
  type StartupStorageRecoveryChoice,
  type StartupStorageRecoveryPromptState,
  type VisibleStartupStorageRecoveryPromptState,
} from "./layoutStorageRecovery";

const CHOICE_GATE_STATUS = { IDLE: "idle", WAITING: "waiting" } as const;

type ChoiceGateState =
  | { status: typeof CHOICE_GATE_STATUS.IDLE }
  | {
      status: typeof CHOICE_GATE_STATUS.WAITING;
      resolve: (choice: StartupStorageRecoveryChoice) => void;
    };

interface StartupStorageRecoveryChoiceGate {
  wait_for_choice(
    prompt_state: VisibleStartupStorageRecoveryPromptState,
  ): Promise<StartupStorageRecoveryChoice>;
  resolve_choice(choice: StartupStorageRecoveryChoice): boolean;
}

export function create_startup_storage_recovery_choice_gate(
  on_prompt_state_change: (
    prompt_state: StartupStorageRecoveryPromptState,
  ) => boolean,
): StartupStorageRecoveryChoiceGate {
  let gate_state: ChoiceGateState = { status: CHOICE_GATE_STATUS.IDLE };

  function wait_for_choice(
    prompt_state: VisibleStartupStorageRecoveryPromptState,
  ): Promise<StartupStorageRecoveryChoice> {
    on_prompt_state_change(prompt_state);
    return new Promise<StartupStorageRecoveryChoice>((resolve) => {
      gate_state = { status: CHOICE_GATE_STATUS.WAITING, resolve };
    });
  }

  function resolve_choice(choice: StartupStorageRecoveryChoice): boolean {
    if (gate_state.status !== CHOICE_GATE_STATUS.WAITING) {
      return false;
    }

    const { resolve } = gate_state;
    gate_state = { status: CHOICE_GATE_STATUS.IDLE };
    on_prompt_state_change(
      create_hidden_startup_storage_recovery_prompt_state(),
    );
    resolve(choice);
    return true;
  }

  return { wait_for_choice, resolve_choice };
}
