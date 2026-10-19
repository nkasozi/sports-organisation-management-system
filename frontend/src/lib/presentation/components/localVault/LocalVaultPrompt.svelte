<script lang="ts">
    import { LOCAL_VAULT_MODE } from "$lib/infrastructure/localVault/localVaultContracts";
    import {
        local_vault_prompt_handlers,
        local_vault_prompt_store,
    } from "$lib/presentation/logic/localVaultPromptRuntime";
    import {
        LOCAL_VAULT_PROMPT_KIND,
        LOCAL_VAULT_STORAGE_RETRY_METHOD,
    } from "$lib/presentation/logic/localVaultPromptState";

    import LocalVaultPromptFrame from "./LocalVaultPromptFrame.svelte";
    import { LOCAL_VAULT_PRIMARY_BUTTON_CLASS } from "./localVaultPromptStyles";
    import LocalVaultProtectPanel from "./LocalVaultProtectPanel.svelte";
    import LocalVaultUnlockPanel from "./LocalVaultUnlockPanel.svelte";

    const UNLOCK_MESSAGES = {
        [LOCAL_VAULT_MODE.PASSKEY]:
            "Your data on this device is locked. Use your fingerprint to open it.",
        [LOCAL_VAULT_MODE.PIN]:
            "Your data on this device is locked. Enter your PIN to open it.",
        [LOCAL_VAULT_STORAGE_RETRY_METHOD]:
            "Your data on this device is safe, but its lock could not be read just now.",
    } as const;

    const PROTECT_MESSAGES = {
        [LOCAL_VAULT_MODE.PASSKEY]:
            "Your account data will be stored on this device. Set up fingerprint unlock so only you can open it.",
        [LOCAL_VAULT_MODE.PIN]:
            "Your account data will be stored on this device. Choose a PIN so only you can open it.",
    } as const;

    const handlers = local_vault_prompt_handlers;
</script>

{#if $local_vault_prompt_store.kind === LOCAL_VAULT_PROMPT_KIND.UNLOCK}
    <LocalVaultPromptFrame
        eyebrow="Locked"
        title="Unlock Sport-Sync"
        message={UNLOCK_MESSAGES[$local_vault_prompt_store.method]}
    >
        <LocalVaultUnlockPanel
            method={$local_vault_prompt_store.method}
            phase={$local_vault_prompt_store.phase}
            {handlers}
        />
    </LocalVaultPromptFrame>
{:else if $local_vault_prompt_store.kind === LOCAL_VAULT_PROMPT_KIND.PROTECT}
    <LocalVaultPromptFrame
        eyebrow="One more step"
        title="Protect your data on this device"
        message={PROTECT_MESSAGES[$local_vault_prompt_store.method]}
    >
        <LocalVaultProtectPanel
            method={$local_vault_prompt_store.method}
            phase={$local_vault_prompt_store.phase}
            {handlers}
        />
    </LocalVaultPromptFrame>
{:else if $local_vault_prompt_store.kind === LOCAL_VAULT_PROMPT_KIND.UNAVAILABLE}
    <LocalVaultPromptFrame
        eyebrow="Something went wrong"
        title="Your data could not be opened"
        message={$local_vault_prompt_store.message}
    >
        <button
            type="button"
            class={LOCAL_VAULT_PRIMARY_BUTTON_CLASS}
            on:click={handlers.reload_page}
        >
            Reload
        </button>
    </LocalVaultPromptFrame>
{/if}
