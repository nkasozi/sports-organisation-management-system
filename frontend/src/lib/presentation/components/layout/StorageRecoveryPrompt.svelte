<script lang="ts">
    import { onMount } from "svelte";

    import {
        get_startup_storage_recovery_prompt_message,
        get_startup_storage_recovery_prompt_title,
        STARTUP_STORAGE_RECOVERY_PROMPT_MODE,
        type VisibleStartupStorageRecoveryPromptState,
    } from "$lib/presentation/logic/layoutStorageRecovery";

    export let prompt_state: VisibleStartupStorageRecoveryPromptState;
    export let on_restore: () => void;
    export let on_continue: () => void;

    const SOURCE_LABEL_SEPARATOR = "_";
    const SOURCE_LABEL_SPACE = " ";
    const TAB_KEY = "Tab";
    const CONTINUE_FRESH_LABEL = "Continue Fresh";
    const CONTINUE_LABEL = "Continue";
    const TITLE_ELEMENT_ID = "storage-recovery-prompt-title";
    const MESSAGE_ELEMENT_ID = "storage-recovery-prompt-message";

    let dialog_element: HTMLDivElement;

    $: is_restore_available =
        prompt_state.mode === STARTUP_STORAGE_RECOVERY_PROMPT_MODE.AVAILABLE;
    $: prompt_title = get_startup_storage_recovery_prompt_title(
        prompt_state.mode,
    );
    $: prompt_message =
        get_startup_storage_recovery_prompt_message(prompt_state);
    $: backup_label = new Date(
        prompt_state.summary.created_at,
    ).toLocaleString();
    $: source_label = prompt_state.summary.source.replace(
        SOURCE_LABEL_SEPARATOR,
        SOURCE_LABEL_SPACE,
    );

    function list_dialog_buttons(): HTMLButtonElement[] {
        return Array.from(dialog_element.querySelectorAll("button"));
    }

    onMount(() => {
        list_dialog_buttons().at(-1)?.focus();
    });

    function trap_focus(event: KeyboardEvent): boolean {
        if (event.key !== TAB_KEY) return false;
        const dialog_buttons = list_dialog_buttons();
        const focused_index = dialog_buttons.indexOf(
            document.activeElement as HTMLButtonElement,
        );
        const step = event.shiftKey ? -1 : 1;
        const next_index =
            (focused_index + step + dialog_buttons.length) %
            dialog_buttons.length;
        event.preventDefault();
        dialog_buttons[next_index]?.focus();
        return true;
    }
</script>

<div
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-accent-950 px-4"
>
    <div
        bind:this={dialog_element}
        class="w-full max-w-lg rounded-2xl border border-accent-700 bg-accent-900 p-6 text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ELEMENT_ID}
        aria-describedby={MESSAGE_ELEMENT_ID}
        tabindex="-1"
        on:keydown={trap_focus}
    >
        <div class="space-y-3">
            <p
                class="text-xs font-semibold uppercase tracking-[0.24em] text-theme-primary-400"
            >
                Startup Recovery
            </p>
            <h2 id={TITLE_ELEMENT_ID} class="text-2xl font-semibold">
                {prompt_title}
            </h2>
            <p
                id={MESSAGE_ELEMENT_ID}
                class="text-sm leading-6 text-accent-300"
            >
                {prompt_message}
            </p>
        </div>

        <div
            class="mt-6 grid gap-3 rounded-xl border border-accent-700 bg-accent-800 p-4 text-sm text-accent-200 sm:grid-cols-2"
        >
            <div>
                <p class="text-xs uppercase tracking-[0.2em] text-accent-400">
                    Backup Time
                </p>
                <p class="mt-1 font-medium text-white">{backup_label}</p>
            </div>
            <div>
                <p class="text-xs uppercase tracking-[0.2em] text-accent-400">
                    Backup Source
                </p>
                <p class="mt-1 font-medium capitalize text-white">
                    {source_label}
                </p>
            </div>
            <div>
                <p class="text-xs uppercase tracking-[0.2em] text-accent-400">
                    Records
                </p>
                <p class="mt-1 font-medium text-white">
                    {prompt_state.summary.total_records}
                </p>
            </div>
            <div>
                <p class="text-xs uppercase tracking-[0.2em] text-accent-400">
                    Tables With Data
                </p>
                <p class="mt-1 font-medium text-white">
                    {prompt_state.summary.tables_with_records}
                </p>
            </div>
        </div>

        <div
            class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
        >
            <button
                type="button"
                class="rounded-xl border border-accent-600 px-4 py-3 text-sm font-medium text-accent-200 transition hover:border-accent-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 sm:py-2"
                on:click={on_continue}
            >
                {is_restore_available ? CONTINUE_FRESH_LABEL : CONTINUE_LABEL}
            </button>
            {#if is_restore_available}
                <button
                    type="button"
                    class="rounded-xl bg-theme-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-theme-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary-300 sm:py-2"
                    on:click={on_restore}
                >
                    Restore Backup
                </button>
            {/if}
        </div>
    </div>
</div>
