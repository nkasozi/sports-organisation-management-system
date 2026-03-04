<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";
  import { ConvexClient } from "convex/browser";
  import {
    set_clerk_token_getter,
    update_clerk_session_state,
  } from "$lib/adapters/iam/clerkAuthService";

  let authorization_checked = false;
  let is_checking = true;
  let mounted = false;

  $: is_auth_page =
    $page.url.pathname.startsWith("/sign-in") ||
    $page.url.pathname === "/unauthorized";

  function get_clerk_from_window(): any {
    if (!browser) return null;
    return (window as any).Clerk ?? null;
  }

  async function wait_for_clerk(max_attempts: number = 20): Promise<any> {
    for (let i = 0; i < max_attempts; i++) {
      const clerk = get_clerk_from_window();
      if (clerk?.loaded) return clerk;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  async function check_authorization(): Promise<void> {
    if (!browser || !mounted) {
      is_checking = false;
      return;
    }

    const clerk = await wait_for_clerk();
    if (!clerk) {
      console.log("[AuthChecker] Clerk not available");
      is_checking = false;
      return;
    }

    const session = clerk.session;
    const user = clerk.user;

    if (session) {
      set_clerk_token_getter(async () => {
        const token = await session.getToken({ template: "convex" });
        return token ?? null;
      });
    }

    const is_signed_in = !!session;
    const user_id = user?.id ?? null;
    const user_email = user?.emailAddresses?.[0]?.emailAddress ?? null;

    update_clerk_session_state(is_signed_in, user_id, user_email);

    if (
      !is_signed_in ||
      !user_id ||
      !user_email ||
      authorization_checked ||
      is_auth_page
    ) {
      is_checking = false;
      return;
    }

    authorization_checked = true;

    if (!PUBLIC_CONVEX_URL) {
      console.log(
        "[AuthChecker] Convex not configured, skipping authorization check",
      );
      is_checking = false;
      return;
    }

    try {
      const convex = new ConvexClient(PUBLIC_CONVEX_URL);
      const result = await convex.mutation(
        "authorization:link_clerk_user_to_profile" as any,
        {
          email: user_email,
          clerk_user_id: user_id,
        },
      );

      if (!result.success) {
        console.error("[AuthChecker] Authorization failed:", result.message);
        const error_message = encodeURIComponent(
          result.message || "Access denied",
        );
        await goto(`/unauthorized?message=${error_message}`);
        return;
      }

      console.log(
        "[AuthChecker] User authorized:",
        result.profile?.display_name,
      );
    } catch (error) {
      console.error("[AuthChecker] Authorization check failed:", error);
    } finally {
      is_checking = false;
    }
  }

  onMount(() => {
    mounted = true;
    void check_authorization();
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
      <p class="mt-4 text-gray-600 dark:text-gray-400">Verifying access...</p>
    </div>
  </div>
{:else}
  <slot />
{/if}
