<script lang="ts">
    export let reason: string;
    export let reason_error: string;
    export let edit_cost_text: string;
</script>

<div>
    <label
        for="correction_reason"
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >Reason for the change <span class="text-red-500">*</span></label
    >
    <textarea
        id="correction_reason"
        rows="2"
        bind:value={reason}
        on:input={() => (reason_error = "")}
        placeholder="Umpire changed the decision, wrong scorer recorded…"
        class={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${reason_error ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
    ></textarea>
    {#if reason_error}
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">
            {reason_error}
        </p>
    {/if}
    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Viewers will see this change and your reason in the match log.
        {edit_cost_text}
    </p>
</div>
