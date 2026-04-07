<script lang="ts">
    import type { Organization } from "$lib/core/entities/Organization";
    import SettingsPageContent from "$lib/presentation/components/settings/SettingsPageContent.svelte";
    import type {
        HeaderFooterStyle,
        SocialMediaLink,
    } from "$lib/presentation/stores/branding";

    export let background_pattern_url: string;
    export let caller_role: string;
    export let default_logo_svg: string;
    export let error_message: string;
    export let footer_pattern: HeaderFooterStyle;
    export let handle_logo_change: (
        event: CustomEvent<{ url: string }>,
    ) => void;
    export let handle_save_organization_settings: () => Promise<void>;
    export let handle_selected_organization_switch: () => Promise<boolean>;
    export let header_pattern: HeaderFooterStyle;
    export let is_loading: boolean;
    export let is_platform_branding: boolean;
    export let is_super_admin: boolean;
    export let organization_address: string;
    export let organization_badge_label: string;
    export let organization_email: string;
    export let organization_logo_url: string;
    export let organization_name: string;
    export let organization_tagline: string;
    export let organizations: Organization[];
    export let selected_organization_id: string;
    export let selected_primary_color: string;
    export let selected_secondary_color: string;
    export let selected_sync_interval_ms: number;
    export let show_panel_borders: boolean;
    export let show_toast: (
        message: string,
        type: "success" | "error" | "info",
    ) => void;
    export let social_media_links: SocialMediaLink[];
</script>

{#if is_loading}
    <div class="flex items-center justify-center py-12">
        <div
            class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"
        ></div>
    </div>
{:else if error_message}
    <div class="card p-8 text-center">
        <svg
            class="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            /></svg
        >
        <h3
            class="mt-4 text-lg font-medium text-accent-900 dark:text-accent-100"
        >
            Unable to Load Settings
        </h3>
        <p class="mt-2 text-accent-600 dark:text-accent-400">{error_message}</p>
    </div>
{:else}
    <SettingsPageContent
        bind:organization_name
        bind:organization_tagline
        bind:organization_email
        bind:organization_address
        bind:selected_primary_color
        bind:selected_secondary_color
        bind:header_pattern
        bind:footer_pattern
        bind:background_pattern_url
        bind:show_panel_borders
        bind:social_media_links
        bind:selected_organization_id
        bind:selected_sync_interval_ms
        {organization_logo_url}
        {organizations}
        {is_super_admin}
        {is_platform_branding}
        {organization_badge_label}
        {caller_role}
        {default_logo_svg}
        {show_toast}
        on_organization_switch={handle_selected_organization_switch}
        on_logo_change={handle_logo_change}
        on_save_organization_settings={handle_save_organization_settings}
    />
{/if}
