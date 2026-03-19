<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let value: number = 0;
    export let max: number = 10;
    export let field_id: string = "";
    export let disabled: boolean = false;

    const dispatch = createEventDispatcher<{ change: number }>();

    let hovered_star: number = 0;

    $: highlighted_up_to = hovered_star > 0 ? hovered_star : value;

    function select_rating(star_value: number): boolean {
        if (disabled) return false;
        return dispatch("change", star_value);
    }

    function on_star_mouseenter(star_value: number): number {
        hovered_star = disabled ? 0 : star_value;
        return hovered_star;
    }

    function on_stars_mouseleave(): number {
        hovered_star = 0;
        return hovered_star;
    }
</script>

<div
    class="flex items-center gap-1"
    role="radiogroup"
    tabindex="-1"
    aria-label={field_id}
    on:mouseleave={on_stars_mouseleave}
>
    {#each Array(max) as _, i}
        {@const star_value = i + 1}
        {@const is_filled = star_value <= highlighted_up_to}
        <button
            type="button"
            role="radio"
            aria-checked={star_value === value}
            aria-label="Rate {star_value} out of {max}"
            {disabled}
            on:click={() => select_rating(star_value)}
            on:mouseenter={() => on_star_mouseenter(star_value)}
            class="text-2xl leading-none transition-colors focus:outline-none {disabled
                ? 'cursor-default'
                : 'cursor-pointer'} {is_filled
                ? 'text-amber-400'
                : 'text-gray-300'}">★</button
        >
    {/each}
    <span class="ml-2 text-xs font-medium text-gray-500">{value}/{max}</span>
</div>
