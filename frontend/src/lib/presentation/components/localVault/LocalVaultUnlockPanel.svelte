<script lang="ts">
    import { LOCAL_VAULT_MODE } from "$lib/infrastructure/localVault/localVaultContracts";
    import type { LocalVaultPromptHandlers } from "$lib/presentation/logic/localVaultPromptRuntime";
    import {
        LOCAL_VAULT_PROMPT_PHASE,
        LOCAL_VAULT_STORAGE_RETRY_METHOD,
        type LocalVaultPromptPhase,
        type LocalVaultUnlockPromptMethod,
    } from "$lib/presentation/logic/localVaultPromptState";

    import LocalVaultPromptError from "./LocalVaultPromptError.svelte";
    import {
        LOCAL_VAULT_INPUT_CLASS,
        LOCAL_VAULT_LABEL_CLASS,
        LOCAL_VAULT_PRIMARY_BUTTON_CLASS,
        LOCAL_VAULT_SECONDARY_BUTTON_CLASS,
    } from "./localVaultPromptStyles";
    import LocalVaultStartOverConfirm from "./LocalVaultStartOverConfirm.svelte";

    export let method: LocalVaultUnlockPromptMethod;
    export let phase: LocalVaultPromptPhase;
    export let handlers: LocalVaultPromptHandlers;

    const PIN_INPUT_ID = "local-vault-unlock-pin";

    let pin = "";

    $: is_working = phase.status === LOCAL_VAULT_PROMPT_PHASE.WORKING;

    function unlock_with_fingerprint(): Promise<boolean> {
        return handlers.unlock({ method: LOCAL_VAULT_MODE.PASSKEY });
    }

    function unlock_with_pin(): Promise<boolean> {
        const entered_pin = pin;
        pin = "";
        return handlers.unlock({
            method: LOCAL_VAULT_MODE.PIN,
            pin: entered_pin,
        });
    }
</script>

{#if phase.status === LOCAL_VAULT_PROMPT_PHASE.CONFIRM_START_OVER}
    <LocalVaultStartOverConfirm
        on_cancel={handlers.cancel_start_over}
        on_confirm={handlers.confirm_start_over}
    />
{:else}
    <LocalVaultPromptError {phase} />
    {#if method === LOCAL_VAULT_MODE.PASSKEY}
        <button
            type="button"
            class={LOCAL_VAULT_PRIMARY_BUTTON_CLASS}
            disabled={is_working}
            on:click={unlock_with_fingerprint}
        >
            {is_working
                ? "Waiting for your fingerprint..."
                : "Unlock with fingerprint"}
        </button>
    {:else if method === LOCAL_VAULT_MODE.PIN}
        <form class="space-y-4" on:submit|preventDefault={unlock_with_pin}>
            <label class={LOCAL_VAULT_LABEL_CLASS} for={PIN_INPUT_ID}>
                PIN
                <input
                    id={PIN_INPUT_ID}
                    class={LOCAL_VAULT_INPUT_CLASS}
                    type="password"
                    autocomplete="current-password"
                    bind:value={pin}
                    disabled={is_working}
                />
            </label>
            <button
                type="submit"
                class={LOCAL_VAULT_PRIMARY_BUTTON_CLASS}
                disabled={is_working}
            >
                {is_working ? "Unlocking..." : "Unlock"}
            </button>
        </form>
    {:else if method === LOCAL_VAULT_STORAGE_RETRY_METHOD}
        <button
            type="button"
            class={LOCAL_VAULT_PRIMARY_BUTTON_CLASS}
            on:click={handlers.retry_storage}
        >
            Try again
        </button>
    {/if}
    <button
        type="button"
        class={LOCAL_VAULT_SECONDARY_BUTTON_CLASS}
        disabled={is_working}
        on:click={handlers.request_start_over}
    >
        Can't unlock? Start over
    </button>
{/if}
