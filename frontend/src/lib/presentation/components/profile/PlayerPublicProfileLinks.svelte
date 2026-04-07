<script lang="ts">
    import type { ProfileLink } from "$lib/core/entities/ProfileLink";
    import { get_platform_icon } from "$lib/core/entities/ProfileLink";

    export let social_media_links: ProfileLink[];
    export let website_links: ProfileLink[];
    export let video_links: ProfileLink[];
</script>

{#if social_media_links.length > 0 || website_links.length > 0 || video_links.length > 0}
    <section
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden p-6"
    >
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Links & Media
        </h2>

        {#if social_media_links.length > 0}
            <div class="mb-6">
                <h3
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3"
                >
                    Social Media
                </h3>
                <div class="flex flex-wrap gap-3">
                    {#each social_media_links as link}
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <svg
                                class="w-5 h-5 text-gray-700 dark:text-gray-300"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d={get_platform_icon(
                                        link.platform || "other",
                                    )}
                                />
                            </svg>
                            <span
                                class="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                {link.title || link.platform}
                            </span>
                        </a>
                    {/each}
                </div>
            </div>
        {/if}

        {#if website_links.length > 0}
            <div class="mb-6">
                <h3
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3"
                >
                    Websites
                </h3>
                <div class="space-y-2">
                    {#each website_links as link}
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg
                                class="w-5 h-5 text-indigo-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d={get_platform_icon(
                                        link.platform || "website",
                                    )}
                                />
                            </svg>
                            <span
                                class="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                {link.title}
                            </span>
                        </a>
                    {/each}
                </div>
            </div>
        {/if}

        {#if video_links.length > 0}
            <div>
                <h3
                    class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3"
                >
                    Videos
                </h3>
                <div class="space-y-2">
                    {#each video_links as link}
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                            <svg
                                class="w-5 h-5 text-red-600 dark:text-red-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d={get_platform_icon(
                                        link.platform || "youtube",
                                    )}
                                />
                            </svg>
                            <span
                                class="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                {link.title}
                            </span>
                        </a>
                    {/each}
                </div>
            </div>
        {/if}
    </section>
{/if}
