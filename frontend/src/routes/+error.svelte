<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    $: error_code = $page.status;
    $: error_message = $page.error?.message || "An unexpected error occurred";

    interface ErrorConfig {
        icon: string;
        title: string;
        subtitle: string;
        description: string;
        primary_action_label: string;
        primary_action_href: string;
        secondary_action_label: string;
        show_error_code: boolean;
        accent_color: string;
    }

    function get_error_config(status: number): ErrorConfig {
        switch (status) {
            case 404:
                return {
                    icon: "search",
                    title: "Page Not Found",
                    subtitle: "We looked everywhere",
                    description:
                        "The page you're looking for doesn't exist or may have been moved. Check the URL or navigate back to a safe place.",
                    primary_action_label: "Go Home",
                    primary_action_href: "/",
                    secondary_action_label: "Go Back",
                    show_error_code: true,
                    accent_color: "amber",
                };
            case 401:
                return {
                    icon: "lock",
                    title: "Authentication Required",
                    subtitle: "Sign in to continue",
                    description:
                        "You need to be signed in to access this page.",
                    primary_action_label: "Sign In",
                    primary_action_href: "/sign-in",
                    secondary_action_label: "Go Home",
                    show_error_code: false,
                    accent_color: "amber",
                };
            case 403:
                return {
                    icon: "shield",
                    title: "Access Denied",
                    subtitle: "Permission required",
                    description:
                        "You don't have permission to view this page. Contact your administrator if you believe this is an error.",
                    primary_action_label: "Go Home",
                    primary_action_href: "/",
                    secondary_action_label: "Contact Support",
                    show_error_code: false,
                    accent_color: "red",
                };
            case 500:
            default:
                return {
                    icon: "alert",
                    title: "Something Went Wrong",
                    subtitle: "Server error",
                    description:
                        "We're experiencing technical difficulties. Please try again in a moment. If the problem persists, contact support.",
                    primary_action_label: "Try Again",
                    primary_action_href: "",
                    secondary_action_label: "Go Home",
                    show_error_code: true,
                    accent_color: "red",
                };
        }
    }

    $: config = get_error_config(error_code);

    function handle_primary_action(): void {
        if (config.primary_action_href === "") {
            window.location.reload();
            return;
        }
        goto(config.primary_action_href);
    }

    function handle_go_back(): void {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            goto("/");
        }
    }

    function handle_secondary_action(): void {
        if (config.secondary_action_label === "Go Back") {
            handle_go_back();
            return;
        }
        if (config.secondary_action_label === "Go Home") {
            goto("/");
            return;
        }
        if (config.secondary_action_label === "Contact Support") {
            goto("/contact");
        }
    }
</script>

<div
    class="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-accent-50 dark:bg-accent-800"
>
    <div class="max-w-lg w-full animate-fade-in">
        <div
            class="bg-white dark:bg-accent-900 rounded-2xl shadow-lg border border-accent-200 dark:border-accent-700 overflow-hidden"
        >
            <div
                class="h-1.5 {config.accent_color === 'red'
                    ? 'bg-secondary-500'
                    : 'bg-primary-500'}"
            ></div>

            <div class="p-8 sm:p-10">
                <div class="text-center">
                    <div
                        class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 {config.accent_color ===
                        'red'
                            ? 'bg-secondary-50 dark:bg-secondary-900/20'
                            : 'bg-primary-50 dark:bg-primary-900/20'}"
                    >
                        {#if config.icon === "search"}
                            <svg
                                class="w-10 h-10 {config.accent_color === 'red'
                                    ? 'text-secondary-500'
                                    : 'text-primary-500'}"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="1.5"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                />
                            </svg>
                        {:else if config.icon === "lock"}
                            <svg
                                class="w-10 h-10 {config.accent_color === 'red'
                                    ? 'text-secondary-500'
                                    : 'text-primary-500'}"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="1.5"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                />
                            </svg>
                        {:else if config.icon === "shield"}
                            <svg
                                class="w-10 h-10 {config.accent_color === 'red'
                                    ? 'text-secondary-500'
                                    : 'text-primary-500'}"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="1.5"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z"
                                />
                            </svg>
                        {:else}
                            <svg
                                class="w-10 h-10 {config.accent_color === 'red'
                                    ? 'text-secondary-500'
                                    : 'text-primary-500'}"
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
                        {/if}
                    </div>

                    {#if config.show_error_code}
                        <div
                            class="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 {config.accent_color ===
                            'red'
                                ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400'
                                : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'}"
                        >
                            Error {error_code}
                        </div>
                    {/if}

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
                        class="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 {config.accent_color ===
                        'red'
                            ? 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500'
                            : 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500'}"
                        on:click={handle_primary_action}
                    >
                        {#if config.primary_action_label === "Try Again"}
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
                        {:else if config.primary_action_label === "Go Home"}
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
                                    d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                                />
                            </svg>
                        {:else if config.primary_action_label === "Sign In"}
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
                                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                                />
                            </svg>
                        {/if}
                        {config.primary_action_label}
                    </button>

                    <button
                        type="button"
                        class="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-200 dark:hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-400"
                        on:click={handle_secondary_action}
                    >
                        {#if config.secondary_action_label === "Go Back"}
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
                        {/if}
                        {config.secondary_action_label}
                    </button>
                </div>

                {#if error_message && error_code >= 500}
                    <details
                        class="mt-8 bg-accent-50 dark:bg-accent-800 rounded-lg border border-accent-200 dark:border-accent-700"
                    >
                        <summary
                            class="px-4 py-3 text-sm font-medium text-accent-600 dark:text-accent-400 cursor-pointer hover:text-accent-900 dark:hover:text-accent-200 select-none"
                        >
                            Technical Details
                        </summary>
                        <div
                            class="px-4 pb-4 text-sm text-accent-500 dark:text-accent-400 font-mono break-words"
                        >
                            {error_message}
                        </div>
                    </details>
                {/if}
            </div>
        </div>

        <p
            class="mt-6 text-center text-xs text-accent-400 dark:text-accent-500"
        >
            Need help?
            <a
                href="/contact"
                class="underline hover:text-accent-600 dark:hover:text-accent-300 transition-colors"
                >Contact support</a
            >
            or
            <a
                href="/"
                class="underline hover:text-accent-600 dark:hover:text-accent-300 transition-colors"
                >return home</a
            >.
        </p>
    </div>
</div>
