<script lang="ts">
    import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
    import {
        get_live_game_check_class,
        get_live_game_check_container_class,
        get_live_game_check_icon,
    } from "$lib/presentation/logic/liveGamesViewLogic";

    export let checks: PreFlightCheck[] = [];
</script>

{#if checks.length > 0}
    <div class="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
        <div class="border-t border-accent-200 dark:border-accent-700 pt-4">
            <h4
                class="text-xs font-semibold uppercase tracking-wider text-accent-500 dark:text-accent-400 mb-3"
            >
                Pre-flight Checks
            </h4>
            <div class="space-y-2">
                {#each checks as check}
                    <div
                        class="flex items-start gap-3 {get_live_game_check_container_class(
                            check.status,
                        )}"
                    >
                        <span
                            class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-base {get_live_game_check_class(
                                check.status,
                            )}"
                        >
                            {get_live_game_check_icon(check.status)}
                        </span>
                        <div class="flex-1 min-w-0">
                            <p
                                class="text-sm {check.status === 'failed'
                                    ? 'text-red-700 dark:text-red-300 font-medium'
                                    : 'text-accent-700 dark:text-accent-300'}"
                            >
                                {check.message}
                            </p>
                            {#if check.fix_suggestion}
                                <p
                                    class="text-xs mt-1 {check.status ===
                                    'failed'
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-accent-600 dark:text-accent-400'}"
                                >
                                    💡 {check.fix_suggestion}
                                </p>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
{/if}
