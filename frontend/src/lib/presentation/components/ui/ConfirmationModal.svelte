<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let is_visible: boolean = false;
  export let title: string = "Confirm Action";
  export let message: string = "Are you sure you want to proceed?";
  export let confirm_text: string = "Confirm";
  export let cancel_text: string = "Cancel";
  export let is_destructive: boolean = false;
  export let is_processing: boolean = false;

  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();

  function handle_confirm(): void {
    dispatch("confirm");
  }

  function handle_cancel(): void {
    dispatch("cancel");
  }

  function handle_backdrop_click(): void {
    if (!is_processing) {
      handle_cancel();
    }
  }

  function handle_key_down(event: KeyboardEvent): void {
    if (event.key === "Escape" && !is_processing) {
      handle_cancel();
    }
  }
</script>

<svelte:window on:keydown={handle_key_down} />

{#if is_visible}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    on:click={handle_backdrop_click}
    on:keydown={handle_backdrop_click}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <div
      class="bg-white dark:bg-accent-800 rounded-lg shadow-xl max-w-md w-full p-6"
      role="none"
    >
      <h3
        id="modal-title"
        class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2"
      >
        {title}
      </h3>

      <p class="text-accent-600 dark:text-accent-400 mb-6">
        {message}
      </p>

      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button
          type="button"
          class="btn btn-outline w-full sm:w-auto"
          disabled={is_processing}
          on:click={handle_cancel}
        >
          {cancel_text}
        </button>

        <button
          type="button"
          class="btn w-full sm:w-auto {is_destructive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'btn-primary'}"
          disabled={is_processing}
          on:click={handle_confirm}
        >
          {#if is_processing}
            <span class="flex items-center justify-center">
              <span
                class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"
              ></span>
              Processing...
            </span>
          {:else}
            {confirm_text}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
