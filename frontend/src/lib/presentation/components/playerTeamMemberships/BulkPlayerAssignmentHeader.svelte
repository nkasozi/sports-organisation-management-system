<script lang="ts">
    export let on_back: () => void;
</script>

<div class="flex items-center gap-4">
    <button
        type="button"
        class="p-2 rounded-lg text-accent-500 hover:bg-accent-100 dark:hover:bg-accent-700"
        on:click={on_back}
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
            Bulk Assign Players to Team
        </h1>
        <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
            Select players and assign them to a team in one action
        </p>
    </div>
</div>
