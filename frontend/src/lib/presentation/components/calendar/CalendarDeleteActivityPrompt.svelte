<script lang="ts">
    import type { ActionReturn } from "svelte/action";

    import {
        CALENDAR_DELETE_ACTIVITY_PROMPT_KEY_COMMAND,
        type CalendarDeleteActivityPromptState,
        create_hidden_calendar_delete_activity_prompt_state,
        is_calendar_delete_activity_prompt_busy,
        is_calendar_delete_activity_prompt_visible,
        resolve_calendar_delete_activity_prompt_key_command,
    } from "$lib/presentation/logic/calendarDeleteActivityPrompt";

    export let prompt_state: CalendarDeleteActivityPromptState =
        create_hidden_calendar_delete_activity_prompt_state();
    export let on_cancel: () => void;
    export let on_confirm: () => void;

    const TITLE_ELEMENT_ID = "calendar-delete-activity-prompt-title";
    const MESSAGE_ELEMENT_ID = "calendar-delete-activity-prompt-message";
    const PROMPT_TEXT = {
        title: "Delete this activity?",
        message:
            "This removes the activity from the calendar for everyone in the organization. This cannot be undone.",
        cancel: "Keep Activity",
        confirm: "Delete Activity",
        deleting: "Deleting...",
    } as const;

    let cancel_button: HTMLButtonElement;
    let confirm_button: HTMLButtonElement;

    $: is_visible = is_calendar_delete_activity_prompt_visible(prompt_state);
    $: is_busy = is_calendar_delete_activity_prompt_busy(prompt_state);

    function focus_on_mount(element: HTMLElement): ActionReturn {
        element.focus();
        return {};
    }

    function trap_focus(event: KeyboardEvent): void {
        const focus_target =
            document.activeElement === cancel_button
                ? confirm_button
                : cancel_button;
        event.preventDefault();
        focus_target.focus();
    }

    function cancel_when_idle(): void {
        if (is_busy) return;
        on_cancel();
    }

    function handle_backdrop_click(event: MouseEvent): void {
        if (event.target !== event.currentTarget) return;
        cancel_when_idle();
    }

    function handle_window_key_down(event: KeyboardEvent): void {
        if (!is_visible) return;
        switch (
            resolve_calendar_delete_activity_prompt_key_command(event.key)
        ) {
            case CALENDAR_DELETE_ACTIVITY_PROMPT_KEY_COMMAND.CANCEL:
                event.preventDefault();
                cancel_when_idle();
                return;
            case CALENDAR_DELETE_ACTIVITY_PROMPT_KEY_COMMAND.TRAP_FOCUS:
                trap_focus(event);
                return;
            case CALENDAR_DELETE_ACTIVITY_PROMPT_KEY_COMMAND.NONE:
                return;
        }
    }
</script>

<svelte:window on:keydown={handle_window_key_down} />

{#if is_visible}
    <div
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 px-4 pb-4 sm:items-center sm:pb-0"
        role="presentation"
        on:click={handle_backdrop_click}
    >
        <div
            class="w-full max-w-md rounded-lg border border-accent-200 bg-white p-6 shadow-xl dark:border-accent-700 dark:bg-gray-800"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={TITLE_ELEMENT_ID}
            aria-describedby={MESSAGE_ELEMENT_ID}
            aria-busy={is_busy}
            tabindex="-1"
        >
            <h2
                id={TITLE_ELEMENT_ID}
                class="text-lg font-semibold text-accent-900 dark:text-accent-100"
            >
                {PROMPT_TEXT.title}
            </h2>
            <p
                id={MESSAGE_ELEMENT_ID}
                class="mt-2 text-sm leading-6 text-accent-600 dark:text-accent-300"
            >
                {PROMPT_TEXT.message}
            </p>
            <div
                class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
            >
                <button
                    bind:this={cancel_button}
                    use:focus_on_mount
                    type="button"
                    disabled={is_busy}
                    class="rounded-[0.175rem] bg-gray-100 px-4 py-3 text-sm font-medium text-accent-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-accent-200 dark:hover:bg-gray-600 sm:py-2"
                    on:click={cancel_when_idle}
                >
                    {PROMPT_TEXT.cancel}
                </button>
                <button
                    bind:this={confirm_button}
                    type="button"
                    disabled={is_busy}
                    class="rounded-[0.175rem] bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:bg-red-700 sm:py-2"
                    on:click={on_confirm}
                >
                    {is_busy ? PROMPT_TEXT.deleting : PROMPT_TEXT.confirm}
                </button>
            </div>
        </div>
    </div>
{/if}
