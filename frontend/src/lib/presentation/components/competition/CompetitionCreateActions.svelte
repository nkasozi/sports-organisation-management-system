<script lang="ts">
    export let is_saving: boolean;
    export let on_cancel: () => void;
    export let submit_label: string = "Create Competition";
</script>

<div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
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
