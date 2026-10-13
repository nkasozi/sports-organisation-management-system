<script lang="ts">
    import { PUBLIC_PROFILE_SHELL_DEFAULTS } from "./profileManagementMessages";

    export let loading: boolean;
    export let not_found: boolean;
    export let error_message: string;
    export let error_title: string;
    export let background_class = "min-h-screen bg-gray-50 dark:bg-gray-900";
    export let loading_message: string =
        PUBLIC_PROFILE_SHELL_DEFAULTS.LOADING_MESSAGE;
    export let not_found_icon: string =
        PUBLIC_PROFILE_SHELL_DEFAULTS.NOT_FOUND_ICON;
    export let not_found_title: string =
        PUBLIC_PROFILE_SHELL_DEFAULTS.NOT_FOUND_TITLE;
    export let not_found_message: string =
        PUBLIC_PROFILE_SHELL_DEFAULTS.NOT_FOUND_MESSAGE;
    export let error_icon: string = PUBLIC_PROFILE_SHELL_DEFAULTS.ERROR_ICON;
    export let home_href: string | undefined = undefined;
    export let home_label: string = PUBLIC_PROFILE_SHELL_DEFAULTS.HOME_LABEL;
</script>

<div class={background_class}>
    {#if loading}
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center px-4">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"
                ></div>
                <p class="text-gray-600 dark:text-gray-300">
                    {loading_message}
                </p>
            </div>
        </div>
    {:else if not_found}
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center px-4 max-w-2xl">
                <div class="text-6xl mb-4">{not_found_icon}</div>
                <h1
                    class="text-2xl font-bold text-gray-800 dark:text-white mb-2"
                >
                    {not_found_title}
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
                    {not_found_message}
                </p>
                {#if home_href}
                    <a
                        href={home_href}
                        class="inline-block mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        {home_label}
                    </a>
                {/if}
            </div>
        </div>
    {:else if error_message}
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center px-4 max-w-2xl">
                <div class="text-6xl mb-4">{error_icon}</div>
                <h1
                    class="text-2xl font-bold text-gray-800 dark:text-white mb-2"
                >
                    {error_title}
                </h1>
                <p class="text-gray-600 dark:text-gray-400">{error_message}</p>
                {#if home_href}
                    <a
                        href={home_href}
                        class="inline-block mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        {home_label}
                    </a>
                {/if}
            </div>
        </div>
    {:else}
        <slot></slot>
    {/if}
</div>
