<script lang="ts">
    export let total_playing_time: number;
    export let total_break_time: number;
    export let total_time: number;
</script>

<div
    class="flex flex-wrap items-center gap-4 p-3 bg-accent-50 dark:bg-accent-800 rounded-lg"
>
    <div class="flex items-center gap-2">
        <span class="text-sm text-accent-500 dark:text-accent-400"
            >Playing Time:</span
        >
        <span class="font-semibold text-accent-900 dark:text-accent-100">
            {total_playing_time} min
        </span>
    </div>
    <div class="text-accent-300 dark:text-accent-600">|</div>
    <div class="flex items-center gap-2">
        <span class="text-sm text-accent-500 dark:text-accent-400"
            >Break Time:</span
        >
        <span class="text-sm text-accent-600 dark:text-accent-400">
            {total_break_time} min
        </span>
    </div>
    <div class="text-accent-300 dark:text-accent-600">|</div>
    <div class="flex items-center gap-2">
        <span class="text-sm text-accent-500 dark:text-accent-400">Total:</span>
        <span class="font-semibold text-accent-900 dark:text-accent-100">
            {total_time} min
        </span>
    </div>
</div>
