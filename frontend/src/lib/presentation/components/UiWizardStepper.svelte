<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import UiWizardDesktopIndicators from "$lib/presentation/components/ui/wizard/UiWizardDesktopIndicators.svelte";
  import UiWizardMobileIndicators from "$lib/presentation/components/ui/wizard/UiWizardMobileIndicators.svelte";
  import UiWizardNavigation from "$lib/presentation/components/ui/wizard/UiWizardNavigation.svelte";
  import UiWizardProgressHeader from "$lib/presentation/components/ui/wizard/UiWizardProgressHeader.svelte";
  import {
    are_all_required_wizard_steps_completed,
    can_navigate_next_step,
    can_navigate_previous_step,
    get_current_wizard_step,
    get_wizard_progress_percentage,
    get_wizard_step_connector_class,
    get_wizard_step_status_class,
    is_final_wizard_step,
    type WizardStep,
  } from "$lib/presentation/logic/uiWizardStepper";

  export let steps: WizardStep[];
  export let current_step_index = 0;
  export let is_mobile_view = true;
  export let allow_skip_steps = false;
  export let is_busy = false;
  export let validate_step_change:
    | ((from_index: number, to_index: number) => boolean)
    | undefined = undefined;

  const dispatch = createEventDispatcher<{
    step_changed: {
      previous_index: number;
      new_index: number;
      step: WizardStep;
    };
    step_completed: { step_index: number; step: WizardStep };
    validation_failed: { step_index: number; target_index: number };
    wizard_cancelled: void;
    wizard_completed: { completed_steps: WizardStep[] };
  }>();

  $: current_step = get_current_wizard_step(steps, current_step_index);
  $: current_step_display =
    current_step.status === "present" ? current_step.step : {};
  $: progress_percentage = get_wizard_progress_percentage(
    current_step_index,
    steps.length,
  );
  $: can_go_to_previous_step = can_navigate_previous_step(current_step_index);
  $: can_go_to_next_step = can_navigate_next_step(
    current_step_index,
    steps,
    allow_skip_steps,
    validate_step_change != void 0,
  );
  $: is_final_step = is_final_wizard_step(current_step_index, steps.length);

  function navigate_to_step(target_step_index: number): void {
    if (
      is_busy ||
      target_step_index < 0 ||
      target_step_index >= steps.length ||
      target_step_index === current_step_index
    )
      return;
    if (validate_step_change && target_step_index > current_step_index) {
      const is_valid = validate_step_change(
        current_step_index,
        target_step_index,
      );
      if (!is_valid) {
        dispatch("validation_failed", {
          step_index: current_step_index,
          target_index: target_step_index,
        });
        return;
      }
    }
    const previous_index = current_step_index;
    current_step_index = target_step_index;
    dispatch("step_changed", {
      previous_index,
      new_index: target_step_index,
      step: steps[target_step_index],
    });
  }

  function navigate_to_previous_step(): void {
    if (can_go_to_previous_step) navigate_to_step(current_step_index - 1);
  }

  function navigate_to_next_step(): void {
    if (can_go_to_next_step) navigate_to_step(current_step_index + 1);
  }

  function mark_current_step_completed(): void {
    if (is_busy || current_step.status !== "present") return;
    current_step.step.is_completed = true;
    dispatch("step_completed", {
      step_index: current_step_index,
      step: current_step.step,
    });
    if (are_all_required_wizard_steps_completed(steps))
      dispatch("wizard_completed", { completed_steps: steps });
  }

  function cancel_wizard(): void {
    if (!is_busy) dispatch("wizard_cancelled");
  }

  function get_step_connector_class(step_index: number): string {
    return get_wizard_step_connector_class(
      steps,
      current_step_index,
      step_index,
    );
  }

  export function complete_current_step(): void {
    mark_current_step_completed();
  }

  export function get_wizard_status(): {
    completed_steps: number;
    current_step: number;
    progress: number;
    total_steps: number;
  } {
    return {
      completed_steps: steps.filter((step: WizardStep) => step.is_completed)
        .length,
      current_step: current_step_index + 1,
      progress: progress_percentage,
      total_steps: steps.length,
    };
  }
</script>

<div class="w-full max-w-4xl mx-auto px-2 sm:px-0" style="min-height: 100%;">
  <div class="mb-6 sm:mb-8">
    <UiWizardProgressHeader
      {current_step_index}
      {progress_percentage}
      total_steps={steps.length}
    />
    {#if is_mobile_view}
      <UiWizardMobileIndicators
        {can_go_to_next_step}
        {can_go_to_previous_step}
        current_step={current_step_display}
        {current_step_index}
        get_step_status_class={(step, step_index) =>
          get_wizard_step_status_class(
            step ? step : {},
            current_step_index,
            step_index,
          )}
        on_next={navigate_to_next_step}
        on_previous={navigate_to_previous_step}
        {steps}
      />
    {:else}
      <UiWizardDesktopIndicators
        {allow_skip_steps}
        {current_step_index}
        {get_step_connector_class}
        get_step_status_class={(step, step_index) =>
          get_wizard_step_status_class(
            step ? step : {},
            current_step_index,
            step_index,
          )}
        on_navigate_to_step={navigate_to_step}
        {steps}
      />
    {/if}
  </div>

  <div style="min-height: {is_mobile_view ? '300px' : '400px'};">
    <slot
      current_step={current_step_display}
      step_index={current_step_index}
      can_go_previous={can_go_to_previous_step}
      can_go_next={can_go_to_next_step}
      is_final={is_final_step}
    />
  </div>

  <UiWizardNavigation
    {can_go_to_next_step}
    {can_go_to_previous_step}
    current_step={current_step_display}
    {is_busy}
    {is_final_step}
    on_cancel={cancel_wizard}
    on_complete={mark_current_step_completed}
    on_next={navigate_to_next_step}
    on_previous={navigate_to_previous_step}
  />
</div>
