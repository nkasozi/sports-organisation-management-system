<script lang="ts">
    import type { SportPresetType } from "$lib/presentation/logic/sportFormEditorState";

    export let title: string;
    export let show_presets: boolean;
    export let on_cancel: () => void;
    export let on_apply_preset:
        | ((preset_type: SportPresetType) => void)
        | null = null;

    function apply_preset(preset_type: SportPresetType): void {
        if (!on_apply_preset) return;
        on_apply_preset(preset_type);
    }
</script>

<div class="space-y-4">
    <div class="flex items-center gap-4">
        <button
            type="button"
            class="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700"
            on:click={on_cancel}
            aria-label="Go back"
        >
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
            </svg>
        </button>
        <div class="flex-1">
            <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
                {title}
            </h1>
        </div>
        {#if show_presets}
            <div class="hidden sm:flex gap-2">
                <button
                    type="button"
                    class="btn btn-outline text-sm"
                    on:click={() => apply_preset("football")}
                    >Football Preset</button
                >
                <button
                    type="button"
                    class="btn btn-outline text-sm"
                    on:click={() => apply_preset("basketball")}
                    >Basketball Preset</button
                >
                <button
                    type="button"
                    class="btn btn-outline text-sm"
                    on:click={() => apply_preset("field_hockey")}
                    >Field Hockey Preset</button
                >
            </div>
        {/if}
    </div>

    {#if show_presets}
        <div class="sm:hidden flex gap-2 flex-wrap">
            <button
                type="button"
                class="flex-1 btn btn-outline text-sm"
                on:click={() => apply_preset("football")}>Football</button
            >
            <button
                type="button"
                class="flex-1 btn btn-outline text-sm"
                on:click={() => apply_preset("basketball")}>Basketball</button
            >
            <button
                type="button"
                class="flex-1 btn btn-outline text-sm"
                on:click={() => apply_preset("field_hockey")}>Hockey</button
            >
        </div>
    {/if}
</div>
