<script lang="ts">
    export let eyebrow: string;
    export let title: string;
    export let message: string;

    const TITLE_ELEMENT_ID = "local-vault-prompt-title";
    const MESSAGE_ELEMENT_ID = "local-vault-prompt-message";
</script>

<div
    class="fixed inset-0 z-[10002] flex items-center justify-center bg-accent-950 px-4"
>
    <div
        class="w-full max-w-md rounded-2xl border border-accent-700 bg-accent-900 p-6 text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ELEMENT_ID}
        aria-describedby={MESSAGE_ELEMENT_ID}
    >
        <div class="space-y-3">
            <p
                class="text-xs font-semibold uppercase tracking-[0.24em] text-theme-primary-400"
            >
                {eyebrow}
            </p>
            <h2 id={TITLE_ELEMENT_ID} class="text-2xl font-semibold">
                {title}
            </h2>
            <p
                id={MESSAGE_ELEMENT_ID}
                class="text-sm leading-6 text-accent-300"
            >
                {message}
            </p>
        </div>
        <div class="mt-6 space-y-4">
            <slot />
        </div>
    </div>
</div>
