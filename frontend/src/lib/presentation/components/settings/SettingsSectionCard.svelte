<script lang="ts">
    export let title: string;
    export let description: string;
    export let content_class_name: string = "space-y-6";
</script>

<div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
>
    <div class="p-6 border-b border-accent-200 dark:border-accent-700">
        <div class="flex items-center justify-between gap-4">
            <div>
                <h2
                    class="text-lg font-semibold text-accent-900 dark:text-accent-100"
                >
                    {title}
                </h2>
                <p class="text-sm text-accent-500 dark:text-accent-400 mt-1">
                    {description}
                </p>
            </div>
            {#if $$slots["header-actions"]}
                <div class="flex items-center gap-2">
                    <slot name="header-actions" />
                </div>
            {/if}
        </div>
    </div>

    <div class={`p-6 ${content_class_name}`}>
        <slot />
    </div>
</div>
