<script lang="ts">
    import { onMount } from "svelte";

    import { get_app_settings_storage } from "$lib/infrastructure/container";
    import {
        load_stage_order_preference,
        save_stage_order_preference,
        type StageOrder,
        toggle_stage_order,
    } from "$lib/presentation/logic/competitionStageOrder";

    import { STAGE_ORDER_TOGGLE_TEXT } from "./competitionResultsDisplayConstants";

    export let stage_order: StageOrder;

    $: stage_order_text = STAGE_ORDER_TOGGLE_TEXT[stage_order];

    onMount(async (): Promise<boolean> => {
        const result = await load_stage_order_preference({
            storage: get_app_settings_storage(),
        });
        if (!result.success) return false;
        stage_order = result.data;
        return true;
    });

    async function flip_stage_order(): Promise<boolean> {
        stage_order = toggle_stage_order(stage_order);
        const result = await save_stage_order_preference({
            storage: get_app_settings_storage(),
            stage_order,
        });
        return result.success;
    }
</script>

<button
    type="button"
    class="flex items-center gap-2 px-3 h-8 text-sm font-medium text-accent-700 dark:text-accent-200 border border-accent-200 dark:border-accent-700 hover:bg-accent-100 dark:hover:bg-accent-700 rounded-[0.175rem] transition-colors"
    title={stage_order_text.title}
    aria-label={stage_order_text.title}
    on:click={() => void flip_stage_order()}
>
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
        /></svg
    >
    {stage_order_text.label}
</button>
