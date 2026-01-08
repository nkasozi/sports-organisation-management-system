<script lang="ts">
  import {
    theme_store,
    toggle_theme_mode,
    update_theme_colors,
    reset_theme_to_default,
  } from "$lib/stores/theme";
  import Toast from "$lib/components/ui/Toast.svelte";

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  let organization_name: string = "My Sports Organization";
  let organization_logo_url: string = "";
  let selected_primary_color: string = "yellow";
  let selected_secondary_color: string = "red";
  let notifications_enabled: boolean = true;
  let email_notifications: boolean = true;

  const color_options = [
    {
      value: "yellow",
      label: "Yellow",
      hex: "#EAB308",
      class: "bg-yellow-500",
    },
    { value: "blue", label: "Blue", hex: "#3B82F6", class: "bg-blue-500" },
    { value: "green", label: "Green", hex: "#22C55E", class: "bg-green-500" },
    { value: "red", label: "Red", hex: "#EF4444", class: "bg-red-500" },
    {
      value: "purple",
      label: "Purple",
      hex: "#A855F7",
      class: "bg-purple-500",
    },
    {
      value: "orange",
      label: "Orange",
      hex: "#F97316",
      class: "bg-orange-500",
    },
    { value: "pink", label: "Pink", hex: "#EC4899", class: "bg-pink-500" },
    { value: "teal", label: "Teal", hex: "#14B8A6", class: "bg-teal-500" },
    {
      value: "indigo",
      label: "Indigo",
      hex: "#6366F1",
      class: "bg-indigo-500",
    },
    { value: "cyan", label: "Cyan", hex: "#06B6D4", class: "bg-cyan-500" },
  ];

  $: current_theme = $theme_store;

  function handle_theme_toggle(): void {
    toggle_theme_mode();
    show_toast(`Switched to ${$theme_store.mode} mode`, "success");
  }

  function handle_primary_color_change(color: string): void {
    selected_primary_color = color;
    update_theme_colors({ primaryColor: color });
    show_toast("Primary color updated", "success");
  }

  function handle_secondary_color_change(color: string): void {
    selected_secondary_color = color;
    update_theme_colors({ secondaryColor: color });
    show_toast("Secondary color updated", "success");
  }

  function handle_reset_theme(): void {
    reset_theme_to_default();
    selected_primary_color = "yellow";
    selected_secondary_color = "red";
    show_toast("Theme reset to defaults", "success");
  }

  function handle_save_organization_settings(): void {
    show_toast("Organization settings saved", "success");
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info"
  ): void {
    toast_message = message;
    toast_type = type;
    toast_visible = true;
  }
</script>

<svelte:head>
  <title>Settings - Sports Management</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
  <div>
    <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
      Settings
    </h1>
    <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
      Customize your sports management experience
    </p>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-6 border-b border-accent-200 dark:border-accent-700">
      <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
        Organization Branding
      </h2>
      <p class="text-sm text-accent-500 dark:text-accent-400 mt-1">
        Customize the appearance to match your organization
      </p>
    </div>

    <div class="p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            for="org_name"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
          >
            Organization Name
          </label>
          <input
            id="org_name"
            type="text"
            class="input w-full"
            bind:value={organization_name}
            placeholder="Enter organization name"
          />
        </div>

        <div>
          <label
            for="org_logo"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
          >
            Logo URL
          </label>
          <input
            id="org_logo"
            type="url"
            class="input w-full"
            bind:value={organization_logo_url}
            placeholder="https://example.com/logo.png"
          />
        </div>
      </div>

      <button
        type="button"
        class="btn btn-primary"
        on:click={handle_save_organization_settings}
      >
        Save Branding
      </button>
    </div>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-6 border-b border-accent-200 dark:border-accent-700">
      <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
        Theme & Appearance
      </h2>
      <p class="text-sm text-accent-500 dark:text-accent-400 mt-1">
        Personalize the look and feel of your dashboard
      </p>
    </div>

    <div class="p-6 space-y-8">
      <div>
        <div class="flex items-center justify-between">
          <div>
            <h3
              class="text-sm font-medium text-accent-900 dark:text-accent-100"
            >
              Dark Mode
            </h3>
            <p class="text-sm text-accent-500 dark:text-accent-400">
              Switch between light and dark themes
            </p>
          </div>
          <button
            type="button"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 {current_theme.mode ===
            'dark'
              ? 'bg-primary-600'
              : 'bg-accent-200'}"
            role="switch"
            aria-checked={current_theme.mode === "dark"}
            on:click={handle_theme_toggle}
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {current_theme.mode ===
              'dark'
                ? 'translate-x-5'
                : 'translate-x-0'}"
            >
              <span class="flex h-full w-full items-center justify-center">
                {#if current_theme.mode === "dark"}
                  <svg
                    class="h-3 w-3 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                    />
                  </svg>
                {:else}
                  <svg
                    class="h-3 w-3 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                {/if}
              </span>
            </span>
          </button>
        </div>
      </div>

      <div>
        <h3
          class="text-sm font-medium text-accent-900 dark:text-accent-100 mb-4"
        >
          Primary Color
        </h3>
        <div class="grid grid-cols-5 sm:grid-cols-10 gap-3">
          {#each color_options as color}
            <button
              type="button"
              class="w-10 h-10 rounded-full {color.class} ring-2 ring-offset-2 transition-all {selected_primary_color ===
              color.value
                ? 'ring-accent-900 dark:ring-accent-100 scale-110'
                : 'ring-transparent hover:ring-accent-300 dark:hover:ring-accent-600'}"
              title={color.label}
              on:click={() => handle_primary_color_change(color.value)}
              aria-label="Select {color.label} as primary color"
              aria-pressed={selected_primary_color === color.value}
            ></button>
          {/each}
        </div>
      </div>

      <div>
        <h3
          class="text-sm font-medium text-accent-900 dark:text-accent-100 mb-4"
        >
          Secondary Color
        </h3>
        <div class="grid grid-cols-5 sm:grid-cols-10 gap-3">
          {#each color_options as color}
            <button
              type="button"
              class="w-10 h-10 rounded-full {color.class} ring-2 ring-offset-2 transition-all {selected_secondary_color ===
              color.value
                ? 'ring-accent-900 dark:ring-accent-100 scale-110'
                : 'ring-transparent hover:ring-accent-300 dark:hover:ring-accent-600'}"
              title={color.label}
              on:click={() => handle_secondary_color_change(color.value)}
              aria-label="Select {color.label} as secondary color"
              aria-pressed={selected_secondary_color === color.value}
            ></button>
          {/each}
        </div>
      </div>

      <div class="pt-4 border-t border-accent-200 dark:border-accent-700">
        <button
          type="button"
          class="btn btn-outline text-sm"
          on:click={handle_reset_theme}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-6 border-b border-accent-200 dark:border-accent-700">
      <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
        Notifications
      </h2>
      <p class="text-sm text-accent-500 dark:text-accent-400 mt-1">
        Configure how you receive updates
      </p>
    </div>

    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-accent-900 dark:text-accent-100">
            Push Notifications
          </h3>
          <p class="text-sm text-accent-500 dark:text-accent-400">
            Receive browser notifications for important updates
          </p>
        </div>
        <button
          type="button"
          class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 {notifications_enabled
            ? 'bg-primary-600'
            : 'bg-accent-200'}"
          role="switch"
          aria-checked={notifications_enabled}
          aria-label="Toggle push notifications"
          on:click={() => (notifications_enabled = !notifications_enabled)}
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {notifications_enabled
              ? 'translate-x-5'
              : 'translate-x-0'}"
          ></span>
        </button>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-accent-900 dark:text-accent-100">
            Email Notifications
          </h3>
          <p class="text-sm text-accent-500 dark:text-accent-400">
            Receive email updates for game results and schedules
          </p>
        </div>
        <button
          type="button"
          class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 {email_notifications
            ? 'bg-primary-600'
            : 'bg-accent-200'}"
          role="switch"
          aria-checked={email_notifications}
          aria-label="Toggle email notifications"
          on:click={() => (email_notifications = !email_notifications)}
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {email_notifications
              ? 'translate-x-5'
              : 'translate-x-0'}"
          ></span>
        </button>
      </div>
    </div>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-6 border-b border-accent-200 dark:border-accent-700">
      <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
        Data Management
      </h2>
      <p class="text-sm text-accent-500 dark:text-accent-400 mt-1">
        Export and manage your organization data
      </p>
    </div>

    <div class="p-6 space-y-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <button type="button" class="btn btn-outline">
          <svg
            class="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export All Data
        </button>
        <button type="button" class="btn btn-outline">
          <svg
            class="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Import Data
        </button>
      </div>
      <p class="text-xs text-accent-500 dark:text-accent-400">
        Export data as JSON for backup or migration purposes
      </p>
    </div>
  </div>
</div>

<Toast
  message={toast_message}
  type={toast_type}
  is_visible={toast_visible}
  on:dismiss={() => (toast_visible = false)}
/>
