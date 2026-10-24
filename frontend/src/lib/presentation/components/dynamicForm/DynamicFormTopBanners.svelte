<script lang="ts">
    import DynamicFormAlertCard from "./DynamicFormAlertCard.svelte";

    export let permission_denied: boolean = false;
    export let permission_denied_message: string = "";
    export let info_message: string = "";
</script>

<div class="space-y-4">
    {#if permission_denied}
        <DynamicFormAlertCard
            tone="violet"
            icon="lock"
            message={permission_denied_message}
        />
    {/if}

    {#if info_message}
        <DynamicFormAlertCard tone="blue" icon="info" message={info_message} />
    {/if}
</div>
