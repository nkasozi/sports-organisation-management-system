<script lang="ts">
  import { theme_store } from "$lib/presentation/stores/theme";
  import { branding_store, type SocialMediaLink } from "$lib/presentation/stores/branding";

  let current_year = new Date().getFullYear();
  let theme_config: any = { mode: "light" };
  let social_media_links: SocialMediaLink[] = [];

  theme_store.subscribe((config) => {
    theme_config = config;
  });

  branding_store.subscribe((config) => {
    social_media_links = config.social_media_links || [];
  });

  $: has_custom_logo = $branding_store.organization_logo_url && $branding_store.organization_logo_url.length > 0;

  function split_organization_name(name: string): {
    prefix: string;
    suffix: string;
  } {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return { prefix: "", suffix: parts[0] };
    }
    const suffix = parts.pop() || "";
    return { prefix: parts.join(" "), suffix };
  }

  function get_social_media_icon(platform: string): string {
    const icons: { [key: string]: string } = {
      twitter:
        "M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84",
      github:
        "M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z",
      linkedin:
        "M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z",
      facebook:
        "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
      instagram:
        "M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.914 4.914 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
      youtube:
        "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
      discord:
        "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.975 14.975 0 0 0 1.293-2.1a.07.07 0 0 0-.038-.098a13.11 13.11 0 0 1-1.872-.892a.072.072 0 0 1 .009-.119c.126-.094.252-.192.372-.291a.075.075 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .079.009c.12.099.246.198.373.291a.072.072 0 0 1 .009.118a13.081 13.081 0 0 1-1.873.892a.07.07 0 0 0-.037.099a14.997 14.997 0 0 0 1.293 2.1a.078.078 0 0 0 .084.028a19.963 19.963 0 0 0 6.002-3.03a.079.079 0 0 0 .033-.057c.5-4.761-.838-8.895-3.551-12.566a.071.071 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156c0-1.193.948-2.157 2.157-2.157c1.211 0 2.157.964 2.157 2.157c0 1.19-.946 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156c0-1.193.948-2.157 2.157-2.157c1.211 0 2.157.964 2.157 2.157c0 1.19-.946 2.156-2.157 2.156z",
      tiktok:
        "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.66 0 2.9 2.9 0 0 1 5.66-.08c.03.2.05.42.05.64v3.48a6.3 6.3 0 0 1-.46-.04A6.24 6.24 0 0 1 9.01 21c-3.4 0-6.65-2.35-6.65-6.59a6.5 6.5 0 0 1 10.54-5.09v3.42a3.86 3.86 0 0 0-3.77-4.25V6.69z",
    };
    return icons[platform] || "";
  }

  function get_social_media_label(platform: string): string {
    const labels: { [key: string]: string } = {
      twitter: "Twitter",
      facebook: "Facebook",
      instagram: "Instagram",
      linkedin: "LinkedIn",
      github: "GitHub",
      youtube: "YouTube",
      tiktok: "TikTok",
      discord: "Discord",
    };
    return labels[platform] || platform;
  }
</script>

<footer
  class="bg-theme-primary-500 dark:bg-theme-primary-600 border-t border-theme-primary-600 dark:border-theme-primary-700 mt-auto"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div class="col-span-1 md:col-span-2">
        <div class="flex items-center space-x-3 mb-4">
          <div
            class="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden {has_custom_logo ? '' : 'bg-theme-secondary-600'}"
          >
            {#if has_custom_logo}
              <img
                src={$branding_store.organization_logo_url}
                alt="Organization Logo"
                class="h-full w-full object-cover"
              />
            {:else}
              <svg
                class="h-5 w-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                  clip-rule="evenodd"
                />
              </svg>
            {/if}
          </div>
          <span class="text-xl font-bold text-black">
            {#if split_organization_name($branding_store.organization_name).prefix}
              {split_organization_name($branding_store.organization_name)
                .prefix}
              <span class="text-theme-secondary-600">
                {split_organization_name($branding_store.organization_name)
                  .suffix}
              </span>
            {:else}
              <span class="text-theme-secondary-600">
                {split_organization_name($branding_store.organization_name)
                  .suffix}
              </span>
            {/if}
          </span>
        </div>
        <p class="text-sm text-gray-800 mb-4 max-w-md">
          {$branding_store.organization_tagline || "Track competitions, teams, players, officials and fixtures for your sport all in one place."}
        </p>
        <div class="flex space-x-4">
          {#if social_media_links.length > 0}
            {#each social_media_links as link (link.platform)}
              {#if link.url}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-800 hover:text-theme-secondary-600 transition-colors duration-200"
                  aria-label={get_social_media_label(link.platform)}
                  title={get_social_media_label(link.platform)}
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d={get_social_media_icon(link.platform)} />
                  </svg>
                </a>
              {/if}
            {/each}
          {:else}
            <button
              type="button"
              class="text-gray-800 hover:text-theme-secondary-600 transition-colors duration-200"
              aria-label="Twitter"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"
                />
              </svg>
            </button>
            <button
              type="button"
              class="text-gray-800 hover:text-theme-secondary-600 transition-colors duration-200"
              aria-label="GitHub"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <button
              type="button"
              class="text-gray-800 hover:text-theme-secondary-600 transition-colors duration-200"
              aria-label="LinkedIn"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <div>
        <h3
          class="text-sm font-semibold text-black tracking-wider uppercase mb-4"
        >
          Quick Links
        </h3>
        <ul class="space-y-3">
          <li>
            <a
              href="/organizations"
              class="text-sm text-gray-800 hover:text-theme-secondary-600 transition-colors duration-200"
            >
              Organizations
            </a>
          </li>
          <li>
            <a
              href="/competitions"
              class="text-sm text-gray-800 hover:text-theme-secondary-600 transition-colors duration-200"
            >
              Competitions
            </a>
          </li>
          <li>
            <a
              href="/teams"
              class="text-sm text-gray-800 hover:text-theme-secondary-600 transition-colors duration-200"
            >
              Teams
            </a>
          </li>
          <li>
            <a
              href="/games"
              class="text-sm text-gray-800 hover:text-theme-secondary-600 transition-colors duration-200"
            >
              Games
            </a>
          </li>
        </ul>
      </div>

      <!-- Support -->
      <div>
        <h3
          class="text-sm font-semibold text-black tracking-wider uppercase mb-4"
        >
          Support
        </h3>
        <ul class="space-y-3">
          <li>
            <a
              href="/help"
              class="text-sm text-gray-800 hover:text-secondary-600 transition-colors duration-200"
            >
              Help Center
            </a>
          </li>
          <li>
            <a
              href="/contact"
              class="text-sm text-gray-800 hover:text-secondary-600 transition-colors duration-200"
            >
              Contact Us
            </a>
          </li>
          <li>
            <a
              href="/privacy"
              class="text-sm text-gray-800 hover:text-secondary-600 transition-colors duration-200"
            >
              Privacy Policy
            </a>
          </li>
          <li>
            <a
              href="/terms"
              class="text-sm text-gray-800 hover:text-secondary-600 transition-colors duration-200"
            >
              Terms of Service
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Bottom section -->
    <div class="mt-8 pt-6 border-t border-primary-600 dark:border-primary-700">
      <div
        class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
      >
        <div class="flex items-center space-x-4 text-sm text-gray-800">
          <span
            >&copy; {current_year}
            {$branding_store.organization_name}. All rights reserved.</span
          >
        </div>

        <div class="flex items-center space-x-6 text-sm text-gray-800">
          <span>Version 1.0.0</span>
          <div class="flex items-center space-x-1">
            <span>Built with</span>
            <svg
              class="h-4 w-4 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clip-rule="evenodd"
              />
            </svg>
            <span>by the kasozy</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</footer>

<style>
  /* Mobile-first responsive footer */
  footer {
    margin-top: auto;
    flex-shrink: 0;
  }

  /* Link hover effects */
  a {
    transition: all 0.2s ease-in-out;
  }

  /* Focus styles for accessibility */
  a:focus-visible {
    outline: 2px solid theme("colors.primary.500");
    outline-offset: 2px;
    border-radius: 0.25rem;
  }

  button svg {
    transition: transform 0.2s ease-in-out;
  }

  button:hover svg {
    transform: scale(1.1);
  }
</style>
