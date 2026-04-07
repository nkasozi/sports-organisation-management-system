<script lang="ts">
    import type { HeaderFooterStyle } from "$lib/presentation/stores/branding";

    export let label: string;
    export let selected_pattern: HeaderFooterStyle;
    export let on_select: (pattern: HeaderFooterStyle) => Promise<void>;
</script>

<div>
    <div
        class="font-semibold mb-2 text-accent-800 dark:text-accent-200 text-sm"
    >
        {label}
    </div>
    <div class="flex gap-2">
        <button
            type="button"
            class={`relative flex-1 p-3 rounded-lg border-2 transition-all ${
                selected_pattern === "pattern"
                    ? "border-theme-primary-500 bg-theme-primary-50 dark:bg-theme-primary-900/20"
                    : "border-accent-200 dark:border-accent-700 hover:border-accent-300 dark:hover:border-accent-600"
            }`}
            on:click={() => void on_select("pattern")}
        >
            <div class="flex items-center gap-2">
                <div
                    class="w-8 h-8 rounded overflow-hidden border border-accent-200 dark:border-accent-600 relative flex-shrink-0"
                >
                    <div
                        class="absolute inset-0"
                        style="background-image: url('/african-mosaic-bg.svg'); background-size: 20px; background-repeat: repeat;"
                    ></div>
                    <div class="absolute inset-0 bg-theme-primary-500/40"></div>
                </div>
                <span class="text-xs font-medium">Pattern</span>
            </div>
            {#if selected_pattern === "pattern"}
                <div
                    class="absolute top-1 right-1 w-4 h-4 bg-theme-primary-500 rounded-full flex items-center justify-center"
                >
                    <svg
                        class="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M5 13l4 4L19 7"
                        /></svg
                    >
                </div>
            {/if}
        </button>

        <button
            type="button"
            class={`relative flex-1 p-3 rounded-lg border-2 transition-all ${
                selected_pattern === "solid_color"
                    ? "border-theme-primary-500 bg-theme-primary-50 dark:bg-theme-primary-900/20"
                    : "border-accent-200 dark:border-accent-700 hover:border-accent-300 dark:hover:border-accent-600"
            }`}
            on:click={() => void on_select("solid_color")}
        >
            <div class="flex items-center gap-2">
                <div
                    class="w-8 h-8 rounded bg-theme-primary-500 border border-accent-200 dark:border-accent-600 flex-shrink-0"
                ></div>
                <span class="text-xs font-medium">Solid</span>
            </div>
            {#if selected_pattern === "solid_color"}
                <div
                    class="absolute top-1 right-1 w-4 h-4 bg-theme-primary-500 rounded-full flex items-center justify-center"
                >
                    <svg
                        class="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M5 13l4 4L19 7"
                        /></svg
                    >
                </div>
            {/if}
        </button>
    </div>
</div>
