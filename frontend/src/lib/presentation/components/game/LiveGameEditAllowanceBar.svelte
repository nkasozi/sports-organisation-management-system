<script lang="ts">
    import ConfirmationModal from "$lib/presentation/components/ui/ConfirmationModal.svelte";
    import type { LiveGameCorrectionAccess } from "$lib/presentation/logic/liveGameCorrectionAccess";

    export let access: LiveGameCorrectionAccess;
    export let on_reset_edits: () => Promise<boolean>;

    let is_confirming_reset = false,
        is_resetting = false;

    async function reset(): Promise<void> {
        is_resetting = true;
        const succeeded = await on_reset_edits();
        is_resetting = false;
        if (succeeded) is_confirming_reset = false;
    }
</script>

{#if access.status_text}
    <div
        class={`mb-4 rounded-lg border px-4 py-3 flex flex-wrap items-center gap-3 ${access.can_correct ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20" : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"}`}
        aria-live="polite"
    >
        <div class="flex-1 min-w-[12rem]">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
                ✎ {access.status_text}
            </p>
            <p class="text-xs text-gray-600 dark:text-gray-300">
                {access.help_text}
            </p>
        </div>
        {#if access.can_reset}
            <button
                type="button"
                class="px-3 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700 rounded-[0.175rem] hover:bg-primary-50 dark:hover:bg-primary-900/30"
                on:click={() => (is_confirming_reset = true)}
                >Reset edits</button
            >
        {/if}
    </div>
{/if}
<ConfirmationModal
    is_visible={is_confirming_reset}
    title="Give this game a fresh set of event edits?"
    message="The table official's used edits go back to 0, so they can correct events again. The reset is recorded in the match log and the audit trail."
    confirm_text="Reset edits"
    is_processing={is_resetting}
    on:confirm={() => void reset()}
    on:cancel={() => (is_confirming_reset = false)}
/>
