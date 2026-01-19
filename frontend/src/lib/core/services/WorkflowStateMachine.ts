// Workflow State Machine for Sports Organization Setup
// Follows coding rules: well-named functions, explicit return types, stateless helpers
import type { BaseEntity } from "../entities/BaseEntity";

export interface WorkflowStepDefinition {
  step_id: string;
  step_name: string;
  step_description: string;
  entity_type: string;
  required_selection_count: number; // Exact number required, -1 for any number > 0
  min_selection_count: number; // Minimum required
  max_selection_count: number; // Maximum allowed, -1 for unlimited
  is_optional: boolean;
  next_step_id?: string;
  error_message_template: string; // Template for validation messages
}

export interface WorkflowStepState {
  step_definition: WorkflowStepDefinition;
  selected_entities: BaseEntity[];
  is_selection_valid: boolean;
  validation_error_message: string;
  is_completed: boolean;
}

export interface WorkflowMachineState {
  current_step_id: string;
  step_states: Record<string, WorkflowStepState>;
  completed_step_ids: Set<string>;
  workflow_entities: Record<string, BaseEntity[]>;
  can_proceed_to_next_step: boolean;
  can_go_back_to_previous_step: boolean;
}

export interface WorkflowTransitionResult {
  success: boolean;
  new_state: WorkflowMachineState;
  error_message?: string;
  validation_errors?: string[];
}

// Define the workflow steps for sports organization setup
const SPORTS_WORKFLOW_STEPS: WorkflowStepDefinition[] = [
  {
    step_id: "select_organization",
    step_name: "Select Organization",
    step_description:
      "Choose the organization for your sports management setup",
    entity_type: "organization",
    required_selection_count: 1,
    min_selection_count: 1,
    max_selection_count: 1,
    is_optional: false,
    next_step_id: "select_competition",
    error_message_template: "Please select exactly 1 organization to continue",
  },
  {
    step_id: "select_competition",
    step_name: "Select Competition",
    step_description: "Choose the competition within the selected organization",
    entity_type: "competition",
    required_selection_count: 1,
    min_selection_count: 1,
    max_selection_count: 1,
    is_optional: false,
    next_step_id: "select_teams",
    error_message_template: "Please select exactly 1 competition to continue",
  },
  {
    step_id: "select_teams",
    step_name: "Select Teams",
    step_description:
      "Choose the teams that will participate in this competition",
    entity_type: "team",
    required_selection_count: -1, // Any number > 0
    min_selection_count: 2,
    max_selection_count: -1, // Unlimited
    is_optional: false,
    next_step_id: "select_players",
    error_message_template: "Please select at least 2 teams to continue",
  },
  {
    step_id: "select_players",
    step_name: "Select Players",
    step_description: "Choose players for the selected teams (optional)",
    entity_type: "player",
    required_selection_count: -1, // Any number >= 0
    min_selection_count: 0,
    max_selection_count: -1, // Unlimited
    is_optional: true,
    next_step_id: "select_officials",
    error_message_template:
      "You can select any number of players or skip this step",
  },
  {
    step_id: "select_officials",
    step_name: "Select Officials",
    step_description: "Choose referees and officials for the competition",
    entity_type: "official",
    required_selection_count: -1, // Any number > 0
    min_selection_count: 1,
    max_selection_count: -1, // Unlimited
    is_optional: false,
    next_step_id: "create_games",
    error_message_template: "Please select at least 1 official to continue",
  },
  {
    step_id: "create_games",
    step_name: "Create Games",
    step_description:
      "Create games/matches for the selected teams in this competition",
    entity_type: "game",
    required_selection_count: -1, // Any number > 0
    min_selection_count: 1,
    max_selection_count: -1, // Unlimited
    is_optional: false,
    next_step_id: "assign_game_details",
    error_message_template: "Please create at least 1 game to continue",
  },
  {
    step_id: "assign_game_details",
    step_name: "Assign Game Details",
    step_description: "Assign teams and officials to each game, set schedules",
    entity_type: "game_assignment",
    required_selection_count: -1, // Any number >= 0 (assignments are optional but recommended)
    min_selection_count: 0,
    max_selection_count: -1, // Unlimited
    is_optional: true,
    next_step_id: "game_management",
    error_message_template:
      "Game assignments are optional but recommended for proper game management",
  },
  {
    step_id: "game_management",
    step_name: "Game Management",
    step_description:
      "Select games to start, manage live events, track scores and player actions",
    entity_type: "game",
    required_selection_count: -1, // Any number >= 0
    min_selection_count: 0,
    max_selection_count: -1, // Unlimited
    is_optional: true,
    next_step_id: "review_setup",
    error_message_template:
      "You can start games when ready or proceed to review",
  },
  {
    step_id: "review_setup",
    step_name: "Review Setup",
    step_description:
      "Review your complete sports management setup including games and assignments",
    entity_type: "",
    required_selection_count: 0,
    min_selection_count: 0,
    max_selection_count: 0,
    is_optional: true,
    error_message_template: "Setup is ready for completion",
  },
];

export class WorkflowStateMachine {
  private step_definitions: Record<string, WorkflowStepDefinition>;
  private step_order: string[];

  constructor() {
    this.step_definitions = {};
    this.step_order = [];

    // Initialize step definitions
    for (const step_def of SPORTS_WORKFLOW_STEPS) {
      this.step_definitions[step_def.step_id] = step_def;
      this.step_order.push(step_def.step_id);
    }
  }

  create_initial_workflow_state(): WorkflowMachineState {
    const step_states: Record<string, WorkflowStepState> = {};

    // Initialize all step states
    for (const step_def of SPORTS_WORKFLOW_STEPS) {
      step_states[step_def.step_id] = {
        step_definition: step_def,
        selected_entities: [],
        is_selection_valid: step_def.is_optional, // Optional steps start as valid
        validation_error_message: step_def.is_optional
          ? ""
          : step_def.error_message_template,
        is_completed: false,
      };
    }

    return {
      current_step_id: this.step_order[0],
      step_states,
      completed_step_ids: new Set(),
      workflow_entities: {},
      can_proceed_to_next_step: false,
      can_go_back_to_previous_step: false,
    };
  }

  update_step_selection(
    current_state: WorkflowMachineState,
    step_id: string,
    selected_entities: BaseEntity[],
  ): WorkflowTransitionResult {
    if (!this.step_definitions[step_id]) {
      return {
        success: false,
        new_state: current_state,
        error_message: `Invalid step ID: ${step_id}`,
      };
    }

    const step_def = this.step_definitions[step_id];
    const step_state = current_state.step_states[step_id];

    // Validate selection count
    const validation_result = this.validate_selection_count(
      step_def,
      selected_entities.length,
    );

    // Create new step state
    const new_step_state: WorkflowStepState = {
      ...step_state,
      selected_entities: [...selected_entities],
      is_selection_valid: validation_result.is_valid,
      validation_error_message: validation_result.error_message,
      is_completed: validation_result.is_valid,
    };

    // Create new workflow state
    const new_state: WorkflowMachineState = {
      ...current_state,
      step_states: {
        ...current_state.step_states,
        [step_id]: new_step_state,
      },
      workflow_entities: {
        ...current_state.workflow_entities,
        [step_def.entity_type]: [...selected_entities],
      },
    };

    // Update navigation capabilities
    new_state.can_proceed_to_next_step =
      this.can_proceed_to_next_step_from_current(new_state);
    new_state.can_go_back_to_previous_step =
      this.can_go_back_to_previous_step_from_current(new_state);

    return {
      success: true,
      new_state,
    };
  }

  transition_to_next_step(
    current_state: WorkflowMachineState,
  ): WorkflowTransitionResult {
    const current_step_def =
      this.step_definitions[current_state.current_step_id];
    if (!current_step_def.next_step_id) {
      return {
        success: false,
        new_state: current_state,
        error_message: "Already at the final step",
      };
    }

    const current_step_state =
      current_state.step_states[current_state.current_step_id];
    if (!current_step_state.is_selection_valid) {
      return {
        success: false,
        new_state: current_state,
        error_message: current_step_state.validation_error_message,
      };
    }

    // Mark current step as completed
    const new_completed_step_ids = new Set(current_state.completed_step_ids);
    new_completed_step_ids.add(current_state.current_step_id);

    const new_state: WorkflowMachineState = {
      ...current_state,
      current_step_id: current_step_def.next_step_id,
      completed_step_ids: new_completed_step_ids,
    };

    // Update navigation capabilities
    new_state.can_proceed_to_next_step =
      this.can_proceed_to_next_step_from_current(new_state);
    new_state.can_go_back_to_previous_step =
      this.can_go_back_to_previous_step_from_current(new_state);

    return {
      success: true,
      new_state,
    };
  }

  transition_to_previous_step(
    current_state: WorkflowMachineState,
  ): WorkflowTransitionResult {
    const current_step_index = this.step_order.indexOf(
      current_state.current_step_id,
    );
    if (current_step_index <= 0) {
      return {
        success: false,
        new_state: current_state,
        error_message: "Already at the first step",
      };
    }

    const previous_step_id = this.step_order[current_step_index - 1];
    const new_state: WorkflowMachineState = {
      ...current_state,
      current_step_id: previous_step_id,
    };

    // Update navigation capabilities
    new_state.can_proceed_to_next_step =
      this.can_proceed_to_next_step_from_current(new_state);
    new_state.can_go_back_to_previous_step =
      this.can_go_back_to_previous_step_from_current(new_state);

    return {
      success: true,
      new_state,
    };
  }

  private validate_selection_count(
    step_def: WorkflowStepDefinition,
    selected_count: number,
  ): { is_valid: boolean; error_message: string } {
    // Handle optional steps
    if (step_def.is_optional && selected_count === 0) {
      return { is_valid: true, error_message: "" };
    }

    // Check minimum requirement
    if (selected_count < step_def.min_selection_count) {
      const count_word = step_def.min_selection_count === 1 ? "item" : "items";
      return {
        is_valid: false,
        error_message: `Please select at least ${step_def.min_selection_count} ${count_word}`,
      };
    }

    // Check maximum limit (if set)
    if (
      step_def.max_selection_count > 0 &&
      selected_count > step_def.max_selection_count
    ) {
      const count_word = step_def.max_selection_count === 1 ? "item" : "items";
      return {
        is_valid: false,
        error_message: `Please select no more than ${step_def.max_selection_count} ${count_word}`,
      };
    }

    // Check exact requirement (if set)
    if (
      step_def.required_selection_count > 0 &&
      selected_count !== step_def.required_selection_count
    ) {
      const count_word =
        step_def.required_selection_count === 1 ? "item" : "items";
      return {
        is_valid: false,
        error_message: `Please select exactly ${step_def.required_selection_count} ${count_word}`,
      };
    }

    return { is_valid: true, error_message: "" };
  }

  private can_proceed_to_next_step_from_current(
    state: WorkflowMachineState,
  ): boolean {
    const current_step_state = state.step_states[state.current_step_id];
    const current_step_def = this.step_definitions[state.current_step_id];

    return (
      current_step_state.is_selection_valid && !!current_step_def.next_step_id
    );
  }

  private can_go_back_to_previous_step_from_current(
    state: WorkflowMachineState,
  ): boolean {
    const current_step_index = this.step_order.indexOf(state.current_step_id);
    return current_step_index > 0;
  }

  get_current_step_definition(
    state: WorkflowMachineState,
  ): WorkflowStepDefinition {
    return this.step_definitions[state.current_step_id];
  }

  get_current_step_state(state: WorkflowMachineState): WorkflowStepState {
    return state.step_states[state.current_step_id];
  }

  get_workflow_progress_percentage(state: WorkflowMachineState): number {
    const current_step_index = this.step_order.indexOf(state.current_step_id);
    return Math.round(
      ((current_step_index + 1) / this.step_order.length) * 100,
    );
  }

  is_workflow_complete(state: WorkflowMachineState): boolean {
    return (
      state.current_step_id === "review_setup" &&
      state.step_states["review_setup"].is_completed
    );
  }

  get_step_order(): string[] {
    return [...this.step_order];
  }

  get_all_step_definitions(): WorkflowStepDefinition[] {
    return SPORTS_WORKFLOW_STEPS.map((step) => ({ ...step }));
  }

  get_wizard_steps_for_ui(state: WorkflowMachineState): any[] {
    return this.get_all_step_definitions().map((step_def, index) => {
      const step_state = state.step_states[step_def.step_id];
      const is_current_step = state.current_step_id === step_def.step_id;

      return {
        step_key: step_def.step_id,
        step_title: step_def.step_name,
        step_description: step_def.step_description,
        is_completed: is_current_step
          ? step_state.is_selection_valid
          : state.completed_step_ids.has(step_def.step_id),
        is_optional: step_def.is_optional,
        entity_type: step_def.entity_type,
        allow_multiple_selection: step_def.max_selection_count !== 1,
        is_current: is_current_step,
      };
    });
  }

  get_current_step_index(state: WorkflowMachineState): number {
    return this.step_order.indexOf(state.current_step_id);
  }
}
