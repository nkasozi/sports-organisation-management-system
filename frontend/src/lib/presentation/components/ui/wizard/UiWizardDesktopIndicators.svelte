<script lang="ts">
  import type { WizardStep } from "$lib/presentation/logic/uiWizardStepper";

  export let allow_skip_steps: boolean;
  export let current_step_index: number;
  export let get_step_connector_class: (step_index: number) => string;
  export let get_step_status_class: (
    step: WizardStep | null,
    step_index: number,
  ) => string;
  export let on_navigate_to_step: (step_index: number) => void;
  export let steps: WizardStep[];
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    {#each steps as step, step_index}
      <div class="flex items-center flex-1">
        <button
          class="w-8 h-8 rounded-full {get_step_status_class(
            step,
            step_index,
          )} flex items-center justify-center font-semibold text-sm transition-colors duration-200 hover:opacity-80"
          on:click={() => on_navigate_to_step(step_index)}
          disabled={!allow_skip_steps && step_index > current_step_index}
        >
          {#if step.is_completed}✓{:else}{step_index + 1}{/if}
        </button>
        {#if step_index < steps.length - 1}<div
            class="flex-1 h-0.5 mx-2 {get_step_connector_class(step_index)}"
          ></div>{/if}
      </div>
    {/each}
  </div>
  <div class="flex justify-between mt-2">
    {#each steps as step}
      <div class="flex-1 text-center">
        <div
          class="text-xs sm:text-sm font-medium text-secondary-900 dark:text-secondary-100"
        >
          {step.step_title}
        </div>
        {#if step.step_description}<div
            class="text-xs text-secondary-600 dark:text-secondary-400 mt-1"
          >
            {step.step_description}
          </div>{/if}
      </div>
    {/each}
  </div>
</div>
