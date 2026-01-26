<!--
UI Wizard Progress Stepper Component
Handles navigation between entity creation steps with secondary color theme
Follows coding rules: mobile-first, stateless helpers, explicit return types
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  // Component props
  export let steps: any[];
  export let current_step_index: number = 0;
  export let is_mobile_view: boolean = true;
  export let allow_skip_steps: boolean = false;
  export let is_busy: boolean = false;
  export let validate_step_change:
    | ((from_index: number, to_index: number) => boolean)
    | null = null;

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    step_changed: { previous_index: number; new_index: number; step: any };
    step_completed: { step_index: number; step: any };
    wizard_completed: { completed_steps: any[] };
    wizard_cancelled: void;
    validation_failed: { step_index: number; target_index: number };
  }>();

  // Computed values
  $: current_step = get_current_step_from_index(steps, current_step_index);
  $: progress_percentage = calculate_progress_percentage(
    current_step_index,
    steps.length,
  );
  $: can_go_to_previous_step =
    determine_if_previous_step_available(current_step_index);
  $: can_go_to_next_step = determine_if_next_step_available(
    current_step_index,
    steps,
    validate_step_change !== null,
  );
  $: is_final_step = check_if_final_step(current_step_index, steps.length);

  function get_current_step_from_index(
    step_list: any[],
    index: number,
  ): any | null {
    if (index < 0 || index >= step_list.length) return null;
    return step_list[index];
  }

  function calculate_progress_percentage(
    current_index: number,
    total_steps: number,
  ): number {
    if (total_steps === 0) return 0;
    return Math.round(((current_index + 1) / total_steps) * 100);
  }

  function determine_if_previous_step_available(
    current_index: number,
  ): boolean {
    return current_index > 0;
  }

  function determine_if_next_step_available(
    current_index: number,
    step_list: any[],
    has_custom_validation: boolean,
  ): boolean {
    if (current_index >= step_list.length - 1) return false;

    const current = step_list[current_index];
    if (!current) return false;

    if (has_custom_validation) return true;

    return current.is_completed || (allow_skip_steps && current.is_optional);
  }

  function check_if_final_step(
    current_index: number,
    total_steps: number,
  ): boolean {
    return current_index === total_steps - 1;
  }

  function navigate_to_step(target_step_index: number): void {
    if (is_busy) return;
    if (target_step_index < 0 || target_step_index >= steps.length) return;
    if (target_step_index === current_step_index) return;

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

    const new_step = steps[target_step_index];
    dispatch("step_changed", {
      previous_index,
      new_index: target_step_index,
      step: new_step,
    });
  }

  function navigate_to_previous_step(): void {
    if (can_go_to_previous_step) {
      navigate_to_step(current_step_index - 1);
    }
  }

  function navigate_to_next_step(): void {
    if (can_go_to_next_step) {
      navigate_to_step(current_step_index + 1);
    }
  }

  function mark_current_step_completed(): void {
    if (is_busy) return;
    if (current_step) {
      current_step.is_completed = true;
      dispatch("step_completed", {
        step_index: current_step_index,
        step: current_step,
      });

      // Check if wizard is now complete
      const all_required_steps_completed =
        check_if_all_required_steps_completed(steps);
      if (all_required_steps_completed) {
        dispatch("wizard_completed", { completed_steps: steps });
      }
    }
  }

  function check_if_all_required_steps_completed(step_list: any[]): boolean {
    return step_list.every((step) => step.is_completed || step.is_optional);
  }

  function cancel_wizard(): void {
    if (is_busy) return;
    dispatch("wizard_cancelled");
  }

  function get_step_status_class(step: any, step_index: number): string {
    if (step_index === current_step_index) {
      return "bg-secondary-600 text-white dark:bg-secondary-500";
    }
    if (step.is_completed) {
      return "bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-100";
    }
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  }

  function get_step_connector_class(step_index: number): string {
    const is_current_or_completed =
      step_index <= current_step_index || steps[step_index]?.is_completed;
    return is_current_or_completed
      ? "bg-secondary-600 dark:bg-secondary-500"
      : "bg-gray-200 dark:bg-gray-600";
  }

  // Public API for parent components
  export function complete_current_step(): void {
    mark_current_step_completed();
  }

  export function get_wizard_status(): {
    current_step: number;
    total_steps: number;
    progress: number;
    completed_steps: number;
  } {
    const completed_count = steps.filter((step) => step.is_completed).length;
    return {
      current_step: current_step_index + 1,
      total_steps: steps.length,
      progress: progress_percentage,
      completed_steps: completed_count,
    };
  }
</script>

<!-- Main wizard container with mobile-first design -->
<div class="wizard-stepper w-full max-w-4xl mx-auto px-2 sm:px-0">
  <!-- Progress header -->
  <div class="wizard-progress-section mb-6 sm:mb-8">
    <!-- Progress bar -->
    <div class="progress-bar-container mb-4">
      <div class="flex justify-between items-center mb-2">
        <span
          class="text-sm font-medium text-secondary-700 dark:text-secondary-300"
        >
          Step {current_step_index + 1} of {steps.length}
        </span>
        <span
          class="text-sm font-medium text-secondary-700 dark:text-secondary-300"
        >
          {progress_percentage}% Complete
        </span>
      </div>

      <!-- Progress bar with secondary color -->
      <div
        class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
      >
        <div
          class="bg-secondary-600 dark:bg-secondary-500 h-2 rounded-full transition-all duration-300 ease-in-out"
          style="width: {progress_percentage}%"
        ></div>
      </div>
    </div>

    <!-- Step indicators -->
    <div class="step-indicators">
      {#if is_mobile_view}
        <!-- Mobile: Show only current step with previous/next context -->
        <div class="flex items-center justify-between">
          {#if can_go_to_previous_step}
            <button
              class="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400"
              on:click={navigate_to_previous_step}
            >
              <span
                class="w-6 h-6 rounded-full {get_step_status_class(
                  steps[current_step_index - 1],
                  current_step_index - 1,
                )} flex items-center justify-center text-xs"
              >
                {current_step_index}
              </span>
              <span class="hidden sm:block"
                >{steps[current_step_index - 1]?.step_title}</span
              >
            </button>
          {:else}
            <div></div>
          {/if}

          <!-- Current step (prominent) -->
          <div class="flex flex-col items-center space-y-1">
            <div
              class="w-8 h-8 rounded-full {get_step_status_class(
                current_step,
                current_step_index,
              )} flex items-center justify-center font-semibold"
            >
              {current_step_index + 1}
            </div>
            <span
              class="text-sm font-medium text-secondary-900 dark:text-secondary-100 text-center"
            >
              {current_step?.step_title}
            </span>
          </div>

          {#if can_go_to_next_step}
            <button
              class="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400"
              on:click={navigate_to_next_step}
            >
              <span
                class="w-6 h-6 rounded-full {get_step_status_class(
                  steps[current_step_index + 1],
                  current_step_index + 1,
                )} flex items-center justify-center text-xs"
              >
                {current_step_index + 2}
              </span>
              <span class="hidden sm:block"
                >{steps[current_step_index + 1]?.step_title}</span
              >
            </button>
          {:else}
            <div></div>
          {/if}
        </div>
      {:else}
        <!-- Desktop: Show all steps -->
        <div class="flex items-center justify-between">
          {#each steps as step, step_index}
            <div class="flex items-center">
              <!-- Step circle -->
              <button
                class="step-circle w-8 h-8 rounded-full {get_step_status_class(
                  step,
                  step_index,
                )} flex items-center justify-center font-semibold text-sm transition-colors duration-200 hover:opacity-80"
                on:click={() => navigate_to_step(step_index)}
                disabled={!allow_skip_steps && step_index > current_step_index}
              >
                {#if step.is_completed}
                  ✓
                {:else}
                  {step_index + 1}
                {/if}
              </button>

              <!-- Step connector line (except for last step) -->
              {#if step_index < steps.length - 1}
                <div
                  class="step-connector flex-1 h-0.5 mx-2 {get_step_connector_class(
                    step_index,
                  )}"
                ></div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Step titles -->
        <div class="flex justify-between mt-2">
          {#each steps as step, step_index}
            <div class="flex-1 text-center">
              <div
                class="text-xs sm:text-sm font-medium text-secondary-900 dark:text-secondary-100"
              >
                {step.step_title}
              </div>
              {#if step.step_description}
                <div
                  class="text-xs text-secondary-600 dark:text-secondary-400 mt-1"
                >
                  {step.step_description}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Current step content area -->
  <div class="wizard-content-area">
    <slot
      {current_step}
      step_index={current_step_index}
      can_go_previous={can_go_to_previous_step}
      can_go_next={can_go_to_next_step}
      is_final={is_final_step}
    />
  </div>

  <!-- Navigation buttons -->
  <div
    class="wizard-navigation flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 sm:mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
  >
    <div class="flex gap-2 order-2 sm:order-1">
      <button
        class="btn btn-outline"
        on:click={cancel_wizard}
        disabled={is_busy}
      >
        Cancel
      </button>
    </div>

    <div class="flex gap-2 order-1 sm:order-2">
      <button
        class="btn btn-outline"
        on:click={navigate_to_previous_step}
        disabled={!can_go_to_previous_step || is_busy}
      >
        Previous
      </button>

      {#if is_final_step}
        <button
          class="btn btn-secondary"
          on:click={mark_current_step_completed}
          disabled={!current_step?.is_completed || is_busy}
        >
          {is_busy ? "Submitting..." : "Finish"}
        </button>
      {:else}
        <button
          class="btn btn-secondary"
          on:click={navigate_to_next_step}
          disabled={!can_go_to_next_step || is_busy}
        >
          Next
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .wizard-stepper {
    min-height: 100%;
  }

  .step-circle {
    min-width: 2rem;
    min-height: 2rem;
  }

  .step-connector {
    min-width: 2rem;
  }

  .wizard-content-area {
    min-height: 400px;
  }

  /* Mobile-first responsive adjustments */
  @media (max-width: 640px) {
    .wizard-stepper {
      padding: 0.5rem;
    }

    .wizard-content-area {
      min-height: 300px;
    }
  }
</style>
