<script lang="ts">
    export let title: string;
    export let description: string;
    export let enabled: boolean;
    export let aria_label: string;
</script>

<div class="flex items-center justify-between">
    <div>
        <h3 class="text-sm font-medium text-accent-900 dark:text-accent-100">
            {title}
        </h3>
        <p class="text-sm text-accent-500 dark:text-accent-400">
            {description}
        </p>
    </div>

    <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={aria_label}
        class={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            enabled ? "bg-primary-600" : "bg-accent-200"
        }`}
        on:click={() => (enabled = !enabled)}
    >
        <span
            class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? "translate-x-5" : "translate-x-0"
            }`}
        ></span>
    </button>
</div>
