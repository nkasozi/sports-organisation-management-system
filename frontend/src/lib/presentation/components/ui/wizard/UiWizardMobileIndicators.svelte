<script lang="ts">
  import type { WizardStep } from "$lib/presentation/logic/uiWizardStepper";

  export let can_go_to_next_step: boolean;
  export let can_go_to_previous_step: boolean;
  export let current_step: WizardStep | null;
  export let current_step_index: number;
  export let get_step_status_class: (
    step: WizardStep | null,
    step_index: number,
  ) => string;
  export let on_next: () => void;
  export let on_previous: () => void;
  export let steps: WizardStep[];
</script>

<div class="flex items-center justify-between">
  {#if can_go_to_previous_step}
    <button
      class="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400"
      on:click={on_previous}
    >
      <span
        class="w-6 h-6 rounded-full {get_step_status_class(
          steps[current_step_index - 1],
          current_step_index - 1,
        )} flex items-center justify-center text-xs">{current_step_index}</span
      >
      <span class="hidden sm:block"
        >{steps[current_step_index - 1]?.step_title}</span
      >
    </button>
  {:else}
    <div></div>
  {/if}

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
      >{current_step?.step_title}</span
    >
  </div>

  {#if can_go_to_next_step}
    <button
      class="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400"
      on:click={on_next}
    >
      <span
        class="w-6 h-6 rounded-full {get_step_status_class(
          steps[current_step_index + 1],
          current_step_index + 1,
        )} flex items-center justify-center text-xs"
        >{current_step_index + 2}</span
      >
      <span class="hidden sm:block"
        >{steps[current_step_index + 1]?.step_title}</span
      >
    </button>
  {:else}
    <div></div>
  {/if}
</div>
