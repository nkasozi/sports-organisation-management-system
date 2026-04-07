<script lang="ts">
    import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
    import {
        is_offline_mode,
        offline_reason,
    } from "$lib/presentation/stores/appStatus";
</script>

{#if $is_offline_mode}
    <div class="banner-info w-full border-b pt-4 pb-2 text-center">
        <p
            class="inline-flex flex-wrap items-center justify-center gap-1.5 px-4 text-xs sm:text-sm"
        >
            <svg
                class="banner-info-icon h-4 w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 9v4m0 4h.01"
                />
            </svg>
            Offline mode - {$offline_reason}
        </p>
    </div>
{:else if !$is_signed_in}
    <div
        class="w-full border-b border-violet-200 bg-violet-50 py-2 text-center dark:border-violet-800 dark:bg-violet-950/60"
    >
        <div class="flex flex-col items-center gap-0.5 px-6">
            <div class="flex items-center gap-1.5">
                <svg
                    class="h-3.5 w-3.5 flex-shrink-0 text-violet-600 dark:text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <span
                    class="text-sm font-medium text-violet-700 dark:text-violet-300"
                    >You are not signed in.</span
                >
            </div>
            <span class="text-sm text-violet-600 dark:text-violet-400"
                >Changes you make will be overridden when you sign in.</span
            >
            <a
                href="/sign-in"
                class="text-sm font-semibold text-violet-800 underline hover:text-violet-900 dark:text-violet-200 dark:hover:text-violet-100"
                style="min-height: 0">Sign in</a
            >
        </div>
    </div>
{/if}
