<script lang="ts">
    import type { SettingsColorOption } from "$lib/presentation/logic/settingsPageState";

    export let title: string;
    export let selected_color: string;
    export let color_options: ReadonlyArray<SettingsColorOption>;
    export let on_select: (color: string) => void;
</script>

<div>
    <h3 class="text-sm font-medium text-accent-900 dark:text-accent-100 mb-4">
        {title}
    </h3>
    <div class="grid grid-cols-5 sm:grid-cols-10 gap-3">
        {#each color_options as color}
            <button
                type="button"
                class={`w-10 h-10 rounded-full ${color.class_name} ring-2 ring-offset-2 transition-all ${
                    selected_color === color.value
                        ? "ring-accent-900 dark:ring-accent-100 scale-110"
                        : "ring-transparent hover:ring-accent-300 dark:hover:ring-accent-600"
                }`}
                title={color.label}
                aria-label={`Select ${color.label} as ${title.toLowerCase()}`}
                aria-pressed={selected_color === color.value}
                on:click={() => on_select(color.value)}
            ></button>
        {/each}
    </div>
</div>
