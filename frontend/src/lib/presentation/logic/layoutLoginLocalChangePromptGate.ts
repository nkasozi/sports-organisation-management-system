import {
  create_hidden_login_local_change_prompt_state,
  is_discard_login_local_change_choice,
  LOGIN_LOCAL_CHANGE_PROMPT_EVENT,
  type LoginLocalChangePromptChoice,
  type LoginLocalChangePromptState,
  transition_login_local_change_prompt_state,
} from "./layoutLoginLocalChangePrompt";

const RESOLVER_STATUS = { IDLE: "idle", WAITING: "waiting" } as const;
const PROMPT_REQUEST_REJECTED_EVENT = "login_local_change_prompt_rejected";
const PROMPT_CHOICE_RECORDED_EVENT = "login_local_change_prompt_resolved";

type ChoiceResolverState =
  | { status: typeof RESOLVER_STATUS.IDLE }
  | {
      status: typeof RESOLVER_STATUS.WAITING;
      resolve: (discard_confirmed: boolean) => void;
    };

interface LoginLocalChangePromptGateState {
  prompt_state: LoginLocalChangePromptState;
  resolver_state: ChoiceResolverState;
}

interface LoginLocalChangePromptGate {
  request_discard_confirmation(unsynced_count: number): Promise<boolean>;
  resolve_choice(choice: LoginLocalChangePromptChoice): boolean;
}

function decline_rejected_prompt_request(error: string): Promise<boolean> {
  console.warn("[Layout] Login local change prompt request rejected", {
    event: PROMPT_REQUEST_REJECTED_EVENT,
    error,
  });
  return Promise.resolve(false);
}

interface LoginLocalChangePromptGateContext {
  gate_state: LoginLocalChangePromptGateState;
  on_prompt_state_change(prompt_state: LoginLocalChangePromptState): boolean;
}

function request_discard_confirmation(
  context: LoginLocalChangePromptGateContext,
  unsynced_count: number,
): Promise<boolean> {
  const transition = transition_login_local_change_prompt_state(
    context.gate_state.prompt_state,
    { type: LOGIN_LOCAL_CHANGE_PROMPT_EVENT.CHOICE_REQUESTED, unsynced_count },
  );
  if (!transition.success)
    return decline_rejected_prompt_request(transition.error);
  context.gate_state.prompt_state = transition.data;
  context.on_prompt_state_change(transition.data);
  return new Promise<boolean>((resolve) => {
    context.gate_state.resolver_state = {
      status: RESOLVER_STATUS.WAITING,
      resolve,
    };
  });
}

function resolve_choice(
  context: LoginLocalChangePromptGateContext,
  choice: LoginLocalChangePromptChoice,
): boolean {
  const { gate_state } = context;
  const transition = transition_login_local_change_prompt_state(
    gate_state.prompt_state,
    { type: LOGIN_LOCAL_CHANGE_PROMPT_EVENT.CHOICE_MADE, choice },
  );
  if (!transition.success) return false;
  if (gate_state.resolver_state.status !== RESOLVER_STATUS.WAITING)
    return false;
  const { resolve } = gate_state.resolver_state;
  gate_state.prompt_state = transition.data;
  gate_state.resolver_state = { status: RESOLVER_STATUS.IDLE };
  context.on_prompt_state_change(transition.data);
  console.log("[Layout] Login local change prompt resolved", {
    event: PROMPT_CHOICE_RECORDED_EVENT,
    choice,
  });
  resolve(is_discard_login_local_change_choice(choice));
  return true;
}

export function create_login_local_change_prompt_gate(
  on_prompt_state_change: (
    prompt_state: LoginLocalChangePromptState,
  ) => boolean,
): LoginLocalChangePromptGate {
  const context: LoginLocalChangePromptGateContext = {
    gate_state: {
      prompt_state: create_hidden_login_local_change_prompt_state(),
      resolver_state: { status: RESOLVER_STATUS.IDLE },
    },
    on_prompt_state_change,
  };

  return {
    request_discard_confirmation: (unsynced_count: number) =>
      request_discard_confirmation(context, unsynced_count),
    resolve_choice: (choice: LoginLocalChangePromptChoice) =>
      resolve_choice(context, choice),
  };
}
