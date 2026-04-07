<script lang="ts">
    import { SignIn } from "svelte-clerk";

    export let current_year: number;
    export let has_server_error: boolean;
    export let has_sync_error: boolean;
</script>

<div
    class="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-16 relative overflow-hidden bg-gray-900 dark:bg-gray-950"
>
    <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-400/5 rounded-full -translate-y-1/2"
    ></div>
    <div
        class="absolute bottom-0 right-0 w-72 h-72 bg-indigo-400/5 rounded-full translate-y-1/3 translate-x-1/4"
    ></div>

    <div class="w-full max-w-md relative z-10">
        <div class="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div
                class="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center"
            >
                <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                </svg>
            </div>
            <span class="text-white text-lg font-semibold tracking-tight"
                >SportSync</span
            >
        </div>

        <div class="mb-8 text-center">
            {#if has_server_error}
                <div
                    class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <svg
                            class="w-5 h-5 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                        <span class="text-sm font-semibold text-red-300"
                            >Connection Error</span
                        >
                    </div>
                    <p class="text-xs text-red-300/80">
                        Unable to connect to the server to load your data.
                        Please check your internet connection and sign in to try
                        again.
                    </p>
                </div>
            {:else if has_sync_error}
                <div class="banner-info mb-6 rounded-xl p-4">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <svg
                            class="banner-info-icon w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        <span class="text-sm font-semibold">Sync Error</span>
                    </div>
                    <p class="text-xs text-blue-700/80 dark:text-blue-200/80">
                        There was a problem syncing your data. Please sign in
                        again to retry.
                    </p>
                </div>
            {/if}
            <div class="flex items-center justify-center gap-2 mb-4">
                <div class="h-px w-8 bg-blue-600/30"></div>
                <svg
                    class="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                    />
                </svg>
                <div class="h-px w-8 bg-blue-600/30"></div>
            </div>
            <h2
                class="text-2xl sm:text-3xl font-bold text-white tracking-tight"
            >
                Sign in to your account
            </h2>
            <p class="mt-2 text-sm text-gray-400">
                Use the email address provided by your organization
            </p>
        </div>

        <div class="flex justify-center">
            <SignIn
                forceRedirectUrl="/"
                appearance={{
                    variables: {
                        colorBackground: "#1a1a2e",
                        colorNeutral: "white",
                        colorPrimary: "#2563eb",
                        colorPrimaryForeground: "white",
                        colorForeground: "white",
                        colorInputForeground: "white",
                        colorInput: "#26262B",
                        borderRadius: "0.5rem",
                    },
                    elements: {
                        providerIcon__apple: { filter: "invert(1)" },
                        providerIcon__github: { filter: "invert(1)" },
                    },
                }}
            />
        </div>

        <div
            class="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500"
        >
            <span class="flex items-center gap-1.5">
                <svg
                    class="w-3.5 h-3.5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clip-rule="evenodd"
                    />
                </svg>
                Encrypted connection
            </span>
            <span class="w-1 h-1 rounded-full bg-gray-600"></span>
            <span>Secured by Clerk</span>
        </div>

        <div class="lg:hidden mt-12 pt-6 border-t border-gray-700">
            <p class="text-xs text-gray-500 text-center">
                &copy; {current_year} SportSync. All rights reserved.
            </p>
        </div>
    </div>
</div>
