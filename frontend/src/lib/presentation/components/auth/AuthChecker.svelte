<script lang="ts">
    import { ConvexClient } from "convex/browser";
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";

    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { PUBLIC_CONVEX_URL } from "$env/static/public";
    import {
        clerk_session,
        get_session_token,
    } from "$lib/adapters/iam/clerkAuthService";
    import { CLERK_PRESENCE_STATUS } from "$lib/adapters/iam/clerkAuthTypes";
    import {
        AuthCheckerAccessStatus,
        CURRENT_USER_PROFILE_QUERY,
        verify_signed_in_user_access,
    } from "$lib/presentation/logic/authCheckerAccess";
    import {
        AUTH_CHECKER_PRECHECK,
        build_access_denied_redirect_path,
        build_missing_email_redirect_path,
        decide_auth_checker_precheck,
        is_auth_checker_exempt_page,
    } from "$lib/presentation/logic/authCheckerPrecheck";

    const ACCESS_CHECK_SKIPPED_EVENT = "auth_checker_access_check_skipped";
    const ACCESS_CHECK_TIMED_OUT_EVENT = "auth_checker_access_check_timed_out";

    let authorization_checked = false;
    let is_checking = true;
    let is_auth_page = false;
    let unsubscribe_page: () => void = () => {};

    interface ClerkIdentitySnapshot {
        clerk_ready: boolean;
        is_signed_in: boolean;
        has_email: boolean;
    }

    const UNAVAILABLE_CLERK_IDENTITY: ClerkIdentitySnapshot = {
        clerk_ready: false,
        is_signed_in: false,
        has_email: false,
    };

    function read_clerk_identity(): ClerkIdentitySnapshot {
        if (!browser) return UNAVAILABLE_CLERK_IDENTITY;
        const clerk_state = get(clerk_session);
        if (!clerk_state.is_loaded) return UNAVAILABLE_CLERK_IDENTITY;
        const user_email =
            clerk_state.user_state.status === CLERK_PRESENCE_STATUS.PRESENT
                ? clerk_state.user_state.user.email_address
                : "";
        return {
            clerk_ready: true,
            is_signed_in: clerk_state.is_signed_in,
            has_email: user_email.length > 0,
        };
    }

    async function query_profile_with_token(
        session_token: string,
    ): Promise<unknown> {
        const convex = new ConvexClient(PUBLIC_CONVEX_URL);
        convex.setAuth(async () => session_token);
        const profile_response = await convex
            .query(CURRENT_USER_PROFILE_QUERY as never, {} as never)
            .finally(() => void convex.close());
        return profile_response;
    }

    async function verify_access_with_convex(): Promise<void> {
        const access_outcome = await verify_signed_in_user_access({
            get_session_token,
            query_current_user_profile: query_profile_with_token,
        });
        if (access_outcome.status === AuthCheckerAccessStatus.DENIED)
            await goto(build_access_denied_redirect_path());
    }

    async function check_authorization(): Promise<void> {
        const precheck = decide_auth_checker_precheck({
            in_browser: browser,
            ...read_clerk_identity(),
            already_checked: authorization_checked,
            is_auth_page,
            convex_configured: Boolean(PUBLIC_CONVEX_URL),
        });
        console.log("[AuthChecker] Authorization precheck decided", {
            event: "auth_checker_precheck_decided",
            precheck,
        });
        switch (precheck) {
            case AUTH_CHECKER_PRECHECK.MISSING_EMAIL:
                await goto(build_missing_email_redirect_path());
                break;
            case AUTH_CHECKER_PRECHECK.CONVEX_NOT_CONFIGURED:
                authorization_checked = true;
                break;
            case AUTH_CHECKER_PRECHECK.VERIFY_ACCESS:
                authorization_checked = true;
                await verify_access_with_convex();
                break;
            case AUTH_CHECKER_PRECHECK.SKIP:
                break;
        }
        is_checking = false;
    }

    onMount(() => {
        is_auth_page = is_auth_checker_exempt_page(get(page).url.pathname);

        unsubscribe_page = page.subscribe((p) => {
            is_auth_page = is_auth_checker_exempt_page(p.url.pathname);
        });

        void check_authorization();
    });

    onDestroy(() => {
        unsubscribe_page();
    });
</script>

{#if is_checking}
    <div
        class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900"
    >
        <div class="text-center">
            <div
                class="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary-600 mx-auto"
            ></div>
            <p class="mt-4 text-gray-600 dark:text-gray-400">
                Verifying access...
            </p>
        </div>
    </div>
{:else}
    <slot />
{/if}
