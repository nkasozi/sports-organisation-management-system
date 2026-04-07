<script lang="ts">
    import type { Organization } from "$lib/core/entities/Organization";
    import SettingsDataManagementSection from "$lib/presentation/components/settings/SettingsDataManagementSection.svelte";
    import SettingsNotificationsSection from "$lib/presentation/components/settings/SettingsNotificationsSection.svelte";
    import SettingsOrganizationBrandingSection from "$lib/presentation/components/settings/SettingsOrganizationBrandingSection.svelte";
    import SettingsSocialMediaSection from "$lib/presentation/components/settings/SettingsSocialMediaSection.svelte";
    import SettingsSyncSection from "$lib/presentation/components/settings/SettingsSyncSection.svelte";
    import SettingsThemeSection from "$lib/presentation/components/settings/SettingsThemeSection.svelte";
    import { COLOR_OPTIONS } from "$lib/presentation/logic/settingsPageState";
    import type {
        HeaderFooterStyle,
        SocialMediaLink,
    } from "$lib/presentation/stores/branding";

    export let organization_name: string;
    export let organization_logo_url: string;
    export let organization_tagline: string;
    export let organization_email: string;
    export let organization_address: string;
    export let selected_primary_color: string;
    export let selected_secondary_color: string;
    export let header_pattern: HeaderFooterStyle;
    export let footer_pattern: HeaderFooterStyle;
    export let background_pattern_url: string;
    export let show_panel_borders: boolean;
    export let social_media_links: SocialMediaLink[];
    export let organizations: Organization[];
    export let selected_organization_id: string;
    export let selected_sync_interval_ms: number;
    export let is_super_admin: boolean;
    export let is_platform_branding: boolean;
    export let organization_badge_label: string;
    export let caller_role: string;
    export let default_logo_svg: string;
    export let show_toast: (
        message: string,
        type: "success" | "error" | "info",
    ) => void;
    export let on_organization_switch: () => Promise<boolean>;
    export let on_logo_change: (event: CustomEvent<{ url: string }>) => void;
    export let on_save_organization_settings: () => Promise<void>;
</script>

<div class="max-w-4xl mx-auto space-y-8">
    <div>
        <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
            Settings
        </h1>
        <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
            Customize your sports management experience
        </p>
    </div>

    <SettingsOrganizationBrandingSection
        bind:organization_name
        bind:selected_organization_id
        bind:organization_tagline
        bind:organization_email
        bind:organization_address
        {organization_logo_url}
        {is_super_admin}
        {organizations}
        {is_platform_branding}
        {organization_badge_label}
        {default_logo_svg}
        {on_organization_switch}
        {on_logo_change}
        on_save={on_save_organization_settings}
    />
    <SettingsThemeSection
        bind:selected_primary_color
        bind:selected_secondary_color
        bind:header_pattern
        bind:footer_pattern
        bind:background_pattern_url
        bind:show_panel_borders
        color_options={COLOR_OPTIONS}
        {show_toast}
    />
    <SettingsSocialMediaSection bind:social_media_links {show_toast} />
    <SettingsNotificationsSection />
    <SettingsDataManagementSection />

    {#if caller_role === "super_admin" || caller_role === "org_admin"}
        <SettingsSyncSection
            bind:selected_sync_interval_ms
            {selected_organization_id}
            {caller_role}
            {show_toast}
        />
    {/if}
</div>
