<script lang="ts">
  import { sign_out, destroy_clerk } from "$lib/adapters/iam/clerkAuthService";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  $: error_message =
    $page.url.searchParams.get("message") ||
    "You don't have access to this system.";

  async function handle_sign_out(): Promise<boolean> {
    await sign_out();
    destroy_clerk();
    window.location.href = "/";
    return true;
  }

  function handle_go_home(): void {
    goto("/");
  }
</script>

<div
  class="min-h-[80vh] flex items-center justify-center bg-accent-50 dark:bg-accent-800 py-12 px-4"
>
  <div class="max-w-lg w-full animate-fade-in">
    <div
      class="bg-white dark:bg-accent-900 rounded-2xl shadow-lg border border-accent-200 dark:border-accent-700 overflow-hidden"
    >
      <div class="h-1.5 bg-secondary-500"></div>

      <div class="p-8 sm:p-10">
        <div class="text-center">
          <div
            class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-secondary-50 dark:bg-secondary-900/20"
          >
            <svg
              class="w-10 h-10 text-secondary-500"
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
          </div>

          <div
            class="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400"
          >
            Access Denied
          </div>

          <h1
            class="text-2xl sm:text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2"
          >
            Permission Required
          </h1>

          <p class="text-sm text-accent-500 dark:text-accent-400 mb-4">
            You don't have access to this area
          </p>

          <p
            class="text-base text-accent-600 dark:text-accent-300 leading-relaxed max-w-md mx-auto"
          >
            {error_message}
          </p>

          <p class="mt-3 text-sm text-accent-400 dark:text-accent-500">
            If you believe this is an error, please contact your organization
            administrator.
          </p>
        </div>

        <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            class="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 bg-secondary-500 text-white hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
            on:click={handle_sign_out}
          >
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
            Sign Out and Try Again
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-200 dark:hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-400"
            on:click={handle_go_home}
          >
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
            Go Home
          </button>
        </div>
      </div>
    </div>

    <p class="mt-6 text-center text-xs text-accent-400 dark:text-accent-500">
      Need help?
      <a
        href="/contact"
        class="underline hover:text-accent-600 dark:hover:text-accent-300 transition-colors"
        >Contact support</a
      >
    </p>
  </div>
</div>
