<script lang="ts">
    export let message = "";
</script>

{#if message}
    <div
        class="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg mb-4"
    >
        <p class="text-sm text-blue-800 dark:text-blue-200">{message}</p>
    </div>
{/if}
