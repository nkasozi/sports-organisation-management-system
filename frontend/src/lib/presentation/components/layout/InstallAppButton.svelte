<script lang="ts">
    import { APP_INSTALL_STATE } from "$lib/presentation/logic/appInstallState";
    import { app_install_store } from "$lib/presentation/stores/appInstallStore";

    const INSTALL_BUTTON_LABEL = "Install app";
    let show_ios_steps = false;

    async function handle_install_click(): Promise<void> {
        switch ($app_install_store) {
            case APP_INSTALL_STATE.PROMPT_READY:
                await app_install_store.request_install();
                return;
            case APP_INSTALL_STATE.IOS_INSTRUCTIONS:
                show_ios_steps = !show_ios_steps;
                return;
            case APP_INSTALL_STATE.INSTALLED:
            case APP_INSTALL_STATE.UNAVAILABLE:
                return;
        }
    }
</script>

{#if $app_install_store === APP_INSTALL_STATE.PROMPT_READY || $app_install_store === APP_INSTALL_STATE.IOS_INSTRUCTIONS}
    <div class="relative">
        <button
            type="button"
            on:click={handle_install_click}
            class="flex items-center gap-2 px-3 py-1.5 rounded-[0.175rem] bg-white/15 hover:bg-white/25 transition-colors text-sm text-white/90"
            title={INSTALL_BUTTON_LABEL}
            aria-label={INSTALL_BUTTON_LABEL}
            aria-expanded={show_ios_steps}
        >
            <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"
                />
            </svg>
            <span class="hidden sm:inline">{INSTALL_BUTTON_LABEL}</span>
        </button>
        {#if show_ios_steps}
            <div
                class="absolute right-0 mt-2 w-64 z-50 p-3 rounded-lg shadow-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                style="text-shadow: none"
                role="dialog"
                aria-label="How to install Sport-Sync"
            >
                <p class="font-semibold mb-2">Install Sport-Sync</p>
                <ol class="list-decimal list-inside space-y-1">
                    <li>Tap the Share button in Safari.</li>
                    <li>Choose <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong>.</li>
                </ol>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    It then opens like an app and works offline.
                </p>
            </div>
        {/if}
    </div>
{/if}
