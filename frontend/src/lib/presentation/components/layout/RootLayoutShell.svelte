<script lang="ts">
    import { ClerkProvider } from "svelte-clerk";

    import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
    import AuthChecker from "$lib/presentation/components/auth/AuthChecker.svelte";
    import Layout from "$lib/presentation/components/layout/Layout.svelte";
    import PublicLayout from "$lib/presentation/components/layout/PublicLayout.svelte";
    import FullScreenOverlay from "$lib/presentation/components/ui/FullScreenOverlay.svelte";
    import {
        get_is_auth_page,
        get_is_public_content_page,
        get_is_public_profile_page,
    } from "$lib/presentation/logic/layoutLogic";

    export let show_initial_sync: boolean;
    export let sync_status_message: string;
    export let sync_progress_percentage: number;
    export let app_ready: boolean;
    export let clerk_ready: boolean;
    export let show_first_time_setup: boolean;
    export let setup_status_message: string;
    export let setup_progress_percentage: number;
    export let current_path: string;
</script>

<ClerkProvider
    signInUrl="/sign-in"
    signInForceRedirectUrl="/"
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
    }}
>
    {#if show_initial_sync}
        <FullScreenOverlay
            title="Syncing Data"
            subtitle="Please wait while we sync your data"
            status_message={sync_status_message}
            progress_percentage={sync_progress_percentage}
        />
    {:else if !app_ready || !clerk_ready}
        <div
            class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900"
        >
            <div class="text-center">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary-600 mx-auto"
                ></div>
                <p class="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        </div>
    {:else}
        <AuthChecker>
            {#if show_first_time_setup}
                <FullScreenOverlay
                    title="Setting Up"
                    subtitle="Preparing your environment"
                    status_message={setup_status_message}
                    progress_percentage={setup_progress_percentage}
                />
            {/if}

            {#if get_is_auth_page(current_path)}
                <slot />
            {:else if get_is_public_profile_page(current_path)}
                <PublicLayout><slot /></PublicLayout>
            {:else if get_is_public_content_page(current_path) && !$is_signed_in}
                <Layout><slot /></Layout>
            {:else}
                <Layout><slot /></Layout>
            {/if}
        </AuthChecker>
    {/if}
</ClerkProvider>
