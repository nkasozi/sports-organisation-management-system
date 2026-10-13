<script lang="ts">
    import { LOGOUT_WARNING_MODAL_STATE } from "$lib/presentation/logic/logoutWarningModalLogic";

    export let modal_state:
        | typeof LOGOUT_WARNING_MODAL_STATE.CHECKING
        | typeof LOGOUT_WARNING_MODAL_STATE.SYNCING;
</script>

<div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="logout-progress-title"
    tabindex="-1"
>
    <div
        class="bg-white dark:bg-accent-800 rounded-lg shadow-xl max-w-md w-full p-6 flex flex-col items-center"
    >
        <span
            class="animate-spin rounded-full h-8 w-8 border-2 border-theme-primary-200 border-t-theme-primary-600 mb-4"
        ></span>
        {#if modal_state === LOGOUT_WARNING_MODAL_STATE.SYNCING}
            <h3
                id="logout-progress-title"
                class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2"
            >
                Syncing your changes
            </h3>
            <p class="text-accent-600 dark:text-accent-400 text-center">
                Uploading your changes before signing out...
            </p>
        {:else}
            <p
                id="logout-progress-title"
                class="text-accent-600 dark:text-accent-400"
            >
                Checking for unsynced changes...
            </p>
        {/if}
    </div>
</div>
