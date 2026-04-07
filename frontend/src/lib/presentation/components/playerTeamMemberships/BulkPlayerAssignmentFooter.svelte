<script lang="ts">
    export let can_save: boolean;
    export let is_saving: boolean;
    export let selected_count: number;
    export let on_cancel: () => void;
    export let on_save: () => void;
</script>

<div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
    <button
        type="button"
        class="btn btn-outline"
        on:click={on_cancel}
        disabled={is_saving}>Cancel</button
    >
    <button
        type="button"
        class="btn btn-primary-action"
        on:click={on_save}
        disabled={!can_save || is_saving}
    >
        {#if is_saving}
            <span class="flex items-center justify-center">
                <span
                    class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"
                ></span>
                Saving...
            </span>
        {:else}
            Assign {selected_count} Player(s) to Team
        {/if}
    </button>
</div>
