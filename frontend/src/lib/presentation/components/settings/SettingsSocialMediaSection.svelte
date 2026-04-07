<script lang="ts">
    import SettingsSectionCard from "$lib/presentation/components/settings/SettingsSectionCard.svelte";
    import SettingsSocialMediaItem from "$lib/presentation/components/settings/SettingsSocialMediaItem.svelte";
    import {
        add_social_media_link,
        remove_social_media_link,
        SOCIAL_MEDIA_OPTIONS,
        update_social_media_platform,
        update_social_media_url,
    } from "$lib/presentation/logic/settingsPageState";
    import {
        branding_store,
        type SocialMediaLink,
    } from "$lib/presentation/stores/branding";

    export let social_media_links: SocialMediaLink[];
    export let show_toast: (
        message: string,
        type: "success" | "error" | "info",
    ) => void;

    function handle_add_link(): void {
        const result = add_social_media_link(social_media_links);
        if (!result.success) {
            show_toast(result.error_message, "info");
            return;
        }
        social_media_links = result.data;
    }

    function handle_platform_change(
        old_platform: string,
        new_platform: string,
    ): void {
        const result = update_social_media_platform(
            social_media_links,
            old_platform,
            new_platform,
        );
        if (!result.success) {
            show_toast(result.error_message, "error");
            return;
        }
        social_media_links = result.data;
    }

    function handle_url_change(platform: string, url: string): void {
        social_media_links = update_social_media_url(
            social_media_links,
            platform,
            url,
        );
    }

    function handle_remove(platform: string): void {
        social_media_links = remove_social_media_link(
            social_media_links,
            platform,
        );
    }

    async function handle_save(): Promise<void> {
        await branding_store.update_social_media_links(social_media_links);
        show_toast("Social media settings saved", "success");
    }
</script>

<SettingsSectionCard
    title="Social Media Links"
    description="Configure social media platforms displayed in the footer"
>
    {#if social_media_links.length === 0}
        <div class="text-center py-8">
            <p class="text-accent-600 dark:text-accent-400 mb-4">
                No social media links configured yet
            </p>
            <button
                type="button"
                class="btn btn-primary-action"
                on:click={handle_add_link}
            >
                <svg
                    class="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    /></svg
                >
                Add Social Media Link
            </button>
        </div>
    {:else}
        <div class="space-y-4">
            {#each social_media_links as link, index (link.platform)}
                <SettingsSocialMediaItem
                    {link}
                    {index}
                    social_media_options={SOCIAL_MEDIA_OPTIONS}
                    on_platform_change={handle_platform_change}
                    on_url_change={handle_url_change}
                    on_remove={handle_remove}
                />
            {/each}
        </div>

        <button
            type="button"
            class="btn btn-primary-action"
            on:click={handle_add_link}
        >
            <svg
                class="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                /></svg
            >
            Add Another Link
        </button>

        <div class="pt-4 border-t border-accent-200 dark:border-accent-700">
            <button
                type="button"
                class="btn btn-primary-action"
                on:click={handle_save}
            >
                Save Social Media Settings
            </button>
        </div>
    {/if}
</SettingsSectionCard>
