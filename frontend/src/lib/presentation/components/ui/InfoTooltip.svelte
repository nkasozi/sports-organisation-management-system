<script lang="ts">
    import {
        TOOLTIP_POSITION,
        TOOLTIP_POSITION_CLASSES,
        type TooltipPosition,
    } from "./infoTooltipPosition";

    export let tooltip_text: string;
    export let position: TooltipPosition = TOOLTIP_POSITION.TOP;

    let is_visible: boolean = false;

    $: position_classes = TOOLTIP_POSITION_CLASSES[position];
</script>

<span
    class="relative inline-flex items-center"
    on:mouseenter={() => (is_visible = true)}
    on:mouseleave={() => (is_visible = false)}
    on:focus={() => (is_visible = true)}
    on:blur={() => (is_visible = false)}
    role="button"
    tabindex="0"
>
    <svg
        class="w-4 h-4 text-accent-400 hover:text-accent-600 dark:text-accent-500 dark:hover:text-accent-300 cursor-help"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    </svg>

    {#if is_visible}
        <div
            class="absolute z-50 {position_classes.panel} w-64 p-2 text-xs text-white bg-accent-800 dark:bg-accent-900 rounded-lg shadow-lg pointer-events-none"
        >
            {tooltip_text}
            <div
                class="absolute w-2 h-2 bg-accent-800 dark:bg-accent-900 transform rotate-45 {position_classes.arrow}"
            ></div>
        </div>
    {/if}
</span>
