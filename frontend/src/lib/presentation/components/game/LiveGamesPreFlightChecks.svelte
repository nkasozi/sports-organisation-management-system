<script lang="ts">
    import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
    import { CHECK_STATUS } from "$lib/core/services/FixtureStartChecksConstants";
    import { OptionStatus } from "$lib/core/types/Option";
    import { get_live_game_check_fix_link } from "$lib/presentation/logic/liveGamesCheckFixLinks";
    import {
        get_live_game_check_class,
        get_live_game_check_container_class,
        get_live_game_check_icon,
    } from "$lib/presentation/logic/liveGamesViewLogic";

    import { LIVE_GAMES_PREFLIGHT_TEXT } from "./liveGamesConstants";

    export let checks: PreFlightCheck[] = [];
    export let fixture_id: string = "";
</script>

{#if checks.length > 0}
    <div class="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
        <div class="border-t border-accent-200 dark:border-accent-700 pt-4">
            <h4
                class="text-xs font-semibold uppercase tracking-wider text-accent-500 dark:text-accent-400 mb-3"
            >
                {LIVE_GAMES_PREFLIGHT_TEXT.TITLE}
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
                                class="text-sm {check.status ===
                                CHECK_STATUS.FAILED
                                    ? 'text-red-700 dark:text-red-300 font-medium'
                                    : 'text-accent-700 dark:text-accent-300'}"
                            >
                                {check.message}
                            </p>
                            {#if check.fix_suggestion}
                                <p
                                    class="text-xs mt-1 {check.status ===
                                    CHECK_STATUS.FAILED
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-accent-600 dark:text-accent-400'}"
                                >
                                    💡 {check.fix_suggestion}
                                </p>
                            {/if}
                            {#each [get_live_game_check_fix_link(check, fixture_id)] as fix_link}
                                {#if fix_link.status === OptionStatus.SOME}
                                    <a
                                        href={fix_link.value.href}
                                        class="inline-flex items-center mt-2 px-3 py-1.5 text-xs font-medium rounded-[0.175rem] bg-accent-600 text-white hover:bg-accent-700 transition-colors"
                                        >{fix_link.value.label}</a
                                    >
                                {/if}
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
{/if}
