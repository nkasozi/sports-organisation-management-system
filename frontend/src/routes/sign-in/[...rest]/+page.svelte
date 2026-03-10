<script lang="ts">
  import { SignIn } from "svelte-clerk";
  import { page } from "$app/stores";

  let current_year = new Date().getFullYear();

  $: error_param = $page.url.searchParams.get("error");
  $: has_server_error = error_param === "server_unavailable";
  $: has_sync_error = error_param && error_param !== "server_unavailable";
  $: sync_error_message = has_sync_error
    ? decodeURIComponent(error_param || "")
    : "";

  const feature_highlights = [
    {
      icon: "trophy",
      title: "Competitions",
      description: "Manage leagues, tournaments and fixtures",
    },
    {
      icon: "users",
      title: "Teams & Players",
      description: "Rosters, transfers and player profiles",
    },
    {
      icon: "clock",
      title: "Live Games",
      description: "Real-time scoring and event tracking",
    },
    {
      icon: "shield",
      title: "Officials",
      description: "Assign and manage match officials",
    },
  ];
</script>

<div
  class="min-h-screen flex flex-col lg:flex-row bg-gray-900 transition-colors"
>
  <div
    class="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden flex-col justify-between p-12"
  >
    <div class="relative z-10">
      <div class="flex items-center gap-3 mb-16">
        <div
          class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"
        >
          <svg
            class="w-6 h-6 text-white"
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
        <span class="text-white text-xl font-semibold tracking-tight"
          >SportSync</span
        >
      </div>

      <h1 class="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
        Manage your sports organization with confidence
      </h1>
      <p class="text-lg text-gray-400 leading-relaxed max-w-lg">
        Everything you need to run competitions, manage teams, track live games,
        and coordinate officials — all in one place.
      </p>
    </div>

    <div class="relative z-10 grid grid-cols-2 gap-6 mt-12">
      {#each feature_highlights as feature}
        <div
          class="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div
            class="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            {#if feature.icon === "trophy"}
              <svg
                class="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M5 3h14l-1.405 8.426A5 5 0 0112.63 16H11.37a5 5 0 01-4.965-4.574L5 3zM9 21h6m-3-5v5"
                />
              </svg>
            {:else if feature.icon === "users"}
              <svg
                class="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            {:else if feature.icon === "clock"}
              <svg
                class="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            {:else if feature.icon === "shield"}
              <svg
                class="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            {/if}
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white">{feature.title}</h3>
            <p class="text-xs text-gray-400 mt-0.5">{feature.description}</p>
          </div>
        </div>
      {/each}
    </div>

    <div class="relative z-10 mt-12">
      <p class="text-sm text-gray-500">
        &copy; {current_year} SportSync. All rights reserved.
      </p>
    </div>

    <div
      class="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/3"
    ></div>
    <div
      class="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full translate-y-1/3 -translate-x-1/4"
    ></div>
  </div>

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
              Unable to connect to the server to load your data. Please check
              your internet connection and sign in to try again.
            </p>
          </div>
        {:else if has_sync_error}
          <div
            class="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <div class="flex items-center justify-center gap-2 mb-2">
              <svg
                class="w-5 h-5 text-amber-400"
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
              <span class="text-sm font-semibold text-amber-300"
                >Sync Error</span
              >
            </div>
            <p class="text-xs text-amber-300/80">
              {sync_error_message}. Please sign in again to retry.
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
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
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
</div>
