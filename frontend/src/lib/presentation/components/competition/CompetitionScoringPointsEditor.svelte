<script lang="ts">
    type PointsField = "points_for_win" | "points_for_draw" | "points_for_loss";

    type PointsConfig = Record<PointsField, number>;

    type PointsOption = {
        id: string;
        field: PointsField;
        label: string;
    };

    export let is_customizing_scoring: boolean;
    export let effective_points: PointsConfig;
    export let format_default_points: PointsConfig;
    export let on_update_points: (
        field: PointsField,
        raw_value: string,
    ) => void;
    export let on_enable_customization: () => void;

    const point_options: PointsOption[] = [
        { id: "pts_win", field: "points_for_win", label: "Win" },
        { id: "pts_draw", field: "points_for_draw", label: "Draw" },
        { id: "pts_loss", field: "points_for_loss", label: "Loss" },
    ];
</script>

<div class="border-b border-accent-200 dark:border-accent-700 pb-5">
    <div class="text-sm font-medium text-accent-900 dark:text-accent-100 mb-2">
        Points Per Result
    </div>
    <div
        class="flex flex-wrap items-center gap-4 mb-3 p-3 bg-accent-50 dark:bg-accent-800 rounded-md"
    >
        <div class="flex items-center gap-2">
            <span class="text-sm text-accent-500 dark:text-accent-400"
                >Current:</span
            >
            <span
                class="text-sm font-semibold text-accent-900 dark:text-accent-100"
            >
                Win {effective_points.points_for_win} / Draw {effective_points.points_for_draw}
                / Loss {effective_points.points_for_loss}
            </span>
        </div>
        <div class="text-accent-300 dark:text-accent-600">|</div>
        <div class="flex items-center gap-2">
            <span class="text-sm text-accent-500 dark:text-accent-400">
                Format default:
            </span>
            <span class="text-sm text-accent-600 dark:text-accent-400">
                Win {format_default_points.points_for_win} / Draw {format_default_points.points_for_draw}
                / Loss {format_default_points.points_for_loss}
            </span>
        </div>
    </div>

    {#if !is_customizing_scoring}
        <button
            type="button"
            on:click={on_enable_customization}
            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >Customize</button
        >
    {:else}
        <div class="mt-3 grid grid-cols-3 gap-4">
            {#each point_options as option}
                <div>
                    <label
                        class="block text-sm font-medium text-accent-900 dark:text-accent-100 mb-1"
                        for={option.id}>{option.label}</label
                    >
                    <input
                        id={option.id}
                        type="number"
                        value={effective_points[option.field]}
                        on:change={(event) =>
                            on_update_points(
                                option.field,
                                event.currentTarget.value,
                            )}
                        min={0}
                        max={99}
                        class="block w-full px-3 py-2 border border-accent-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-accent-800 dark:border-accent-600 dark:text-white"
                    />
                </div>
            {/each}
        </div>
    {/if}
</div>
