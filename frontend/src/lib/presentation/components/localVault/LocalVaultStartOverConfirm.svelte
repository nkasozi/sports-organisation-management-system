<script lang="ts">
    export let on_cancel: () => boolean;
    export let on_confirm: () => boolean;
</script>

<div
    class="space-y-4 rounded-xl border border-amber-500 bg-amber-950 p-4 text-amber-100"
    role="alert"
>
    <p class="text-sm font-semibold">Start over on this device?</p>
    <p class="text-sm leading-6">
        This removes the data on this device. Anything not yet synced will be
        lost. Your synced data comes back from the server after you sign in
        again.
    </p>
    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
            type="button"
            class="rounded-xl border border-amber-400 px-4 py-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:py-2"
            on:click={on_cancel}
        >
            Keep trying
        </button>
        <button
            type="button"
            class="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 sm:py-2"
            on:click={on_confirm}
        >
            Remove data and start over
        </button>
    </div>
</div>
