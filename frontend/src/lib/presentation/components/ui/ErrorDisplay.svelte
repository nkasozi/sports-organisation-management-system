<script lang="ts">
    export let title: string = "Something went wrong";
    export let message: string =
        "An unexpected error occurred. Please try again.";
    export let variant: "inline" | "page" = "inline";
    export let on_retry: (() => void) | null = null;
    export let on_back: (() => void) | null = null;
    export let retry_label: string = "Try Again";
    export let back_label: string = "Go Back";
</script>

{#if variant === "page"}
    <div class="max-w-md mx-auto px-4 py-12 animate-fade-in">
        <div
            class="card p-6 sm:p-8 text-center border-t-4 border-t-primary-500"
        >
            <div
                class="mx-auto w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-5"
            >
                <svg
                    class="w-7 h-7 text-primary-500"
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
                class="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2"
            >
                {title}
            </h3>

            <p
                class="text-sm text-accent-500 dark:text-accent-400 leading-relaxed mb-6"
            >
                {message}
            </p>

            <div
                class="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
                {#if on_retry}
                    <button
                        type="button"
                        class="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                        on:click={on_retry}
                    >
                        <svg
                            class="w-4 h-4"
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
                        class="btn btn-outline w-full sm:w-auto"
                        on:click={on_back}
                    >
                        {back_label}
                    </button>
                {/if}
            </div>
        </div>
    </div>
{:else}
    <div
        class="rounded-lg border border-primary-200 dark:border-primary-800/50 bg-primary-50/50 dark:bg-primary-900/10 p-4 animate-fade-in"
    >
        <div class="flex items-start gap-3">
            <div
                class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mt-0.5"
            >
                <svg
                    class="w-4 h-4 text-primary-500"
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
                    <div class="mt-3 flex items-center gap-3">
                        {#if on_retry}
                            <button
                                type="button"
                                class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center gap-1.5"
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
{/if}
