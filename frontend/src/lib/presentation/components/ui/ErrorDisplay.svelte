<script lang="ts">
    import {
        ERROR_DISPLAY_DEFAULT_TEXT,
        ERROR_DISPLAY_SEVERITY,
        ERROR_DISPLAY_SEVERITY_PALETTE,
        ERROR_DISPLAY_VARIANT,
        type ErrorDisplaySeverity,
        type ErrorDisplayVariant,
    } from "./errorDisplayStyles";

    export let title: string = ERROR_DISPLAY_DEFAULT_TEXT.TITLE;
    export let message: string = ERROR_DISPLAY_DEFAULT_TEXT.MESSAGE;
    export let variant: ErrorDisplayVariant = ERROR_DISPLAY_VARIANT.INLINE;
    export let on_retry: (() => void) | undefined = undefined;
    export let on_back: (() => void) | undefined = undefined;
    export let retry_label: string = ERROR_DISPLAY_DEFAULT_TEXT.RETRY;
    export let back_label: string = ERROR_DISPLAY_DEFAULT_TEXT.BACK;
    export let severity: ErrorDisplaySeverity = ERROR_DISPLAY_SEVERITY.WARNING;

    $: palette = ERROR_DISPLAY_SEVERITY_PALETTE[severity];
</script>

{#if variant === ERROR_DISPLAY_VARIANT.PAGE}
    <div class="max-w-lg mx-auto px-4 py-12 animate-fade-in">
        <div
            class="bg-white dark:bg-accent-900 rounded-2xl shadow-lg border border-accent-200 dark:border-accent-700 overflow-hidden"
        >
            <div class="h-1.5 {palette.page_bar}"></div>
            <div class="p-6 sm:p-8 text-center">
                <div
                    class="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 {palette.page_icon_circle}"
                >
                    <svg
                        class="w-8 h-8 {palette.page_icon}"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="1.5"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                        />
                    </svg>
                </div>
                <h3
                    class="text-xl font-bold text-accent-900 dark:text-accent-100 mb-2"
                >
                    {title}
                </h3>
                <p
                    class="text-sm text-accent-500 dark:text-accent-400 leading-relaxed mb-6 max-w-sm mx-auto"
                >
                    {message}
                </p>
                <div
                    class="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                    {#if on_retry}
                        <button
                            type="button"
                            class="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-[0.175rem] transition-all duration-200 w-full sm:w-auto {palette.page_retry_button}"
                            on:click={on_retry}
                        >
                            <svg
                                class="w-4 h-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                                />
                            </svg>
                            {retry_label}
                        </button>
                    {/if}
                    {#if on_back}
                        <button
                            type="button"
                            class="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-[0.175rem] transition-all duration-200 w-full sm:w-auto bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-200 dark:hover:bg-accent-600"
                            on:click={on_back}
                        >
                            <svg
                                class="w-4 h-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                                />
                            </svg>
                            {back_label}
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{:else}
    <div
        class="rounded-xl border overflow-hidden animate-fade-in {palette.inline_container}"
    >
        <div class="h-1 {palette.inline_bar}"></div>
        <div class="p-4">
            <div class="flex items-start gap-3">
                <div
                    class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 {palette.inline_icon_circle}"
                >
                    <svg
                        class="w-4.5 h-4.5 {palette.inline_icon}"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                        />
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <h4
                        class="text-sm font-semibold text-accent-900 dark:text-accent-100"
                    >
                        {title}
                    </h4>
                    <p
                        class="mt-1 text-sm text-accent-500 dark:text-accent-400 leading-relaxed"
                    >
                        {message}
                    </p>
                    {#if on_retry || on_back}
                        <div class="mt-3 flex items-center gap-4">
                            {#if on_retry}
                                <button
                                    type="button"
                                    class="text-sm font-semibold transition-colors flex items-center gap-1.5 {palette.inline_retry_button}"
                                    on:click={on_retry}
                                >
                                    <svg
                                        class="w-3.5 h-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                                        />
                                    </svg>
                                    {retry_label}
                                </button>
                            {/if}
                            {#if on_back}
                                <button
                                    type="button"
                                    class="text-sm font-medium text-accent-500 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
                                    on:click={on_back}
                                >
                                    {back_label}
                                </button>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
