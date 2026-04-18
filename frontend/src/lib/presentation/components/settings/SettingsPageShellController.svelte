<script lang="ts">
    import { onMount } from "svelte";

    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import type { Organization } from "$lib/core/entities/Organization";
    import { ANY_VALUE } from "$lib/core/interfaces/ports";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import { create_settings_page_shell_controller_runtime } from "$lib/presentation/logic/settingsPageShellControllerRuntime";
    import {
        DEFAULT_LOGO_SVG,
        type SettingsFormValues,
    } from "$lib/presentation/logic/settingsPageState";
    import { auth_store } from "$lib/presentation/stores/auth";
    import {
        branding_store,
        type HeaderFooterStyle,
        type SocialMediaLink,
    } from "$lib/presentation/stores/branding";
    import { theme_store } from "$lib/presentation/stores/theme";

    import SettingsPageBody from "./SettingsPageBody.svelte";

    let toast_visible = false,
        toast_message = "",
        toast_type: "success" | "error" | "info" = "info",
        is_loading = true,
        error_message = "",
        organization_name = "",
        organization_logo_url = "",
        organization_tagline = "",
        organization_email = "",
        organization_address = "",
        selected_primary_color = "red",
        selected_secondary_color = "blue",
        header_pattern: HeaderFooterStyle = "pattern",
        footer_pattern: HeaderFooterStyle = "solid_color",
        background_pattern_url = "/african-mosaic-bg.svg",
        show_panel_borders = false,
        social_media_links: SocialMediaLink[] = [],
        organizations: Organization[] = [],
        selected_organization_id = "",
        selected_sync_interval_ms = 3_600_000;

    $: current_profile_state = (() => {
        const current_profile = $auth_store.current_profile;

        if (current_profile.status !== "present") {
            return { status: "missing" } as const;
        }

        return {
            status: "present",
            profile: current_profile.profile,
        } as const;
    })();
    $: is_super_admin =
        current_profile_state.status === "present" &&
        current_profile_state.profile.organization_id === ANY_VALUE;
    $: is_platform_branding =
        current_profile_state.status !== "present" ||
        current_profile_state.profile.organization_id === ANY_VALUE;
    $: organization_badge_label =
        organization_name || $branding_store.organization_name;

    function get_current_form_values(): SettingsFormValues {
        return {
            organization_name,
            organization_logo_url,
            organization_tagline,
            organization_email,
            organization_address,
            selected_primary_color,
            selected_secondary_color,
            header_pattern,
            footer_pattern,
            background_pattern_url,
            show_panel_borders,
            social_media_links,
            selected_sync_interval_ms,
        };
    }

    function apply_form_values(form_values: SettingsFormValues): void {
        organization_name = form_values.organization_name;
        organization_logo_url = form_values.organization_logo_url;
        organization_tagline = form_values.organization_tagline;
        organization_email = form_values.organization_email;
        organization_address = form_values.organization_address;
        selected_primary_color = form_values.selected_primary_color;
        selected_secondary_color = form_values.selected_secondary_color;
        header_pattern = form_values.header_pattern;
        footer_pattern = form_values.footer_pattern;
        background_pattern_url = form_values.background_pattern_url;
        show_panel_borders = form_values.show_panel_borders;
        social_media_links = form_values.social_media_links;
        selected_sync_interval_ms = form_values.selected_sync_interval_ms;
    }

    const runtime = create_settings_page_shell_controller_runtime({
        apply_form_values,
        get_branding_state: () => $branding_store,
        get_current_form_values,
        get_current_profile_organization_id: () =>
            current_profile_state.status === "present"
                ? current_profile_state.profile.organization_id
                : "",
        get_organizations: () => organizations,
        get_pathname: () => $page.url.pathname,
        get_selected_organization_id: () => selected_organization_id,
        get_theme_state: () => $theme_store,
        is_browser: browser,
        set_error_message: (value: string) => (error_message = value),
        set_is_loading: (value: boolean) => (is_loading = value),
        set_organizations: (value: Organization[]) => (organizations = value),
        set_selected_organization_id: (value: string) =>
            (selected_organization_id = value),
        show_toast,
        update_logo_url: (value: string) => (organization_logo_url = value),
    });

    onMount(() => void runtime.initialize_page());

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

<SettingsPageBody
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
    {is_loading}
    {error_message}
    {organization_logo_url}
    {organizations}
    {is_super_admin}
    {is_platform_branding}
    {organization_badge_label}
    caller_role={
        current_profile_state.status === "present"
            ? current_profile_state.profile.role
            : ""
    }
    default_logo_svg={DEFAULT_LOGO_SVG}
    {show_toast}
    handle_selected_organization_switch={runtime.handle_selected_organization_switch}
    handle_logo_change={runtime.handle_logo_change}
    handle_save_organization_settings={runtime.handle_save_organization_settings}
/>

<Toast
    message={toast_message}
    type={toast_type}
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
