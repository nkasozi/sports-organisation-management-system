<script lang="ts">
    import type { SettingsOption } from "$lib/presentation/logic/settingsPageState";
    import type { SocialMediaLink } from "$lib/presentation/stores/branding";

    export let link: SocialMediaLink;
    export let index: number;
    export let social_media_options: ReadonlyArray<SettingsOption>;
    export let on_platform_change: (
        old_platform: string,
        new_platform: string,
    ) => void;
    export let on_url_change: (platform: string, url: string) => void;
    export let on_remove: (platform: string) => void;
</script>

<div
    class="flex flex-col sm:flex-row gap-3 p-4 rounded-lg bg-accent-50 dark:bg-accent-700"
>
    <div class="flex-1 min-w-0">
        <label
            for={`platform_${index}`}
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
        >
            Platform
        </label>
        <select
            id={`platform_${index}`}
            class="select-styled w-full"
            value={link.platform}
            on:change={(event) =>
                on_platform_change(link.platform, event.currentTarget.value)}
        >
            {#each social_media_options as option}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
    </div>

    <div class="flex-1 min-w-0">
        <label
            for={`url_${index}`}
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
        >
            URL
        </label>
        <input
            id={`url_${index}`}
            type="url"
            class="input w-full"
            value={link.url}
            placeholder="https://..."
            on:input={(event) =>
                on_url_change(link.platform, event.currentTarget.value)}
        />
    </div>

    <div class="flex items-end">
        <button
            type="button"
            class="btn btn-outline text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3"
            aria-label={`Remove ${link.platform}`}
            on:click={() => on_remove(link.platform)}
        >
            <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                /></svg
            >
        </button>
    </div>
</div>
