<script lang="ts">
    import SettingsPatternSelector from "$lib/presentation/components/settings/SettingsPatternSelector.svelte";
    import {
        branding_store,
        type HeaderFooterStyle,
    } from "$lib/presentation/stores/branding";

    export let header_pattern: HeaderFooterStyle;
    export let footer_pattern: HeaderFooterStyle;
    export let background_pattern_url: string;
    export let show_panel_borders: boolean;
    export let show_toast: (
        message: string,
        type: "success" | "error" | "info",
    ) => void;

    async function handle_header_pattern_change(
        pattern: HeaderFooterStyle,
    ): Promise<void> {
        header_pattern = pattern;
        await branding_store.update((config) => ({
            ...config,
            header_pattern: pattern,
        }));
        show_toast(
            pattern === "pattern"
                ? "Header set to pattern"
                : "Header set to solid color",
            "success",
        );
    }

    async function handle_footer_pattern_change(
        pattern: HeaderFooterStyle,
    ): Promise<void> {
        footer_pattern = pattern;
        await branding_store.update((config) => ({
            ...config,
            footer_pattern: pattern,
        }));
        show_toast(
            pattern === "pattern"
                ? "Footer set to pattern"
                : "Footer set to solid color",
            "success",
        );
    }

    async function handle_panel_borders_toggle(
        enabled: boolean,
    ): Promise<void> {
        show_panel_borders = enabled;
        await branding_store.update((config) => ({
            ...config,
            show_panel_borders: enabled,
        }));
        show_toast(
            enabled ? "Panel borders enabled" : "Panel borders disabled",
            "success",
        );
    }

    function handle_pattern_upload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        if (!file.type.includes("svg")) {
            show_toast("Please upload an SVG file", "error");
            return;
        }
        if (file.size > 500 * 1024) {
            show_toast("File size must be less than 500KB", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = (load_event) => {
            const result = load_event.target?.result as string;
            background_pattern_url = result;
            void branding_store
                .update((config) => ({
                    ...config,
                    background_pattern_url: result,
                }))
                .then(() => show_toast("Custom pattern uploaded", "success"))
                .catch((error) => {
                    console.warn(
                        "[SettingsThemePatternSettings] Failed to save pattern",
                        {
                            event: "settings_pattern_save_failed",
                            error: String(error),
                        },
                    );
                    show_toast("Failed to save custom pattern", "error");
                });
        };
        reader.onerror = () => show_toast("Failed to read file", "error");
        reader.readAsDataURL(file);
    }

    async function handle_reset_pattern(): Promise<void> {
        background_pattern_url = "/african-mosaic-bg.svg";
        await branding_store.update((config) => ({
            ...config,
            background_pattern_url: "/african-mosaic-bg.svg",
        }));
        show_toast("Reset to default pattern", "success");
    }
</script>

<div>
    <h3 class="text-sm font-medium text-accent-900 dark:text-accent-100 mb-4">
        Header & Footer Style
    </h3>
    <p class="text-xs text-accent-500 dark:text-accent-400 mb-4">
        Choose between a decorative pattern or solid color for header and footer
        independently
    </p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
        <SettingsPatternSelector
            label="Header"
            bind:selected_pattern={header_pattern}
            on_select={handle_header_pattern_change}
        />
        <SettingsPatternSelector
            label="Footer"
            bind:selected_pattern={footer_pattern}
            on_select={handle_footer_pattern_change}
        />
    </div>

    {#if header_pattern === "pattern" || footer_pattern === "pattern"}
        <div
            class="mt-4 p-4 rounded-lg bg-accent-50 dark:bg-accent-700/50 space-y-4"
        >
            <div class="flex items-center justify-between">
                <div>
                    <h4
                        class="text-sm font-medium text-accent-700 dark:text-accent-300"
                    >
                        Panel Borders
                    </h4>
                    <p class="text-xs text-accent-500 dark:text-accent-400">
                        Show white borders around header and footer panels when
                        pattern is active
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={show_panel_borders}
                    aria-label="Toggle panel borders"
                    class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-theme-primary-500 focus:ring-offset-2 ${
                        show_panel_borders
                            ? "bg-theme-primary-500"
                            : "bg-accent-300 dark:bg-accent-600"
                    }`}
                    on:click={() =>
                        void handle_panel_borders_toggle(!show_panel_borders)}
                >
                    <span
                        class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            show_panel_borders
                                ? "translate-x-5"
                                : "translate-x-0"
                        }`}
                    ></span>
                </button>
            </div>

            <div>
                <h4
                    class="text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
                >
                    Custom Pattern
                </h4>
                <p class="text-xs text-accent-500 dark:text-accent-400 mb-3">
                    Upload your own SVG pattern or use the default African
                    mosaic
                </p>
                <div class="flex flex-col sm:flex-row gap-4 items-start">
                    <div
                        class="w-20 h-20 rounded-lg overflow-hidden border-2 border-dashed border-accent-300 dark:border-accent-600 relative flex-shrink-0"
                    >
                        <div
                            class="absolute inset-0"
                            style={`background-image: url('${background_pattern_url}'); background-size: 40px; background-repeat: repeat;`}
                        ></div>
                    </div>

                    <div class="flex-1 space-y-2">
                        <div class="flex flex-wrap gap-2">
                            <label
                                class="btn btn-outline text-xs cursor-pointer"
                            >
                                <input
                                    type="file"
                                    accept=".svg,image/svg+xml"
                                    class="hidden"
                                    on:change={handle_pattern_upload}
                                />
                                Upload SVG
                            </label>
                            <button
                                type="button"
                                class="btn btn-outline text-xs"
                                on:click={() => void handle_reset_pattern()}
                            >
                                Use Default
                            </button>
                        </div>
                        <p class="text-xs text-accent-400 dark:text-accent-500">
                            Max size: 500KB
                        </p>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
