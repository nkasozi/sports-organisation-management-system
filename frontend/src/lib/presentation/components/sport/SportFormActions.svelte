<script lang="ts">
    export let is_saving: boolean;
    export let submit_label: string;
    export let saving_label: string;
    export let on_cancel: () => void;
</script>

<div
    class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-accent-200 dark:border-accent-700"
>
    <button type="button" class="btn btn-outline" on:click={on_cancel}
        >Cancel</button
    >
    <button type="submit" class="btn btn-primary-action" disabled={is_saving}>
        {#if is_saving}
            <svg
                class="animate-spin h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                />
                <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
            </svg>
            {saving_label}
        {:else}
            {submit_label}
        {/if}
    </button>
</div>
