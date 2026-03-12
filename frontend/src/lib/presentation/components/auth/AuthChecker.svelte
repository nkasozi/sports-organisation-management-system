<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";
  import { ConvexClient } from "convex/browser";
  import { get_clerk } from "$lib/adapters/iam/clerkAuthService";
  import { get } from "svelte/store";

  let authorization_checked = false;
  let is_checking = true;
  let is_auth_page = false;
  let unsubscribe_page: (() => void) | null = null;

  function check_if_auth_page(pathname: string): boolean {
    return pathname.startsWith("/sign-in") || pathname === "/unauthorized";
  }

  async function check_authorization(): Promise<void> {
    if (!browser) {
      is_checking = false;
      return;
    }

    const clerk = get_clerk();
    if (!clerk) {
      console.log("[AuthChecker] Clerk not initialized");
      is_checking = false;
      return;
    }

    const session = clerk.session;
    const user = clerk.user;

    const is_signed_in = !!session;
    const user_email = user?.emailAddresses?.[0]?.emailAddress ?? null;

    if (!is_signed_in || authorization_checked || is_auth_page) {
      is_checking = false;
      return;
    }

    if (!user_email) {
      console.error(
        "[AuthChecker] Signed-in user has no email address — cannot authenticate",
      );
      const error_message = encodeURIComponent(
        "Your account has no email address. Authentication requires an email. Please contact your administrator.",
      );
      await goto(`/unauthorized?message=${error_message}`);
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
      const result = await convex.query(
        "authorization:check_user_access" as any,
        {
          email: user_email,
        },
      );

      if (!result.success) {
        console.error("[AuthChecker] Authorization failed:", result.error);
        const error_message = encodeURIComponent(
          result.error || "Access denied",
        );
        await goto(`/unauthorized?message=${error_message}`);
        return;
      }

      console.log(
        "[AuthChecker] User authorized:",
        result.data.email,
        "role:",
        result.data.role,
      );
    } catch (error) {
      console.error("[AuthChecker] Authorization check failed:", error);
    } finally {
      is_checking = false;
    }
  }

  onMount(() => {
    is_auth_page = check_if_auth_page(get(page).url.pathname);

    unsubscribe_page = page.subscribe((p) => {
      is_auth_page = check_if_auth_page(p.url.pathname);
    });

    void check_authorization();
  });

  onDestroy(() => {
    unsubscribe_page?.();
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
