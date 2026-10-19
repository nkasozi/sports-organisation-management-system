<script lang="ts">
    import {
        LOCAL_VAULT_PROMPT_PHASE,
        type LocalVaultPromptPhase,
    } from "$lib/presentation/logic/localVaultPromptState";

    export let phase: LocalVaultPromptPhase;
</script>

{#if phase.status === LOCAL_VAULT_PROMPT_PHASE.FAILED}
    <p
        class="rounded-xl border border-red-500 bg-red-950 px-4 py-3 text-sm text-red-100"
        role="alert"
    >
        {phase.message}
    </p>
{/if}
