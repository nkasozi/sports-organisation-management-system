<script lang="ts">
  import type { WizardStep } from "$lib/presentation/logic/uiWizardStepper";

  export let can_go_to_next_step: boolean;
  export let can_go_to_previous_step: boolean;
  export let current_step: WizardStep | null;
  export let is_busy: boolean;
  export let is_final_step: boolean;
  export let on_cancel: () => void;
  export let on_complete: () => void;
  export let on_next: () => void;
  export let on_previous: () => void;
</script>

<div
  class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 sm:mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
>
  <div class="flex gap-2 order-2 sm:order-1">
    <button class="btn btn-outline" on:click={on_cancel} disabled={is_busy}
      >Cancel</button
    >
  </div>
  <div class="flex gap-2 order-1 sm:order-2">
    <button
      class="btn btn-outline"
      on:click={on_previous}
      disabled={!can_go_to_previous_step || is_busy}>Previous</button
    >
    {#if is_final_step}
      <button
        class="btn btn-primary-action"
        on:click={on_complete}
        disabled={!current_step?.is_completed || is_busy}
        >{is_busy ? "Submitting..." : "Finish"}</button
      >
    {:else}
      <button
        class="btn btn-primary-action"
        on:click={on_next}
        disabled={!can_go_to_next_step || is_busy}>Next</button
      >
    {/if}
  </div>
</div>
