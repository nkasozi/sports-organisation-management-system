<script lang="ts">
    import { onMount } from "svelte";

    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import type { Organization } from "$lib/core/entities/Organization";
    import { ANY_VALUE } from "$lib/core/interfaces/ports";
    import { get_use_cases_container } from "$lib/infrastructure/container";
    import SettingsPageContent from "$lib/presentation/components/settings/SettingsPageContent.svelte";
    import Toast from "$lib/presentation/components/ui/Toast.svelte";
    import {
        ensure_auth_profile,
        ensure_route_access,
    } from "$lib/presentation/logic/authGuard";
    import {
        apply_organization_settings_form_values,
        create_settings_form_values,
        DEFAULT_LOGO_SVG,
        get_default_selected_organization_id,
        type SettingsFormValues,
    } from "$lib/presentation/logic/settingsPageState";
    import { auth_store } from "$lib/presentation/stores/auth";
    import {
        branding_store,
        type HeaderFooterStyle,
        type SocialMediaLink,
    } from "$lib/presentation/stores/branding";
    import { theme_store } from "$lib/presentation/stores/theme";

    let toast_visible: boolean = false;
    let toast_message: string = "";
    let toast_type: "success" | "error" | "info" = "info";
    let is_loading: boolean = true;
    let error_message: string = "";
    let organization_name: string = "";
    let organization_logo_url: string = "";
    let organization_tagline: string = "";
    let organization_email: string = "";
    let organization_address: string = "";
    let selected_primary_color: string = "red";
    let selected_secondary_color: string = "blue";
    let header_pattern: HeaderFooterStyle = "pattern";
    let footer_pattern: HeaderFooterStyle = "solid_color";
    let background_pattern_url: string = "/african-mosaic-bg.svg";
    let show_panel_borders: boolean = false;
    let social_media_links: SocialMediaLink[] = [];
    let organizations: Organization[] = [];
    let selected_organization_id: string = "";
    let selected_sync_interval_ms: number = 3_600_000;

    $: current_profile = $auth_store.current_profile;
    $: is_super_admin = current_profile?.organization_id === ANY_VALUE;
    $: is_platform_branding =
        !current_profile || current_profile.organization_id === ANY_VALUE;
    $: organization_badge_label =
        organization_name || $branding_store.organization_name;

    onMount(async () => {
        if (!browser) {
            return;
        }

        const route_allowed = await ensure_route_access($page.url.pathname);
        if (!route_allowed) {
            return;
        }

        const auth_result = await ensure_auth_profile();
        if (!auth_result.success) {
            error_message = auth_result.error_message;
            is_loading = false;
            return;
        }

        apply_form_values(
            create_settings_form_values($branding_store, $theme_store),
        );

        const use_cases = get_use_cases_container();
        const organizations_result =
            await use_cases.organization_use_cases.list({});
        if (
            organizations_result.success &&
            organizations_result.data?.items?.length
        ) {
            organizations = organizations_result.data.items;
            selected_organization_id = get_default_selected_organization_id(
                organizations,
                auth_result.profile?.organization_id,
            );
            if (selected_organization_id) {
                await handle_org_switch(selected_organization_id);
            }
        }

        is_loading = false;
    });

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

    async function handle_org_switch(org_id: string): Promise<boolean> {
        selected_organization_id = org_id;
        const selected_organization = organizations.find(
            (organization) => organization.id === org_id,
        );
        organization_name = selected_organization?.name ?? "";
        if (!org_id) {
            return true;
        }

        const use_cases = get_use_cases_container();
        const organization_settings_result =
            await use_cases.organization_settings_use_cases.get_by_organization_id(
                org_id,
            );

        apply_form_values(
            apply_organization_settings_form_values(
                get_current_form_values(),
                selected_organization,
                organization_settings_result.success
                    ? organization_settings_result.data
                    : null,
            ),
        );
        return true;
    }

    async function handle_save_organization_settings(): Promise<void> {
        await branding_store.set({
            organization_name,
            organization_logo_url,
            organization_tagline,
            organization_email,
            organization_address,
            social_media_links,
            header_footer_style: "pattern",
            header_pattern,
            footer_pattern,
            background_pattern_url,
            show_panel_borders,
        });
        show_toast("Organization settings saved", "success");
    }

    function handle_selected_organization_switch(): Promise<boolean> {
        return handle_org_switch(selected_organization_id);
    }

    function handle_logo_change(event: CustomEvent<{ url: string }>): void {
        organization_logo_url = event.detail.url;
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

{#if is_loading}
    <div class="flex justify-center items-center py-12">
        <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
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
        caller_role={current_profile?.role ?? ""}
        default_logo_svg={DEFAULT_LOGO_SVG}
        {show_toast}
        on_organization_switch={handle_selected_organization_switch}
        on_logo_change={handle_logo_change}
        on_save_organization_settings={handle_save_organization_settings}
    />
{/if}

<Toast
    message={toast_message}
    type={toast_type}
    is_visible={toast_visible}
    on:dismiss={() => (toast_visible = false)}
/>
