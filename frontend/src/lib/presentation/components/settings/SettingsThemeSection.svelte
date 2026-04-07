<script lang="ts">
    import SettingsSectionCard from "$lib/presentation/components/settings/SettingsSectionCard.svelte";
    import SettingsThemeColorPicker from "$lib/presentation/components/settings/SettingsThemeColorPicker.svelte";
    import SettingsThemePatternSettings from "$lib/presentation/components/settings/SettingsThemePatternSettings.svelte";
    import type { SettingsColorOption } from "$lib/presentation/logic/settingsPageState";
    import type { HeaderFooterStyle } from "$lib/presentation/stores/branding";
    import {
        reset_theme_to_default,
        theme_store,
        toggle_theme_mode,
        update_theme_colors,
    } from "$lib/presentation/stores/theme";

    export let selected_primary_color: string;
    export let selected_secondary_color: string;
    export let header_pattern: HeaderFooterStyle;
    export let footer_pattern: HeaderFooterStyle;
    export let background_pattern_url: string;
    export let show_panel_borders: boolean;
    export let color_options: ReadonlyArray<SettingsColorOption>;
    export let show_toast: (
        message: string,
        type: "success" | "error" | "info",
    ) => void;

    function handle_theme_toggle(): void {
        toggle_theme_mode();
        show_toast(`Switched to ${$theme_store.mode} mode`, "success");
    }

    function handle_primary_color_change(color: string): void {
        selected_primary_color = color;
        update_theme_colors({ primaryColor: color });
        show_toast("Primary color updated", "success");
    }

    function handle_secondary_color_change(color: string): void {
        selected_secondary_color = color;
        update_theme_colors({ secondaryColor: color });
        show_toast("Secondary color updated", "success");
    }

    function handle_reset_theme(): void {
        reset_theme_to_default();
        selected_primary_color = "red";
        selected_secondary_color = "blue";
        show_toast("Theme reset to defaults", "success");
    }
</script>

<SettingsSectionCard
    title="Theme & Appearance"
    description="Personalize the look and feel of your dashboard"
    content_class_name="space-y-8"
>
    <div class="flex items-center justify-between">
        <div>
            <h3
                class="text-sm font-medium text-accent-900 dark:text-accent-100"
            >
                Dark Mode
            </h3>
            <p class="text-sm text-accent-500 dark:text-accent-400">
                Switch between light and dark themes
            </p>
        </div>

        <button
            type="button"
            role="switch"
            aria-checked={$theme_store.mode === "dark"}
            class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                $theme_store.mode === "dark"
                    ? "bg-primary-600"
                    : "bg-accent-200"
            }`}
            on:click={handle_theme_toggle}
        >
            <span
                class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    $theme_store.mode === "dark"
                        ? "translate-x-5"
                        : "translate-x-0"
                }`}
            >
                <span class="flex h-full w-full items-center justify-center">
                    {#if $theme_store.mode === "dark"}
                        <svg
                            class="h-3 w-3 text-primary-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            ><path
                                d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                            /></svg
                        >
                    {:else}
                        <svg
                            class="h-3 w-3 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            ><path
                                fill-rule="evenodd"
                                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                                clip-rule="evenodd"
                            /></svg
                        >
                    {/if}
                </span>
            </span>
        </button>
    </div>

    <SettingsThemeColorPicker
        title="Primary Color"
        selected_color={selected_primary_color}
        {color_options}
        on_select={handle_primary_color_change}
    />

    <SettingsThemeColorPicker
        title="Secondary Color"
        selected_color={selected_secondary_color}
        {color_options}
        on_select={handle_secondary_color_change}
    />

    <SettingsThemePatternSettings
        bind:header_pattern
        bind:footer_pattern
        bind:background_pattern_url
        bind:show_panel_borders
        {show_toast}
    />

    <div class="pt-4 border-t border-accent-200 dark:border-accent-700">
        <button
            type="button"
            class="btn btn-outline text-sm"
            on:click={handle_reset_theme}
        >
            Reset to Defaults
        </button>
    </div>
</SettingsSectionCard>
