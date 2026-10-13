<script lang="ts">
    import type { ErrorConfig } from "$lib/presentation/logic/errorPageState";

    import {
        ERROR_PAGE_ICON,
        ERROR_PAGE_PATHS,
        ERROR_PAGE_PRIMARY_ACTION_ICON,
        resolve_error_page_card_view,
    } from "./errorPageCardPresentation";

    export let config: ErrorConfig;
    export let error_code: number;
    export let on_primary_action: () => void;
    export let on_secondary_action: () => void;

    $: view = resolve_error_page_card_view(config);
</script>

<div
    class="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-accent-50 dark:bg-accent-800"
>
    <div class="max-w-lg w-full animate-fade-in">
        <div
            class="bg-white dark:bg-accent-900 rounded-2xl shadow-lg border border-accent-200 dark:border-accent-700 overflow-hidden"
        >
            <div class={`h-1.5 ${view.palette.bar}`}></div>
            <div class="p-8 sm:p-10">
                <div class="text-center">
                    <div
                        class={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${view.palette.icon_circle}`}
                    >
                        {#if view.icon === ERROR_PAGE_ICON.SEARCH}<svg
                                class={`w-10 h-10 ${view.palette.icon}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="1.5"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                /></svg
                            >{:else if view.icon === ERROR_PAGE_ICON.LOCK}<svg
                                class={`w-10 h-10 ${view.palette.icon}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="1.5"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                /></svg
                            >{:else if view.icon === ERROR_PAGE_ICON.SHIELD}<svg
                                class={`w-10 h-10 ${view.palette.icon}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="1.5"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z"
                                /></svg
                            >{:else}<svg
                                class={`w-10 h-10 ${view.palette.icon}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="1.5"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                                /></svg
                            >{/if}
                    </div>
                    {#if config.show_error_code}<div
                            class={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 ${view.palette.code_badge}`}
                        >
                            Error {error_code}
                        </div>{/if}
                    <h1
                        class="text-2xl sm:text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2"
                    >
                        {config.title}
                    </h1>
                    <p
                        class="text-sm text-accent-500 dark:text-accent-400 mb-4"
                    >
                        {config.subtitle}
                    </p>
                    <p
                        class="text-base text-accent-600 dark:text-accent-300 leading-relaxed max-w-md mx-auto"
                    >
                        {config.description}
                    </p>
                </div>
                <div
                    class="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
                >
                    <button
                        type="button"
                        class={`inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-[0.175rem] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${view.palette.primary_button}`}
                        on:click={on_primary_action}
                        >{#if view.primary_action_icon === ERROR_PAGE_PRIMARY_ACTION_ICON.RETRY}<svg
                                class="w-4 h-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                                /></svg
                            >{:else if view.primary_action_icon === ERROR_PAGE_PRIMARY_ACTION_ICON.HOME}<svg
                                class="w-4 h-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                                /></svg
                            >{:else if view.primary_action_icon === ERROR_PAGE_PRIMARY_ACTION_ICON.SIGN_IN}<svg
                                class="w-4 h-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                                /></svg
                            >{/if}{config.primary_action_label}</button
                    ><button
                        type="button"
                        class="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-[0.175rem] transition-all duration-200 bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-200 dark:hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-400"
                        on:click={on_secondary_action}
                        >{#if view.show_secondary_back_icon}<svg
                                class="w-4 h-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                                /></svg
                            >{/if}{config.secondary_action_label}</button
                    >
                </div>
            </div>
        </div>
        <p
            class="mt-6 text-center text-xs text-accent-400 dark:text-accent-500"
        >
            Need help? <a
                href={ERROR_PAGE_PATHS.CONTACT}
                class="underline hover:text-accent-600 dark:hover:text-accent-300 transition-colors"
                >Contact support</a
            >
            or
            <a
                href={ERROR_PAGE_PATHS.HOME}
                class="underline hover:text-accent-600 dark:hover:text-accent-300 transition-colors"
                >return home</a
            >.
        </p>
    </div>
</div>
