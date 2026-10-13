<script lang="ts">
    import {
        THEME_MODE,
        THEME_TOGGLE_LABEL,
    } from "$lib/presentation/components/theme/themeConstants";
    import {
        theme_store,
        toggle_theme_mode,
    } from "$lib/presentation/stores/theme";

    $: current_theme = $theme_store;
    $: toggle_label =
        current_theme.mode === THEME_MODE.LIGHT
            ? THEME_TOGGLE_LABEL.SWITCH_TO_DARK
            : THEME_TOGGLE_LABEL.SWITCH_TO_LIGHT;

    function handle_toggle(): void {
        toggle_theme_mode();
    }
</script>

<button
    type="button"
    class="p-2 rounded-[0.175rem] text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-all duration-200"
    on:click={handle_toggle}
    aria-label={toggle_label}
    title={toggle_label}
>
    {#if current_theme.mode === THEME_MODE.LIGHT}
        <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
        </svg>
    {:else}
        <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
        </svg>
    {/if}
</button>

<style>
    button {
        transform-origin: center;
        transition: transform 0.2s ease-in-out;
    }

    button:hover {
        transform: scale(1.05);
    }

    button:active {
        transform: scale(0.95);
    }

    /* Smooth icon transition */
    svg {
        transition: all 0.3s ease-in-out;
    }
</style>
