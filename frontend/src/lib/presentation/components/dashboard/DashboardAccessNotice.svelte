<script lang="ts">
    export let message: string;
    export let on_dismiss: () => void;
</script>

<div
    class="mb-6 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 p-4"
>
    <div class="flex items-start gap-3">
        <svg
            class="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
        </svg>
        <div class="flex-1">
            <h3 class="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Access Denied
            </h3>
            <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                {message}
            </p>
        </div>
        <button
            type="button"
            class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
            on:click={on_dismiss}
            aria-label="Dismiss"
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
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
        </button>
    </div>
</div>
