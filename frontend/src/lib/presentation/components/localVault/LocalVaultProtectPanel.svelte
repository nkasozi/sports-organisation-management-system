<script lang="ts">
    import { LOCAL_VAULT_MODE } from "$lib/infrastructure/localVault/localVaultContracts";
    import type { LocalVaultPromptHandlers } from "$lib/presentation/logic/localVaultPromptRuntime";
    import {
        LOCAL_VAULT_PROMPT_PHASE,
        type LocalVaultPromptMethod,
        type LocalVaultPromptPhase,
    } from "$lib/presentation/logic/localVaultPromptState";

    import LocalVaultPromptError from "./LocalVaultPromptError.svelte";
    import {
        LOCAL_VAULT_INPUT_CLASS,
        LOCAL_VAULT_LABEL_CLASS,
        LOCAL_VAULT_PRIMARY_BUTTON_CLASS,
        LOCAL_VAULT_SECONDARY_BUTTON_CLASS,
    } from "./localVaultPromptStyles";

    export let method: LocalVaultPromptMethod;
    export let phase: LocalVaultPromptPhase;
    export let handlers: LocalVaultPromptHandlers;

    const PIN_INPUT_ID = "local-vault-new-pin";
    const PIN_CONFIRMATION_INPUT_ID = "local-vault-new-pin-confirmation";

    let pin = "";
    let pin_confirmation = "";

    $: is_working = phase.status === LOCAL_VAULT_PROMPT_PHASE.WORKING;

    function set_up_fingerprint(): Promise<boolean> {
        return handlers.protect({ method: LOCAL_VAULT_MODE.PASSKEY });
    }

    function save_pin(): Promise<boolean> {
        const input = {
            method: LOCAL_VAULT_MODE.PIN,
            pin,
            pin_confirmation,
        };
        pin = "";
        pin_confirmation = "";
        return handlers.protect(input);
    }
</script>

<LocalVaultPromptError {phase} />
{#if method === LOCAL_VAULT_MODE.PASSKEY}
    <button
        type="button"
        class={LOCAL_VAULT_PRIMARY_BUTTON_CLASS}
        disabled={is_working}
        on:click={set_up_fingerprint}
    >
        {is_working
            ? "Waiting for your fingerprint..."
            : "Set up fingerprint unlock"}
    </button>
{:else}
    <form class="space-y-4" on:submit|preventDefault={save_pin}>
        <label class={LOCAL_VAULT_LABEL_CLASS} for={PIN_INPUT_ID}>
            Choose a PIN (at least 6 characters)
            <input
                id={PIN_INPUT_ID}
                class={LOCAL_VAULT_INPUT_CLASS}
                type="password"
                autocomplete="new-password"
                bind:value={pin}
                disabled={is_working}
            />
        </label>
        <label class={LOCAL_VAULT_LABEL_CLASS} for={PIN_CONFIRMATION_INPUT_ID}>
            Type the PIN again
            <input
                id={PIN_CONFIRMATION_INPUT_ID}
                class={LOCAL_VAULT_INPUT_CLASS}
                type="password"
                autocomplete="new-password"
                bind:value={pin_confirmation}
                disabled={is_working}
            />
        </label>
        <button
            type="submit"
            class={LOCAL_VAULT_PRIMARY_BUTTON_CLASS}
            disabled={is_working}
        >
            {is_working ? "Saving..." : "Save PIN"}
        </button>
    </form>
{/if}
<button
    type="button"
    class={LOCAL_VAULT_SECONDARY_BUTTON_CLASS}
    disabled={is_working}
    on:click={handlers.sign_out_instead}
>
    Sign out instead
</button>
