<script lang="ts">
    export let image_url: string;
    export let image_alt: string;
    export let fallback_text: string;
    export let title: string;
    export let title_suffix: string | null = null;
    export let subtitle: string | null = null;
    export let summary: string | null = null;
    export let metadata_items: Array<{ label: string; value: string }> = [];
</script>

<section
    class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8"
>
    <div class="h-32 sm:h-40 bg-indigo-600 dark:bg-indigo-700"></div>

    <div class="relative px-6 pb-6">
        <div
            class="flex flex-col sm:flex-row sm:items-end -mt-16 sm:-mt-20 mb-6"
        >
            <div class="relative">
                {#if image_url}
                    <img
                        src={image_url}
                        alt={image_alt}
                        class="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg bg-gray-100"
                    />
                {:else}
                    <div
                        class="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shadow-lg"
                    >
                        <span
                            class="text-4xl sm:text-5xl font-bold text-indigo-600 dark:text-indigo-300"
                        >
                            {fallback_text}
                        </span>
                    </div>
                {/if}
            </div>

            <div class="mt-4 sm:mt-0 sm:ml-6 sm:mb-2 flex-1">
                <div class="flex items-baseline gap-3">
                    <h1
                        class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
                    >
                        {title}
                    </h1>
                    {#if title_suffix}
                        <span
                            class="text-sm text-gray-500 dark:text-gray-400 font-medium"
                        >
                            {title_suffix}
                        </span>
                    {/if}
                </div>
                {#if subtitle}
                    <p
                        class="text-lg text-indigo-600 dark:text-indigo-400 font-medium mt-1"
                    >
                        {subtitle}
                    </p>
                {/if}
            </div>
        </div>

        {#if summary}
            <div class="mb-6">
                <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {summary}
                </p>
            </div>
        {/if}

        <slot name="supplementary"></slot>

        {#if metadata_items.length > 0}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {#each metadata_items as metadata_item}
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <p
                            class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                        >
                            {metadata_item.label}
                        </p>
                        <p
                            class="text-sm font-semibold text-gray-900 dark:text-white mt-1"
                        >
                            {metadata_item.value}
                        </p>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</section>
