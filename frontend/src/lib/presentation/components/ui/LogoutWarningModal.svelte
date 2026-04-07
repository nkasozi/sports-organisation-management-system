<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import LogoutWarningModalBody from "$lib/presentation/components/ui/logoutWarning/LogoutWarningModalBody.svelte";
  import {
    get_logout_warning_modal_state,
    type LogoutWarningModalState,
    sync_logout_warning_modal_changes,
  } from "$lib/presentation/logic/logoutWarningModalLogic";

  export let is_visible = false;

  const dispatch = createEventDispatcher<{
    cancel: void;
    confirm_logout: void;
  }>();

  let modal_state: LogoutWarningModalState = "checking";
  let sync_error_message = "";

  $: if (is_visible) {
    const state_result = get_logout_warning_modal_state();
    modal_state = state_result.modal_state;
    if (state_result.should_confirm_logout) dispatch("confirm_logout");
  }

  async function handle_sync_and_logout(): Promise<void> {
    modal_state = "syncing";
    const sync_result = await sync_logout_warning_modal_changes();
    modal_state = sync_result.modal_state;
    sync_error_message = sync_result.sync_error_message;
    if (sync_result.should_confirm_logout) dispatch("confirm_logout");
  }

  function handle_logout_anyway(): void {
    dispatch("confirm_logout");
  }

  function handle_cancel(): void {
    dispatch("cancel");
  }

  function handle_backdrop_click(): void {
    if (modal_state !== "syncing") handle_cancel();
  }

  function handle_key_down(event: KeyboardEvent): void {
    if (event.key === "Escape" && modal_state !== "syncing") handle_cancel();
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
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <LogoutWarningModalBody
        {modal_state}
        {sync_error_message}
        on_cancel={handle_cancel}
        on_logout_anyway={handle_logout_anyway}
        on_sync_and_logout={handle_sync_and_logout}
      />
    </div>
  </div>
{/if}
