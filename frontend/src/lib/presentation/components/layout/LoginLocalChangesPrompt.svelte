<script lang="ts">
    import { onMount } from "svelte";

    import {
        type AwaitingLoginLocalChangePromptState,
        build_login_local_change_prompt_message,
        LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND,
        resolve_login_local_change_prompt_key_command,
    } from "$lib/presentation/logic/layoutLoginLocalChangePrompt";

    export let prompt_state: AwaitingLoginLocalChangePromptState;
    export let on_discard: () => void;
    export let on_keep: () => void;

    const TITLE_ELEMENT_ID = "login-local-changes-prompt-title";
    const MESSAGE_ELEMENT_ID = "login-local-changes-prompt-message";

    let keep_button: HTMLButtonElement;
    let discard_button: HTMLButtonElement;

    $: prompt_message = build_login_local_change_prompt_message(
        prompt_state.unsynced_count,
    );

    onMount(() => {
        keep_button.focus();
    });

    function trap_focus(event: KeyboardEvent): void {
        const focus_target =
            document.activeElement === keep_button
                ? discard_button
                : keep_button;
        event.preventDefault();
        focus_target.focus();
    }

    function handle_key_down(event: KeyboardEvent): void {
        switch (resolve_login_local_change_prompt_key_command(event.key)) {
            case LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND.KEEP_LOCAL_CHANGES:
                event.preventDefault();
                on_keep();
                return;
            case LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND.TRAP_FOCUS:
                trap_focus(event);
                return;
            case LOGIN_LOCAL_CHANGE_PROMPT_KEY_COMMAND.NONE:
                return;
        }
    }
</script>

<div
    class="fixed inset-0 z-[10000] flex items-end justify-center bg-accent-950 px-4 pb-4 sm:items-center sm:pb-0"
>
    <div
        class="w-full max-w-lg rounded-2xl border border-accent-700 bg-accent-900 p-6 text-white"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={TITLE_ELEMENT_ID}
        aria-describedby={MESSAGE_ELEMENT_ID}
        tabindex="-1"
        on:keydown={handle_key_down}
    >
        <div class="space-y-3">
            <p
                class="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400"
            >
                Unsynced Changes
            </p>
            <h2 id={TITLE_ELEMENT_ID} class="text-2xl font-semibold">
                Keep or discard local changes?
            </h2>
            <p
                id={MESSAGE_ELEMENT_ID}
                class="text-sm leading-6 text-accent-300"
            >
                {prompt_message}
            </p>
        </div>

        <div
            class="mt-6 rounded-xl border border-accent-700 bg-accent-800 p-4 text-sm text-accent-200"
        >
            <p class="text-xs uppercase tracking-[0.2em] text-accent-400">
                Changes Not Yet Synced
            </p>
            <p class="mt-1 text-lg font-semibold text-white">
                {prompt_state.unsynced_count}
            </p>
            <p class="mt-2 text-xs leading-5 text-accent-400">
                Keeping them signs you out and leaves this device untouched.
            </p>
        </div>

        <div
            class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
        >
            <button
                bind:this={discard_button}
                type="button"
                class="rounded-xl border border-red-500 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:py-2"
                on:click={on_discard}
            >
                Discard Changes and Sign In
            </button>
            <button
                bind:this={keep_button}
                type="button"
                class="rounded-xl bg-theme-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-theme-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary-300 sm:py-2"
                on:click={on_keep}
            >
                Keep Changes and Sign Out
            </button>
        </div>
    </div>
</div>
