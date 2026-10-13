<script lang="ts">
    import { onMount } from "svelte";

    import {
        DARK_MODE_CLASS_NAME,
        THEME_MODE,
    } from "$lib/presentation/components/theme/themeConstants";
    import {
        theme_store,
        type ThemeConfig,
    } from "$lib/presentation/stores/theme";

    let mounted = false;

    function apply_theme_mode_class(theme_config: ThemeConfig): boolean {
        if (typeof document === typeof undefined) return false;
        document.documentElement.classList.toggle(
            DARK_MODE_CLASS_NAME,
            theme_config.mode === THEME_MODE.DARK,
        );
        return true;
    }

    onMount(() => {
        mounted = true;
        return theme_store.subscribe(apply_theme_mode_class);
    });
</script>

{#if mounted}
    <slot />
{:else}
    <div
        class="min-h-screen bg-gray-50 dark:bg-accent-900 flex items-center justify-center"
    >
        <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"
        ></div>
    </div>
{/if}
