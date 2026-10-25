<script lang="ts">
    import { tick } from "svelte";

    import { afterNavigate } from "$app/navigation";
    import { page } from "$app/stores";
    import { get_concept_definition } from "$lib/presentation/logic/conceptGuideCatalog";
    import { load_current_user_concept_snapshot } from "$lib/presentation/logic/conceptGuideCurrentUser";
    import { find_next_concept_step } from "$lib/presentation/logic/conceptGuideNextStep";
    import { build_guide_route_checker } from "$lib/presentation/logic/conceptGuidePageState";
    import type { ConceptNextStep } from "$lib/presentation/logic/conceptGuideTypes";
    import { sidebar_menu_items } from "$lib/presentation/stores/authDerivedStores";
    import {
        concept_saved_notice,
        SAVED_NOTICE_STATUS,
    } from "$lib/presentation/stores/conceptSavedNotice";

    import { KEYBOARD_KEY } from "../ui/keyboardKeys";

    const NO_NEXT_STEP = "";
    const CLOSE_ICON_PATH = "M6 18L18 6M6 6l12 12";

    let next_step: ConceptNextStep | typeof NO_NEXT_STEP = NO_NEXT_STEP;
    let loaded_for = "";
    let panel_element: HTMLElement | undefined;

    $: can_open = build_guide_route_checker($sidebar_menu_items);
    $: notice = $concept_saved_notice;
    $: is_visible =
        notice.status === SAVED_NOTICE_STATUS.SAVED &&
        notice.target_path === $page.url.pathname;
    $: notice_key =
        notice.status === SAVED_NOTICE_STATUS.SAVED
            ? `${notice.concept_id}:${notice.record_label}:${notice.target_path}`
            : "";
    $: if (is_visible && notice_key !== loaded_for)
        void load_next_step(notice_key);

    afterNavigate(({ to }) => {
        if (to) concept_saved_notice.leave_path(to.url.pathname);
    });

    async function load_next_step(key: string): Promise<boolean> {
        loaded_for = key;
        next_step = NO_NEXT_STEP;
        const snapshot = await load_current_user_concept_snapshot();
        if (loaded_for !== key) return false;
        next_step = find_next_concept_step(snapshot);
        await tick();
        panel_element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return true;
    }

    function handle_keydown(event: KeyboardEvent): void {
        if (is_visible && event.key === KEYBOARD_KEY.ESCAPE)
            concept_saved_notice.clear();
    }
</script>

<svelte:window on:keydown={handle_keydown} />

{#if is_visible && notice.status === SAVED_NOTICE_STATUS.SAVED}
    {@const concept = get_concept_definition(notice.concept_id)}
    <section
        bind:this={panel_element}
        class="mb-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4"
        aria-live="polite"
    >
        <div class="flex items-start gap-3">
            <div class="flex-1 space-y-2">
                <p
                    class="text-sm font-semibold text-green-800 dark:text-green-300"
                >
                    ✓ {notice.record_label || concept.name} saved.
                </p>
                {#if concept.unlocks.length > 0}
                    <p class="text-sm text-gray-700 dark:text-gray-200">
                        This makes possible:
                        {#each concept.unlocks as unlocked, index (unlocked.concept_id)}
                            {@const target = get_concept_definition(
                                unlocked.concept_id,
                            )}
                            {#if can_open(target.route)}<a
                                    href={target.route}
                                    class="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                    >{target.name}</a
                                >{:else}<span class="font-medium"
                                    >{target.name}</span
                                >{/if}{index < concept.unlocks.length - 1
                                ? ", "
                                : "."}
                        {/each}
                    </p>
                {/if}
                {#if next_step !== NO_NEXT_STEP}
                    {@const next_concept = get_concept_definition(
                        next_step.concept_id,
                    )}
                    <p class="text-sm text-gray-700 dark:text-gray-200">
                        <span class="font-semibold">Your next step:</span>
                        {next_step.message}
                        {#if can_open(next_concept.route)}
                            <a
                                href={next_concept.route}
                                class="ml-1 font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                >{next_step.action_label} →</a
                            >
                        {/if}
                    </p>
                {/if}
                <a
                    href="/how-it-works"
                    class="inline-block text-xs text-gray-500 dark:text-gray-400 hover:underline"
                    >See how it all fits together</a
                >
            </div>
            <button
                type="button"
                class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Dismiss"
                on:click={() => concept_saved_notice.clear()}
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
                        d={CLOSE_ICON_PATH}
                    />
                </svg>
            </button>
        </div>
    </section>
{/if}
