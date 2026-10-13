<script context="module" lang="ts">
    import type { LoadingStateValue } from "./loadingStateWrapperLogic";

    export type LoadingState = LoadingStateValue;
</script>

<script lang="ts">
    import ErrorDisplay from "./ErrorDisplay.svelte";
    import {
        LOADING_STATE,
        LOADING_WRAPPER_DEFAULT_TEXT,
        LOADING_WRAPPER_VIEW,
        resolve_loading_wrapper_view,
    } from "./loadingStateWrapperLogic";

    export let state: LoadingState = LOADING_STATE.IDLE;
    export let error_message: string = "";
    export let error_title: string = LOADING_WRAPPER_DEFAULT_TEXT.ERROR_TITLE;
    export let loading_text: string = LOADING_WRAPPER_DEFAULT_TEXT.LOADING;
    export let show_content_while_loading: boolean = false;
    export let on_retry: (() => void) | undefined = undefined;

    $: view = resolve_loading_wrapper_view(state, show_content_while_loading);
    $: shows_content =
        view === LOADING_WRAPPER_VIEW.CONTENT ||
        view === LOADING_WRAPPER_VIEW.CONTENT_WITH_OVERLAY;
</script>

<div class="relative">
    {#if view === LOADING_WRAPPER_VIEW.SPINNER}
        <div class="flex flex-col items-center justify-center py-12">
            <div
                class="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600 mb-4"
            ></div>
            <p class="text-accent-600 dark:text-accent-400 text-sm">
                {loading_text}
            </p>
        </div>
    {:else if view === LOADING_WRAPPER_VIEW.ERROR}
        <ErrorDisplay
            title={error_title}
            message={error_message ||
                LOADING_WRAPPER_DEFAULT_TEXT.ERROR_MESSAGE}
            {on_retry}
        />
    {:else if shows_content}
        <div class="relative">
            {#if view === LOADING_WRAPPER_VIEW.CONTENT_WITH_OVERLAY}
                <div
                    class="absolute inset-0 bg-white/50 dark:bg-accent-900/50 flex items-center justify-center z-10 rounded-lg"
                >
                    <div
                        class="flex items-center space-x-2 bg-white dark:bg-accent-800 px-4 py-2 rounded-lg shadow"
                    >
                        <div
                            class="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-primary-600"
                        ></div>
                        <span
                            class="text-sm text-accent-600 dark:text-accent-400"
                            >{loading_text}</span
                        >
                    </div>
                </div>
            {/if}
            <slot />
        </div>
    {:else}
        <slot name="empty">
            <div class="text-center py-12">
                <p class="text-accent-500 dark:text-accent-400">
                    No data available
                </p>
            </div>
        </slot>
    {/if}
</div>
