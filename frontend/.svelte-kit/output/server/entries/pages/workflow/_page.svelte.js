import { e as escape_html, d as attr_style, f as attr_class, s as stringify, a as ensure_array_like, c as attr, g as slot, i as bind_props, p as pop, b as push, h as head, j as invalid_default_snippet } from "../../../chunks/index2.js";
import { f as fallback } from "../../../chunks/utils.js";
import { E as EntityCrudWrapper, D as DynamicEntityForm, a as DynamicEntityList } from "../../../chunks/EntityCrudWrapper.js";
function UiWizardStepper($$payload, $$props) {
  push();
  let current_step, progress_percentage, can_go_to_previous_step, can_go_to_next_step, is_final_step;
  let steps = $$props["steps"];
  let current_step_index = fallback($$props["current_step_index"], 0);
  let is_mobile_view = fallback($$props["is_mobile_view"], true);
  let allow_skip_steps = fallback($$props["allow_skip_steps"], false);
  function get_current_step_from_index(step_list, index) {
    if (index < 0 || index >= step_list.length) return null;
    return step_list[index];
  }
  function calculate_progress_percentage(current_index, total_steps) {
    if (total_steps === 0) return 0;
    return Math.round((current_index + 1) / total_steps * 100);
  }
  function determine_if_previous_step_available(current_index) {
    return current_index > 0;
  }
  function determine_if_next_step_available(current_index, step_list) {
    if (current_index >= step_list.length - 1) return false;
    const current = step_list[current_index];
    if (!current) return false;
    return current.is_completed || allow_skip_steps && current.is_optional;
  }
  function check_if_final_step(current_index, total_steps) {
    return current_index === total_steps - 1;
  }
  function mark_current_step_completed() {
    if (current_step) {
      current_step.is_completed = true;
      check_if_all_required_steps_completed(steps);
    }
  }
  function check_if_all_required_steps_completed(step_list) {
    return step_list.every((step) => step.is_completed || step.is_optional);
  }
  function get_step_status_class(step, step_index) {
    if (step_index === current_step_index) {
      return "bg-secondary-600 text-white dark:bg-secondary-500";
    }
    if (step.is_completed) {
      return "bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100";
    }
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  }
  function get_step_connector_class(step_index) {
    const is_current_or_completed = step_index <= current_step_index || steps[step_index]?.is_completed;
    return is_current_or_completed ? "bg-secondary-600 dark:bg-secondary-500" : "bg-gray-200 dark:bg-gray-600";
  }
  function complete_current_step() {
    mark_current_step_completed();
  }
  function get_wizard_status() {
    const completed_count = steps.filter((step) => step.is_completed).length;
    return {
      current_step: current_step_index + 1,
      total_steps: steps.length,
      progress: progress_percentage,
      completed_steps: completed_count
    };
  }
  current_step = get_current_step_from_index(steps, current_step_index);
  progress_percentage = calculate_progress_percentage(current_step_index, steps.length);
  can_go_to_previous_step = determine_if_previous_step_available(current_step_index);
  can_go_to_next_step = determine_if_next_step_available(current_step_index, steps);
  is_final_step = check_if_final_step(current_step_index, steps.length);
  $$payload.out.push(`<div class="wizard-stepper w-full max-w-4xl mx-auto px-2 sm:px-0 svelte-1a0vlox"><div class="wizard-progress-section mb-6 sm:mb-8"><div class="progress-bar-container mb-4"><div class="flex justify-between items-center mb-2"><span class="text-sm font-medium text-secondary-700 dark:text-secondary-300">Step ${escape_html(current_step_index + 1)} of ${escape_html(steps.length)}</span> <span class="text-sm font-medium text-secondary-700 dark:text-secondary-300">${escape_html(progress_percentage)}% Complete</span></div> <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"><div class="bg-secondary-600 dark:bg-secondary-500 h-2 rounded-full transition-all duration-300 ease-in-out"${attr_style(`width: ${stringify(progress_percentage)}%`)}></div></div></div> <div class="step-indicators">`);
  if (is_mobile_view) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex items-center justify-between">`);
    if (can_go_to_previous_step) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<button class="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400"><span${attr_class(`w-6 h-6 rounded-full ${stringify(get_step_status_class(steps[current_step_index - 1], current_step_index - 1))} flex items-center justify-center text-xs`, "svelte-1a0vlox")}>${escape_html(current_step_index)}</span> <span class="hidden sm:block">${escape_html(steps[current_step_index - 1]?.step_title)}</span></button>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div></div>`);
    }
    $$payload.out.push(`<!--]--> <div class="flex flex-col items-center space-y-1"><div${attr_class(`w-8 h-8 rounded-full ${stringify(get_step_status_class(current_step, current_step_index))} flex items-center justify-center font-semibold`, "svelte-1a0vlox")}>${escape_html(current_step_index + 1)}</div> <span class="text-sm font-medium text-secondary-900 dark:text-secondary-100 text-center">${escape_html(current_step?.step_title)}</span></div> `);
    if (can_go_to_next_step) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<button class="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400"><span${attr_class(`w-6 h-6 rounded-full ${stringify(get_step_status_class(steps[current_step_index + 1], current_step_index + 1))} flex items-center justify-center text-xs`, "svelte-1a0vlox")}>${escape_html(current_step_index + 2)}</span> <span class="hidden sm:block">${escape_html(steps[current_step_index + 1]?.step_title)}</span></button>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div></div>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    const each_array = ensure_array_like(steps);
    const each_array_1 = ensure_array_like(steps);
    $$payload.out.push(`<div class="flex items-center justify-between"><!--[-->`);
    for (let step_index = 0, $$length = each_array.length; step_index < $$length; step_index++) {
      let step = each_array[step_index];
      $$payload.out.push(`<div class="flex items-center"><button${attr_class(`step-circle w-8 h-8 rounded-full ${stringify(get_step_status_class(step, step_index))} flex items-center justify-center font-semibold text-sm transition-colors duration-200 hover:opacity-80`, "svelte-1a0vlox")}${attr("disabled", !allow_skip_steps && step_index > current_step_index, true)}>`);
      if (step.is_completed) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`✓`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`${escape_html(step_index + 1)}`);
      }
      $$payload.out.push(`<!--]--></button> `);
      if (step_index < steps.length - 1) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div${attr_class(`step-connector flex-1 h-0.5 mx-2 ${stringify(get_step_connector_class(step_index))}`, "svelte-1a0vlox")}></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    }
    $$payload.out.push(`<!--]--></div> <div class="flex justify-between mt-2"><!--[-->`);
    for (let step_index = 0, $$length = each_array_1.length; step_index < $$length; step_index++) {
      let step = each_array_1[step_index];
      $$payload.out.push(`<div class="flex-1 text-center"><div class="text-xs sm:text-sm font-medium text-secondary-900 dark:text-secondary-100">${escape_html(step.step_title)}</div> `);
      if (step.step_description) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="text-xs text-secondary-600 dark:text-secondary-400 mt-1">${escape_html(step.step_description)}</div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="wizard-content-area svelte-1a0vlox"><!---->`);
  slot(
    $$payload,
    $$props,
    "default",
    {
      current_step,
      step_index: current_step_index,
      can_go_previous: can_go_to_previous_step,
      can_go_next: can_go_to_next_step,
      is_final: is_final_step
    }
  );
  $$payload.out.push(`<!----></div> <div class="wizard-navigation flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 sm:mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"><div class="flex gap-2 order-2 sm:order-1"><button class="btn btn-outline">Cancel</button></div> <div class="flex gap-2 order-1 sm:order-2"><button class="btn btn-outline"${attr("disabled", !can_go_to_previous_step, true)}>Previous</button> `);
  if (is_final_step) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="btn btn-secondary"${attr("disabled", !current_step?.is_completed, true)}>Finish</button>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<button class="btn btn-secondary"${attr("disabled", !can_go_to_next_step, true)}>Next</button>`);
  }
  $$payload.out.push(`<!--]--></div></div></div>`);
  bind_props($$props, {
    steps,
    current_step_index,
    is_mobile_view,
    allow_skip_steps,
    complete_current_step,
    get_wizard_status
  });
  pop();
}
const SPORTS_WORKFLOW_STEPS = [
  {
    step_id: "select_organization",
    step_name: "Select Organization",
    step_description: "Choose the organization for your sports management setup",
    entity_type: "organization",
    required_selection_count: 1,
    min_selection_count: 1,
    max_selection_count: 1,
    is_optional: false,
    next_step_id: "select_competition",
    error_message_template: "Please select exactly 1 organization to continue"
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
    error_message_template: "Please select exactly 1 competition to continue"
  },
  {
    step_id: "select_teams",
    step_name: "Select Teams",
    step_description: "Choose the teams that will participate in this competition",
    entity_type: "team",
    required_selection_count: -1,
    // Any number > 0
    min_selection_count: 2,
    max_selection_count: -1,
    // Unlimited
    is_optional: false,
    next_step_id: "select_players",
    error_message_template: "Please select at least 2 teams to continue"
  },
  {
    step_id: "select_players",
    step_name: "Select Players",
    step_description: "Choose players for the selected teams (optional)",
    entity_type: "player",
    required_selection_count: -1,
    // Any number >= 0
    min_selection_count: 0,
    max_selection_count: -1,
    // Unlimited
    is_optional: true,
    next_step_id: "select_officials",
    error_message_template: "You can select any number of players or skip this step"
  },
  {
    step_id: "select_officials",
    step_name: "Select Officials",
    step_description: "Choose referees and officials for the competition",
    entity_type: "official",
    required_selection_count: -1,
    // Any number > 0
    min_selection_count: 1,
    max_selection_count: -1,
    // Unlimited
    is_optional: false,
    next_step_id: "review_setup",
    error_message_template: "Please select at least 1 official to continue"
  },
  {
    step_id: "review_setup",
    step_name: "Review Setup",
    step_description: "Review your selections and complete the setup",
    entity_type: "",
    required_selection_count: 0,
    min_selection_count: 0,
    max_selection_count: 0,
    is_optional: true,
    error_message_template: "Setup is ready for completion"
  }
];
class WorkflowStateMachine {
  constructor() {
    this.step_definitions = {};
    this.step_order = [];
    for (const step_def of SPORTS_WORKFLOW_STEPS) {
      this.step_definitions[step_def.step_id] = step_def;
      this.step_order.push(step_def.step_id);
    }
  }
  create_initial_workflow_state() {
    const step_states = {};
    for (const step_def of SPORTS_WORKFLOW_STEPS) {
      step_states[step_def.step_id] = {
        step_definition: step_def,
        selected_entities: [],
        is_selection_valid: step_def.is_optional,
        // Optional steps start as valid
        validation_error_message: step_def.is_optional ? "" : step_def.error_message_template,
        is_completed: false
      };
    }
    return {
      current_step_id: this.step_order[0],
      step_states,
      completed_step_ids: /* @__PURE__ */ new Set(),
      workflow_entities: {},
      can_proceed_to_next_step: false,
      can_go_back_to_previous_step: false
    };
  }
  update_step_selection(current_state, step_id, selected_entities) {
    if (!this.step_definitions[step_id]) {
      return {
        success: false,
        new_state: current_state,
        error_message: `Invalid step ID: ${step_id}`
      };
    }
    const step_def = this.step_definitions[step_id];
    const step_state = current_state.step_states[step_id];
    const validation_result = this.validate_selection_count(step_def, selected_entities.length);
    const new_step_state = {
      ...step_state,
      selected_entities: [...selected_entities],
      is_selection_valid: validation_result.is_valid,
      validation_error_message: validation_result.error_message,
      is_completed: validation_result.is_valid
    };
    const new_state = {
      ...current_state,
      step_states: {
        ...current_state.step_states,
        [step_id]: new_step_state
      },
      workflow_entities: {
        ...current_state.workflow_entities,
        [step_def.entity_type]: [...selected_entities]
      }
    };
    new_state.can_proceed_to_next_step = this.can_proceed_to_next_step_from_current(new_state);
    new_state.can_go_back_to_previous_step = this.can_go_back_to_previous_step_from_current(new_state);
    return {
      success: true,
      new_state
    };
  }
  transition_to_next_step(current_state) {
    const current_step_def = this.step_definitions[current_state.current_step_id];
    if (!current_step_def.next_step_id) {
      return {
        success: false,
        new_state: current_state,
        error_message: "Already at the final step"
      };
    }
    const current_step_state = current_state.step_states[current_state.current_step_id];
    if (!current_step_state.is_selection_valid) {
      return {
        success: false,
        new_state: current_state,
        error_message: current_step_state.validation_error_message
      };
    }
    const new_completed_step_ids = new Set(current_state.completed_step_ids);
    new_completed_step_ids.add(current_state.current_step_id);
    const new_state = {
      ...current_state,
      current_step_id: current_step_def.next_step_id,
      completed_step_ids: new_completed_step_ids
    };
    new_state.can_proceed_to_next_step = this.can_proceed_to_next_step_from_current(new_state);
    new_state.can_go_back_to_previous_step = this.can_go_back_to_previous_step_from_current(new_state);
    return {
      success: true,
      new_state
    };
  }
  transition_to_previous_step(current_state) {
    const current_step_index = this.step_order.indexOf(current_state.current_step_id);
    if (current_step_index <= 0) {
      return {
        success: false,
        new_state: current_state,
        error_message: "Already at the first step"
      };
    }
    const previous_step_id = this.step_order[current_step_index - 1];
    const new_state = {
      ...current_state,
      current_step_id: previous_step_id
    };
    new_state.can_proceed_to_next_step = this.can_proceed_to_next_step_from_current(new_state);
    new_state.can_go_back_to_previous_step = this.can_go_back_to_previous_step_from_current(new_state);
    return {
      success: true,
      new_state
    };
  }
  validate_selection_count(step_def, selected_count) {
    if (step_def.is_optional && selected_count === 0) {
      return { is_valid: true, error_message: "" };
    }
    if (selected_count < step_def.min_selection_count) {
      const count_word = step_def.min_selection_count === 1 ? "item" : "items";
      return {
        is_valid: false,
        error_message: `Please select at least ${step_def.min_selection_count} ${count_word}`
      };
    }
    if (step_def.max_selection_count > 0 && selected_count > step_def.max_selection_count) {
      const count_word = step_def.max_selection_count === 1 ? "item" : "items";
      return {
        is_valid: false,
        error_message: `Please select no more than ${step_def.max_selection_count} ${count_word}`
      };
    }
    if (step_def.required_selection_count > 0 && selected_count !== step_def.required_selection_count) {
      const count_word = step_def.required_selection_count === 1 ? "item" : "items";
      return {
        is_valid: false,
        error_message: `Please select exactly ${step_def.required_selection_count} ${count_word}`
      };
    }
    return { is_valid: true, error_message: "" };
  }
  can_proceed_to_next_step_from_current(state) {
    const current_step_state = state.step_states[state.current_step_id];
    const current_step_def = this.step_definitions[state.current_step_id];
    return current_step_state.is_selection_valid && !!current_step_def.next_step_id;
  }
  can_go_back_to_previous_step_from_current(state) {
    const current_step_index = this.step_order.indexOf(state.current_step_id);
    return current_step_index > 0;
  }
  get_current_step_definition(state) {
    return this.step_definitions[state.current_step_id];
  }
  get_current_step_state(state) {
    return state.step_states[state.current_step_id];
  }
  get_workflow_progress_percentage(state) {
    const current_step_index = this.step_order.indexOf(state.current_step_id);
    return Math.round((current_step_index + 1) / this.step_order.length * 100);
  }
  is_workflow_complete(state) {
    return state.current_step_id === "review_setup" && state.step_states["review_setup"].is_completed;
  }
  get_step_order() {
    return [...this.step_order];
  }
  get_all_step_definitions() {
    return SPORTS_WORKFLOW_STEPS.map((step) => ({ ...step }));
  }
}
function _page($$payload, $$props) {
  push();
  let current_step_definition, current_step_state, wizard_steps, current_step_index;
  const workflow_state_machine = new WorkflowStateMachine();
  let current_workflow_state = workflow_state_machine.create_initial_workflow_state();
  let is_mobile_view = true;
  function should_show_crud_wrapper() {
    return current_step_definition.entity_type !== "";
  }
  current_step_definition = workflow_state_machine.get_current_step_definition(current_workflow_state);
  current_step_state = workflow_state_machine.get_current_step_state(current_workflow_state);
  workflow_state_machine.get_workflow_progress_percentage(current_workflow_state);
  workflow_state_machine.is_workflow_complete(current_workflow_state);
  wizard_steps = workflow_state_machine.get_all_step_definitions().map((step_def, index) => ({
    step_key: step_def.step_id,
    step_title: step_def.step_name,
    step_description: step_def.step_description,
    is_completed: current_workflow_state.completed_step_ids.has(step_def.step_id),
    is_optional: step_def.is_optional,
    entity_type: step_def.entity_type
  }));
  current_step_index = workflow_state_machine.get_step_order().indexOf(current_workflow_state.current_step_id);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Workflow Wizard - Sports Management</title>`;
  });
  $$payload.out.push(`<div class="workflow-page min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 svelte-1c5ar0y"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="text-center mb-8"><h1 class="text-2xl sm:text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2">Sports Management Workflow</h1> <p class="text-accent-600 dark:text-accent-400 max-w-2xl mx-auto">Complete setup for your sports organization by following these guided
        steps. Each step builds upon the previous one to create a comprehensive
        management system.</p></div> `);
  if (!current_step_state.is_selection_valid && current_step_state.validation_error_message) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"><strong>Selection Required:</strong> ${escape_html(current_step_state.validation_error_message)}</div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  UiWizardStepper($$payload, {
    wizard_steps,
    current_step_index,
    is_mobile_view,
    allow_skip_steps: false,
    children: invalid_default_snippet,
    $$slots: {
      default: ($$payload2, {
        current_step,
        step_index,
        can_go_previous,
        can_go_next,
        is_final
      }) => {
        if (should_show_crud_wrapper()) {
          $$payload2.out.push("<!--[-->");
          $$payload2.out.push(`<div class="step-content-wrapper svelte-1c5ar0y"><div class="mb-6 text-center"><h2 class="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-2">${escape_html(current_step_definition.step_title)}</h2> `);
          if (current_step_definition.step_description) {
            $$payload2.out.push("<!--[-->");
            $$payload2.out.push(`<p class="text-accent-600 dark:text-accent-400">${escape_html(current_step_definition.step_description)}</p>`);
          } else {
            $$payload2.out.push("<!--[!-->");
          }
          $$payload2.out.push(`<!--]--></div> <!---->`);
          {
            EntityCrudWrapper($$payload2, {
              entity_type: current_step_definition.entity_type,
              initial_view: "list",
              is_mobile_view,
              show_list_actions: true,
              $$slots: {
                "entity-list": ($$payload3, { entities, loading, error }) => {
                  $$payload3.out.push(`<div slot="entity-list">`);
                  DynamicEntityList($$payload3, {
                    entity_type: current_step_definition.entity_type,
                    entities,
                    loading,
                    error,
                    allow_multiple_selection: current_step_definition.allow_multiple_selection,
                    selected_entity_ids: current_step_state.selected_entities.map((e) => e.id),
                    is_mobile_view
                  });
                  $$payload3.out.push(`<!----></div>`);
                },
                "entity-form": ($$payload3, { form_mode, selected_entity }) => {
                  $$payload3.out.push(`<div slot="entity-form">`);
                  DynamicEntityForm($$payload3, {
                    entity_type: current_step_definition.entity_type,
                    form_mode,
                    selected_entity
                  });
                  $$payload3.out.push(`<!----></div>`);
                }
              }
            });
          }
          $$payload2.out.push(`<!----></div>`);
        } else {
          $$payload2.out.push("<!--[!-->");
          const each_array = ensure_array_like(current_workflow_state.workflow_entities.organizations);
          const each_array_1 = ensure_array_like(current_workflow_state.workflow_entities.competitions);
          const each_array_2 = ensure_array_like(current_workflow_state.workflow_entities.teams);
          const each_array_4 = ensure_array_like(current_workflow_state.workflow_entities.officials);
          $$payload2.out.push(`<div class="review-step-content svelte-1c5ar0y"><div class="text-center mb-8"><h2 class="text-xl font-semibold text-accent-900 dark:text-accent-100 mb-2">Workflow Complete</h2> <p class="text-accent-600 dark:text-accent-400">Review your setup and begin managing your sports organization.</p></div> <div class="card p-6 space-y-6"><h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100">Setup Summary</h3> <div class="space-y-4"><div class="border rounded-lg p-4"><h4 class="font-semibold text-lg mb-2">Selected Organization</h4> <!--[-->`);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let org = each_array[$$index];
            $$payload2.out.push(`<p class="text-gray-700">${escape_html(org.attributes?.name || org.id)}</p>`);
          }
          $$payload2.out.push(`<!--]--></div> <div class="border rounded-lg p-4"><h4 class="font-semibold text-lg mb-2">Selected Competition</h4> <!--[-->`);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let comp = each_array_1[$$index_1];
            $$payload2.out.push(`<p class="text-gray-700">${escape_html(comp.attributes?.name || comp.id)}</p>`);
          }
          $$payload2.out.push(`<!--]--></div> <div class="border rounded-lg p-4"><h4 class="font-semibold text-lg mb-2">Selected Teams (${escape_html(current_workflow_state.workflow_entities.teams.length)})</h4> <!--[-->`);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let team = each_array_2[$$index_2];
            $$payload2.out.push(`<p class="text-gray-700">• ${escape_html(team.attributes?.name || team.id)}</p>`);
          }
          $$payload2.out.push(`<!--]--></div> `);
          if (current_workflow_state.workflow_entities.players.length > 0) {
            $$payload2.out.push("<!--[-->");
            const each_array_3 = ensure_array_like(current_workflow_state.workflow_entities.players);
            $$payload2.out.push(`<div class="border rounded-lg p-4"><h4 class="font-semibold text-lg mb-2">Selected Players (${escape_html(current_workflow_state.workflow_entities.players.length)})</h4> <!--[-->`);
            for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
              let player = each_array_3[$$index_3];
              $$payload2.out.push(`<p class="text-gray-700">• ${escape_html(player.attributes?.name || player.id)}</p>`);
            }
            $$payload2.out.push(`<!--]--></div>`);
          } else {
            $$payload2.out.push("<!--[!-->");
          }
          $$payload2.out.push(`<!--]--> <div class="border rounded-lg p-4"><h4 class="font-semibold text-lg mb-2">Selected Officials (${escape_html(current_workflow_state.workflow_entities.officials.length)})</h4> <!--[-->`);
          for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
            let official = each_array_4[$$index_4];
            $$payload2.out.push(`<p class="text-gray-700">• ${escape_html(official.attributes?.name || official.id)}</p>`);
          }
          $$payload2.out.push(`<!--]--></div></div> <div class="text-center pt-6 border-t border-gray-200 dark:border-gray-700"><p class="text-accent-600 dark:text-accent-400 mb-4">Your sports organization is ready! You can now manage
                competitions, schedule games, and track events.</p> <div class="flex flex-col sm:flex-row gap-4 justify-center"><a href="/" class="btn btn-outline">Go to Dashboard</a> <button class="btn btn-secondary">Complete Setup</button></div></div></div></div>`);
        }
        $$payload2.out.push(`<!--]-->`);
      }
    }
  });
  $$payload.out.push(`<!----></div></div>`);
  pop();
}
export {
  _page as default
};
