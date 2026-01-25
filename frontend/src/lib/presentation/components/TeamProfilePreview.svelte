<script lang="ts">
  import { browser } from "$app/environment";
  import type { TeamProfile } from "$lib/core/entities/TeamProfile";
  import { get_team_profile_use_cases } from "$lib/core/usecases/TeamProfileUseCases";

  export let team_id: string;

  let profile: TeamProfile | null = null;
  let loading = false;
  let preview_url = "";

  const profile_use_cases = get_team_profile_use_cases();

  $: {
    if (team_id && browser) {
      load_profile();
    }
  }

  async function load_profile(): Promise<void> {
    if (!team_id) return;

    loading = true;
    const result = await profile_use_cases.list({ team_id });

    if (result.success && result.data.length > 0) {
      profile = result.data[0];
      update_preview_url();
    }

    loading = false;
  }

  function update_preview_url(): void {
    if (profile?.profile_slug) {
      const base_url = browser ? window.location.origin : "";
      preview_url = `${base_url}/team-profile/${profile.profile_slug}`;
    }
  }

  function open_preview(): void {
    if (preview_url) {
      window.open(preview_url, "_blank");
    }
  }

  function copy_link(): void {
    if (!preview_url) return;

    navigator.clipboard.writeText(preview_url);
  }
</script>

{#if profile && preview_url}
  <div
    class="flex flex-col sm:flex-row gap-3 p-4 bg-primary-50 dark:bg-primary-900 rounded-lg border border-primary-200 dark:border-primary-700"
  >
    <div class="flex-1">
      <div class="text-sm font-medium text-primary-900 dark:text-primary-100">
        Public Profile URL
      </div>
      <div
        class="text-sm text-primary-600 dark:text-primary-400 mt-1 break-all"
      >
        {preview_url}
      </div>
      <div class="text-xs text-primary-500 dark:text-primary-400 mt-1">
        Visibility: <span class="font-medium"
          >{profile.visibility === "public" ? "Public" : "Private"}</span
        >
      </div>
    </div>

    <div class="flex gap-2">
      <button
        on:click={open_preview}
        class="px-4 py-2 rounded-lg bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-sm font-medium"
      >
        Preview
      </button>
      <button
        on:click={copy_link}
        class="px-4 py-2 rounded-lg bg-accent-200 dark:bg-accent-700 text-accent-900 dark:text-accent-100 hover:bg-accent-300 dark:hover:bg-accent-600 transition-colors text-sm font-medium"
      >
        Copy Link
      </button>
    </div>
  </div>
{:else if loading}
  <div class="p-4 text-center text-accent-600 dark:text-accent-400">
    Loading profile...
  </div>
{:else}
  <div
    class="p-4 text-center text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-800 rounded-lg border border-accent-200 dark:border-accent-700"
  >
    <p class="text-sm">
      No public profile found. Create a team profile to get a shareable link.
    </p>
  </div>
{/if}
