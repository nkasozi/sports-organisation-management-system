<script lang="ts">
    export let is_saving: boolean;
    export let on_cancel: () => void;
    export let submit_label: string = "Create Competition";
    export let show_fake_data_button: boolean = false;
    export let on_fill_fake_data: () => void = () => {};
</script>

<div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
    {#if show_fake_data_button}
        <button
            type="button"
            class="btn btn-ghost sm:mr-auto flex items-center justify-center gap-2"
            on:click={on_fill_fake_data}
            disabled={is_saving}
            title="Generate realistic fake data for testing"
        >
            <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                ></path>
            </svg>
            <span class="hidden sm:inline">Fill with Fake Data</span>
            <span class="sm:hidden">Fake Data</span>
        </button>
    {/if}
    <button
        type="button"
        class="btn btn-outline"
        on:click={on_cancel}
        disabled={is_saving}>Cancel</button
    >
    <button type="submit" class="btn btn-primary-action" disabled={is_saving}>
        {#if is_saving}
            <span class="flex items-center justify-center">
                <span
                    class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"
                ></span>
                Saving...
            </span>
        {:else}
            {submit_label}
        {/if}
    </button>
</div>
