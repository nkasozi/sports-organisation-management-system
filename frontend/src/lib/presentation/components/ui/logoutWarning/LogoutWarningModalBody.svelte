<script lang="ts">
  import type { LogoutWarningModalState } from "$lib/presentation/logic/logoutWarningModalLogic";

  export let modal_state: LogoutWarningModalState;
  export let sync_error_message: string;
  export let on_cancel: () => void;
  export let on_logout_anyway: () => void;
  export let on_sync_and_logout: () => Promise<void>;
</script>

{#if modal_state === "checking"}
  <div class="flex flex-col items-center py-4">
    <span
      class="animate-spin rounded-full h-8 w-8 border-2 border-theme-primary-200 border-t-theme-primary-600 mb-4"
    ></span>
    <p class="text-accent-600 dark:text-accent-400">
      Checking for unsynced data...
    </p>
  </div>
{:else if modal_state === "warning"}
  <div class="space-y-6">
    <div>
      <h3
        id="modal-title"
        class="text-lg font-semibold text-accent-900 dark:text-accent-100"
      >
        Unsynced Changes Detected
      </h3>
      <p class="mt-2 text-accent-600 dark:text-accent-400">
        You have local changes that haven't been synced to the server yet. Would
        you like to sync your data before logging out?
      </p>
    </div>
    <div class="flex flex-col gap-2">
      <button
        type="button"
        class="btn btn-primary w-full"
        on:click={on_sync_and_logout}>Sync and Logout</button
      >
      <button
        type="button"
        class="btn bg-red-600 hover:bg-red-700 text-white w-full"
        on:click={on_logout_anyway}
        >Logout Without Syncing (Data Will Be Lost)</button
      >
      <button type="button" class="btn btn-outline w-full" on:click={on_cancel}
        >Cancel</button
      >
    </div>
  </div>
{:else if modal_state === "syncing"}
  <div class="flex flex-col items-center py-4">
    <span
      class="animate-spin rounded-full h-8 w-8 border-2 border-theme-primary-200 border-t-theme-primary-600 mb-4"
    ></span>
    <h3 class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2">
      Syncing Your Data
    </h3>
    <p class="text-accent-600 dark:text-accent-400 text-center">
      Please wait while we upload your changes to the server...
    </p>
  </div>
{:else if modal_state === "sync_failed"}
  <div class="space-y-6">
    <div>
      <h3
        id="modal-title"
        class="text-lg font-semibold text-accent-900 dark:text-accent-100"
      >
        Sync Failed
      </h3>
      <p class="mt-2 text-accent-600 dark:text-accent-400">
        {sync_error_message}
      </p>
    </div>
    <div class="flex flex-col gap-2">
      <button
        type="button"
        class="btn btn-primary w-full"
        on:click={on_sync_and_logout}>Try Again</button
      >
      <button
        type="button"
        class="btn bg-red-600 hover:bg-red-700 text-white w-full"
        on:click={on_logout_anyway}>Logout Anyway (Data Will Be Lost)</button
      >
      <button type="button" class="btn btn-outline w-full" on:click={on_cancel}
        >Cancel</button
      >
    </div>
  </div>
{:else if modal_state === "offline"}
  <div class="space-y-6">
    <div>
      <h3
        id="modal-title"
        class="text-lg font-semibold text-accent-900 dark:text-accent-100"
      >
        You're Offline
      </h3>
      <p class="mt-2 text-accent-600 dark:text-accent-400">
        You have unsynced changes but are currently offline. These changes
        cannot be saved to the server until you're back online.
      </p>
    </div>
    <div class="flex flex-col gap-2">
      <button
        type="button"
        class="btn bg-red-600 hover:bg-red-700 text-white w-full"
        on:click={on_logout_anyway}>Logout Anyway (Data Will Be Lost)</button
      >
      <button type="button" class="btn btn-outline w-full" on:click={on_cancel}
        >Stay Logged In</button
      >
    </div>
  </div>
{/if}
