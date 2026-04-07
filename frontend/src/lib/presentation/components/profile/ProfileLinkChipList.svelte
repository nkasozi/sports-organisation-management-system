<script lang="ts">
    import type { ProfileLink } from "$lib/core/entities/ProfileLink";
    import { get_platform_icon } from "$lib/core/entities/ProfileLink";

    export let links: ProfileLink[];
</script>

<div class="mt-6 flex flex-wrap gap-3">
    {#each links as link (link.id)}
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
        >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d={get_platform_icon(link.platform || "other")} />
            </svg>
            <span class="font-medium">{link.title || link.platform}</span>
        </a>
    {/each}
</div>
