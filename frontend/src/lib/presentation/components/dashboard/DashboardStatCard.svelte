<script lang="ts">
    export let title: string;
    export let value: number;
    export let loading: boolean;
    export let href: string;
    export let user_can_navigate: boolean;
    export let background_class: string;
    export let icon_class: string;
    export let hover_ring_class: string;
    export let path_d: string;
</script>

<svelte:element
    this={user_can_navigate ? "a" : "div"}
    href={user_can_navigate ? href : undefined}
    class="card p-6 {user_can_navigate
        ? `hover:ring-2 ${hover_ring_class} cursor-pointer`
        : ''}"
>
    <div class="flex items-center">
        <div class="flex-shrink-0">
            <div
                class="h-12 w-12 {background_class} rounded-lg flex items-center justify-center"
            >
                {#if loading}
                    <div class="loading-spinner h-6 w-6"></div>
                {:else}
                    <svg
                        class="h-6 w-6 {icon_class}"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d={path_d}
                        />
                    </svg>
                {/if}
            </div>
        </div>
        <div class="ml-4 flex-1 min-w-0">
            <p
                class="text-sm font-medium text-accent-500 dark:text-accent-400 truncate"
            >
                {title}
            </p>
            <p class="text-2xl font-bold text-accent-900 dark:text-accent-100">
                {loading ? "---" : value}
            </p>
        </div>
    </div>
</svelte:element>
