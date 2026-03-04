<script lang="ts">
  import { sign_out } from "$lib/adapters/iam/clerkAuthService";
  import { page } from "$app/stores";

  $: error_message =
    $page.url.searchParams.get("message") ||
    "You don't have access to this system.";

  async function handle_sign_out(): Promise<void> {
    await sign_out();
    window.location.href = "/";
  }
</script>

<div
  class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
>
  <div class="max-w-md w-full space-y-8 text-center">
    <div>
      <div
        class="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
      >
        <svg
          class="h-10 w-10 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
        Access Denied
      </h2>
      <p class="mt-4 text-gray-600 dark:text-gray-400">
        {error_message}
      </p>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-500">
        If you believe this is an error, please contact your organization
        administrator to request access.
      </p>
    </div>

    <div class="mt-8 space-y-4">
      <button
        type="button"
        class="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
        on:click={handle_sign_out}
      >
        <svg
          class="mr-2 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Sign Out and Try Again
      </button>

      <a
        href="mailto:support@example.com"
        class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary-500 transition-colors duration-200"
      >
        Contact Support
      </a>
    </div>
  </div>
</div>
