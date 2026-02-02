<script lang="ts">
  import { onMount } from "svelte";
  import {
    theme_store,
    toggle_theme_mode,
    update_theme_colors,
    reset_theme_to_default,
  } from "$lib/presentation/stores/theme";
  import {
    branding_store,
    type SocialMediaLink,
  } from "$lib/presentation/stores/branding";
  import Toast from "$lib/presentation/components/ui/Toast.svelte";
  import ImageUpload from "$lib/presentation/components/ui/ImageUpload.svelte";
  import { current_user_store } from "$lib/presentation/stores/currentUser";
  import { get_use_cases_container } from "$lib/infrastructure/container";
  import type { Organization } from "$lib/core/entities/Organization";

  const DEFAULT_LOGO_SVG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ffffff'%3E%3Cpath fill-rule='evenodd' d='M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z' clip-rule='evenodd'/%3E%3C/svg%3E";

  let toast_visible: boolean = false;
  let toast_message: string = "";
  let toast_type: "success" | "error" | "info" = "info";

  let organization_name: string = "";
  let organization_logo_url: string = "";
  let organization_tagline: string = "";
  let organization_email: string = "";
  let organization_address: string = "";
  let selected_primary_color: string = "red";
  let selected_secondary_color: string = "blue";
  let header_pattern: "solid_color" | "pattern" = "pattern";
  let footer_pattern: "solid_color" | "pattern" = "solid_color";
  let background_pattern_url: string = "/african-mosaic-bg.svg";
  let show_panel_borders: boolean = false;
  let notifications_enabled: boolean = true;
  let email_notifications: boolean = true;
  let social_media_links: SocialMediaLink[] = [];
  let organizations: Organization[] = [];
  let selected_organization_id: string = "";

  const social_media_options = [
    { value: "twitter", label: "Twitter", icon: "twitter" },
    { value: "facebook", label: "Facebook", icon: "facebook" },
    { value: "instagram", label: "Instagram", icon: "instagram" },
    { value: "linkedin", label: "LinkedIn", icon: "linkedin" },
    { value: "github", label: "GitHub", icon: "github" },
    { value: "youtube", label: "YouTube", icon: "youtube" },
    { value: "tiktok", label: "TikTok", icon: "tiktok" },
    { value: "discord", label: "Discord", icon: "discord" },
  ];

  onMount(async () => {
    organization_name = $branding_store.organization_name;
    organization_logo_url = $branding_store.organization_logo_url;
    organization_tagline = $branding_store.organization_tagline || "";
    organization_email = $branding_store.organization_email || "";
    organization_address = $branding_store.organization_address || "";
    social_media_links = $branding_store.social_media_links || [];
    header_pattern = $branding_store.header_pattern || "pattern";
    footer_pattern = $branding_store.footer_pattern || "pattern";
    background_pattern_url =
      $branding_store.background_pattern_url || "/african-mosaic-bg.svg";
    show_panel_borders = $branding_store.show_panel_borders ?? false;
    selected_primary_color = map_theme_color_to_option(
      $theme_store.primary_color,
    );
    selected_secondary_color = map_theme_color_to_option(
      $theme_store.secondary_color,
    );

    const use_cases = get_use_cases_container();
    const orgs_result = await use_cases.organization_use_cases.list({});
    if (
      orgs_result.success &&
      orgs_result.data &&
      orgs_result.data.length > 0
    ) {
      organizations = orgs_result.data;
      selected_organization_id = organizations[0].id;
    }
  });

  function get_current_user_id(): string {
    return $current_user_store?.id ?? "default_user";
  }

  const color_options = [
    {
      value: "yellow",
      label: "Amber",
      hex: "#D97706",
      class: "bg-amber-600",
    },
    { value: "blue", label: "Blue", hex: "#2563EB", class: "bg-blue-600" },
    {
      value: "green",
      label: "Emerald",
      hex: "#059669",
      class: "bg-emerald-600",
    },
    { value: "red", label: "Red", hex: "#DC2626", class: "bg-red-600" },
    {
      value: "purple",
      label: "Purple",
      hex: "#9333EA",
      class: "bg-purple-600",
    },
    {
      value: "orange",
      label: "Orange",
      hex: "#EA580C",
      class: "bg-orange-600",
    },
    { value: "pink", label: "Pink", hex: "#DB2777", class: "bg-pink-600" },
    { value: "teal", label: "Teal", hex: "#0D9488", class: "bg-teal-600" },
    {
      value: "indigo",
      label: "Indigo",
      hex: "#4F46E5",
      class: "bg-indigo-600",
    },
    { value: "cyan", label: "Cyan", hex: "#0891B2", class: "bg-cyan-600" },
    { value: "rose", label: "Rose", hex: "#E11D48", class: "bg-rose-600" },
    {
      value: "violet",
      label: "Violet",
      hex: "#7C3AED",
      class: "bg-violet-600",
    },
    {
      value: "fuchsia",
      label: "Fuchsia",
      hex: "#C026D3",
      class: "bg-fuchsia-600",
    },
    { value: "lime", label: "Lime", hex: "#65A30D", class: "bg-lime-600" },
    { value: "sky", label: "Sky", hex: "#0284C7", class: "bg-sky-600" },
    { value: "slate", label: "Slate", hex: "#475569", class: "bg-slate-600" },
  ];

  function map_theme_color_to_option(theme_color: string): string {
    const color_mapping: Record<string, string> = {
      amber: "yellow",
      emerald: "green",
    };
    return color_mapping[theme_color] || theme_color;
  }

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
    selected_primary_color = "red";
    selected_secondary_color = "blue";
    show_toast("Theme reset to defaults", "success");
  }

  function handle_header_pattern_change(
    style: "solid_color" | "pattern",
  ): void {
    header_pattern = style;
    branding_store.update((config) => ({
      ...config,
      header_pattern: style,
    }));
    show_toast(
      style === "pattern"
        ? "Header set to pattern"
        : "Header set to solid color",
      "success",
    );
  }

  function handle_footer_pattern_change(
    style: "solid_color" | "pattern",
  ): void {
    footer_pattern = style;
    branding_store.update((config) => ({
      ...config,
      footer_pattern: style,
    }));
    show_toast(
      style === "pattern"
        ? "Footer set to pattern"
        : "Footer set to solid color",
      "success",
    );
  }

  function handle_panel_borders_toggle(enabled: boolean): void {
    show_panel_borders = enabled;
    branding_store.update((config) => ({
      ...config,
      show_panel_borders: enabled,
    }));
    show_toast(
      enabled ? "Panel borders enabled" : "Panel borders disabled",
      "success",
    );
  }

  function handle_pattern_upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.includes("svg")) {
      show_toast("Please upload an SVG file", "error");
      return;
    }

    if (file.size > 500 * 1024) {
      show_toast("File size must be less than 500KB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      background_pattern_url = result;
      branding_store.update((config) => ({
        ...config,
        background_pattern_url: result,
      }));
      show_toast("Custom pattern uploaded", "success");
    };
    reader.onerror = () => {
      show_toast("Failed to read file", "error");
    };
    reader.readAsDataURL(file);
  }

  function reset_to_default_pattern(): void {
    background_pattern_url = "/african-mosaic-bg.svg";
    branding_store.update((config) => ({
      ...config,
      background_pattern_url: "/african-mosaic-bg.svg",
    }));
    show_toast("Reset to default pattern", "success");
  }

  function handle_save_organization_settings(): void {
    branding_store.set({
      organization_name: organization_name,
      organization_logo_url: organization_logo_url,
      organization_tagline: organization_tagline,
      organization_email: organization_email,
      organization_address: organization_address,
      social_media_links: social_media_links,
      header_footer_style: "pattern",
      header_pattern: header_pattern,
      footer_pattern: footer_pattern,
      background_pattern_url: background_pattern_url,
      show_panel_borders: show_panel_borders,
    });
    show_toast("Organization settings saved", "success");
  }

  function handle_logo_change(event: CustomEvent<{ url: string }>): void {
    organization_logo_url = event.detail.url;
  }

  function add_social_media_link(): void {
    const available_platforms = social_media_options.filter(
      (opt) => !social_media_links.some((link) => link.platform === opt.value),
    );
    if (available_platforms.length === 0) {
      show_toast("All social media platforms are already added", "info");
      return;
    }
    social_media_links = [
      ...social_media_links,
      { platform: available_platforms[0].value, url: "" },
    ];
  }

  function remove_social_media_link(platform: string): void {
    social_media_links = social_media_links.filter(
      (link) => link.platform !== platform,
    );
  }

  function update_social_media_url(platform: string, url: string): void {
    social_media_links = social_media_links.map((link) =>
      link.platform === platform ? { ...link, url } : link,
    );
  }

  function update_social_media_platform(
    old_platform: string,
    new_platform: string,
  ): void {
    if (
      social_media_links.some((link) => link.platform === new_platform) &&
      new_platform !== old_platform
    ) {
      show_toast("This platform is already added", "error");
      return;
    }
    social_media_links = social_media_links.map((link) =>
      link.platform === old_platform
        ? { ...link, platform: new_platform }
        : link,
    );
  }

  function save_social_media_settings(): void {
    branding_store.update_social_media_links(social_media_links);
    show_toast("Social media settings saved", "success");
  }

  function show_toast(
    message: string,
    type: "success" | "error" | "info",
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
      <div class="space-y-6">
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
            class="input w-full max-w-md"
            bind:value={organization_name}
            placeholder="Enter organization name"
          />
        </div>

        <div>
          <ImageUpload
            label="Organization Logo"
            current_image_url={organization_logo_url}
            default_image_url={DEFAULT_LOGO_SVG}
            max_size_mb={2}
            on:change={handle_logo_change}
          />
        </div>

        <div>
          <label
            for="org_tagline"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
          >
            Organization Tagline
          </label>
          <textarea
            id="org_tagline"
            class="input w-full max-w-md resize-none"
            rows="3"
            bind:value={organization_tagline}
            placeholder="Enter a short description for your organization"
          ></textarea>
          <p class="text-xs text-accent-500 dark:text-accent-400 mt-1">
            This appears on the dashboard and footer of your application
          </p>
        </div>

        <div>
          <label
            for="org_email"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
          >
            Contact Email
          </label>
          <input
            id="org_email"
            type="email"
            class="input w-full max-w-md"
            bind:value={organization_email}
            placeholder="contact@yourorganization.com"
          />
          <p class="text-xs text-accent-500 dark:text-accent-400 mt-1">
            Displayed on contact, privacy, and terms pages
          </p>
        </div>

        <div>
          <label
            for="org_address"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
          >
            Organization Address
          </label>
          <textarea
            id="org_address"
            class="input w-full max-w-md resize-none"
            rows="2"
            bind:value={organization_address}
            placeholder="123 Sports Avenue, Stadium City, SC 12345"
          ></textarea>
          <p class="text-xs text-accent-500 dark:text-accent-400 mt-1">
            Your organization's physical address for official correspondence
          </p>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-primary-action"
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

      <div>
        <h3
          class="text-sm font-medium text-accent-900 dark:text-accent-100 mb-4"
        >
          Header & Footer Style
        </h3>
        <p class="text-xs text-accent-500 dark:text-accent-400 mb-4">
          Choose between a decorative pattern or solid color for header and
          footer independently
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
          <div>
            <div
              class="font-semibold mb-2 text-accent-800 dark:text-accent-200 text-sm"
            >
              Header
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="relative flex-1 p-3 rounded-lg border-2 transition-all {header_pattern ===
                'pattern'
                  ? 'border-theme-primary-500 bg-theme-primary-50 dark:bg-theme-primary-900/20'
                  : 'border-accent-200 dark:border-accent-700 hover:border-accent-300 dark:hover:border-accent-600'}"
                on:click={() => handle_header_pattern_change("pattern")}
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded overflow-hidden border border-accent-200 dark:border-accent-600 relative flex-shrink-0"
                  >
                    <div
                      class="absolute inset-0"
                      style="background-image: url('/african-mosaic-bg.svg'); background-size: 20px; background-repeat: repeat;"
                    ></div>
                    <div class="absolute inset-0 bg-theme-primary-500/40"></div>
                  </div>
                  <span class="text-xs font-medium">Pattern</span>
                </div>
                {#if header_pattern === "pattern"}
                  <div
                    class="absolute top-1 right-1 w-4 h-4 bg-theme-primary-500 rounded-full flex items-center justify-center"
                  >
                    <svg
                      class="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M5 13l4 4L19 7"
                      /></svg
                    >
                  </div>
                {/if}
              </button>
              <button
                type="button"
                class="relative flex-1 p-3 rounded-lg border-2 transition-all {header_pattern ===
                'solid_color'
                  ? 'border-theme-primary-500 bg-theme-primary-50 dark:bg-theme-primary-900/20'
                  : 'border-accent-200 dark:border-accent-700 hover:border-accent-300 dark:hover:border-accent-600'}"
                on:click={() => handle_header_pattern_change("solid_color")}
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded bg-theme-primary-500 border border-accent-200 dark:border-accent-600 flex-shrink-0"
                  ></div>
                  <span class="text-xs font-medium">Solid</span>
                </div>
                {#if header_pattern === "solid_color"}
                  <div
                    class="absolute top-1 right-1 w-4 h-4 bg-theme-primary-500 rounded-full flex items-center justify-center"
                  >
                    <svg
                      class="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M5 13l4 4L19 7"
                      /></svg
                    >
                  </div>
                {/if}
              </button>
            </div>
          </div>
          <div>
            <div
              class="font-semibold mb-2 text-accent-800 dark:text-accent-200 text-sm"
            >
              Footer
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="relative flex-1 p-3 rounded-lg border-2 transition-all {footer_pattern ===
                'pattern'
                  ? 'border-theme-primary-500 bg-theme-primary-50 dark:bg-theme-primary-900/20'
                  : 'border-accent-200 dark:border-accent-700 hover:border-accent-300 dark:hover:border-accent-600'}"
                on:click={() => handle_footer_pattern_change("pattern")}
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded overflow-hidden border border-accent-200 dark:border-accent-600 relative flex-shrink-0"
                  >
                    <div
                      class="absolute inset-0"
                      style="background-image: url('/african-mosaic-bg.svg'); background-size: 20px; background-repeat: repeat;"
                    ></div>
                    <div class="absolute inset-0 bg-theme-primary-500/40"></div>
                  </div>
                  <span class="text-xs font-medium">Pattern</span>
                </div>
                {#if footer_pattern === "pattern"}
                  <div
                    class="absolute top-1 right-1 w-4 h-4 bg-theme-primary-500 rounded-full flex items-center justify-center"
                  >
                    <svg
                      class="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M5 13l4 4L19 7"
                      /></svg
                    >
                  </div>
                {/if}
              </button>
              <button
                type="button"
                class="relative flex-1 p-3 rounded-lg border-2 transition-all {footer_pattern ===
                'solid_color'
                  ? 'border-theme-primary-500 bg-theme-primary-50 dark:bg-theme-primary-900/20'
                  : 'border-accent-200 dark:border-accent-700 hover:border-accent-300 dark:hover:border-accent-600'}"
                on:click={() => handle_footer_pattern_change("solid_color")}
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded bg-theme-primary-500 border border-accent-200 dark:border-accent-600 flex-shrink-0"
                  ></div>
                  <span class="text-xs font-medium">Solid</span>
                </div>
                {#if footer_pattern === "solid_color"}
                  <div
                    class="absolute top-1 right-1 w-4 h-4 bg-theme-primary-500 rounded-full flex items-center justify-center"
                  >
                    <svg
                      class="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M5 13l4 4L19 7"
                      /></svg
                    >
                  </div>
                {/if}
              </button>
            </div>
          </div>
        </div>

        {#if header_pattern === "pattern" || footer_pattern === "pattern"}
          <div class="mt-4 p-4 rounded-lg bg-accent-50 dark:bg-accent-700/50">
            <h4
              class="text-sm font-medium text-accent-700 dark:text-accent-300 mb-3"
            >
              Panel Borders
            </h4>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-accent-500 dark:text-accent-400">
                  Show white borders around header/footer panels when pattern is
                  active
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={show_panel_borders}
                aria-label="Toggle panel borders"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-theme-primary-500 focus:ring-offset-2 {show_panel_borders
                  ? 'bg-theme-primary-500'
                  : 'bg-accent-300 dark:bg-accent-600'}"
                on:click={() =>
                  handle_panel_borders_toggle(!show_panel_borders)}
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {show_panel_borders
                    ? 'translate-x-5'
                    : 'translate-x-0'}"
                ></span>
              </button>
            </div>
          </div>
        {/if}

        {#if header_pattern === "pattern" || footer_pattern === "pattern"}
          <div class="mt-4 p-4 rounded-lg bg-accent-50 dark:bg-accent-700/50">
            <h4
              class="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
            >
              Custom Pattern (Optional)
            </h4>
            <p class="text-xs text-accent-500 dark:text-accent-400 mb-3">
              Upload your own SVG pattern or use the default African mosaic
            </p>
            <div class="flex flex-col sm:flex-row gap-4 items-start">
              <div
                class="w-20 h-20 rounded-lg overflow-hidden border-2 border-dashed border-accent-300 dark:border-accent-600 relative flex-shrink-0"
              >
                <div
                  class="absolute inset-0"
                  style="background-image: url('{background_pattern_url}'); background-size: 40px; background-repeat: repeat;"
                ></div>
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex flex-wrap gap-2">
                  <label class="btn btn-outline text-xs cursor-pointer">
                    <input
                      type="file"
                      accept=".svg,image/svg+xml"
                      class="hidden"
                      on:change={handle_pattern_upload}
                    />
                    Upload SVG
                  </label>
                  <button
                    type="button"
                    class="btn btn-outline text-xs"
                    on:click={reset_to_default_pattern}
                  >
                    Use Default
                  </button>
                </div>
                <p class="text-xs text-accent-400 dark:text-accent-500">
                  Max size: 500KB
                </p>
              </div>
            </div>
          </div>
        {/if}
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
        Social Media Links
      </h2>
      <p class="text-sm text-accent-500 dark:text-accent-400 mt-1">
        Configure social media platforms displayed in the footer
      </p>
    </div>

    <div class="p-6 space-y-6">
      {#if social_media_links.length === 0}
        <div class="text-center py-8">
          <p class="text-accent-600 dark:text-accent-400 mb-4">
            No social media links configured yet
          </p>
          <button
            type="button"
            class="btn btn-primary-action"
            on:click={add_social_media_link}
          >
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Social Media Link
          </button>
        </div>
      {:else}
        <div class="space-y-4">
          {#each social_media_links as link, index (link.platform)}
            <div
              class="flex flex-col sm:flex-row gap-3 p-4 rounded-lg bg-accent-50 dark:bg-accent-700"
            >
              <div class="flex-1 min-w-0">
                <label
                  for="platform_{index}"
                  class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                >
                  Platform
                </label>
                <select
                  id="platform_{index}"
                  class="select-styled w-full"
                  value={link.platform}
                  on:change={(e) =>
                    update_social_media_platform(
                      link.platform,
                      e.currentTarget.value,
                    )}
                >
                  {#each social_media_options as option}
                    <option value={option.value}>
                      {option.label}
                    </option>
                  {/each}
                </select>
              </div>

              <div class="flex-1 min-w-0">
                <label
                  for="url_{index}"
                  class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                >
                  URL
                </label>
                <input
                  id="url_{index}"
                  type="url"
                  class="input w-full"
                  value={link.url}
                  placeholder="https://..."
                  on:input={(e) =>
                    update_social_media_url(
                      link.platform,
                      e.currentTarget.value,
                    )}
                />
              </div>

              <div class="flex items-end">
                <button
                  type="button"
                  class="btn btn-outline text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3"
                  on:click={() => remove_social_media_link(link.platform)}
                  aria-label="Remove {link.platform}"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>

        <button
          type="button"
          class="btn btn-primary-action"
          on:click={add_social_media_link}
        >
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Another Link
        </button>

        <div class="pt-4 border-t border-accent-200 dark:border-accent-700">
          <button
            type="button"
            class="btn btn-primary-action"
            on:click={save_social_media_settings}
          >
            Save Social Media Settings
          </button>
        </div>
      {/if}
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
