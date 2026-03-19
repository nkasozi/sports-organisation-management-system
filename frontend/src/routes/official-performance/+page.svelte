<script lang="ts">
    import EntityCrudWrapper from "$lib/presentation/components/EntityCrudWrapper.svelte";
</script>

<svelte:head>
    <title>Officials Performance - Sports Management</title>
</svelte:head>

<div class="banner-info mb-4 flex gap-3 rounded-md px-4 py-3 text-sm">
    <svg
        class="banner-info-icon mt-0.5 h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
    >
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    </svg>
    <div>
        <p class="font-semibold">How performance rating works</p>
        <ul class="mt-1 list-disc space-y-0.5 pl-4">
            <li>
                Select a <strong>fixture</strong> — only
                <strong>completed</strong>
                fixtures for your organisation are shown.
            </li>
            <li>
                Then pick an <strong>official</strong> — only officials
                <strong>assigned</strong> to that fixture appear in the list,
                shown as <em>Name – Role</em>.
            </li>
            <li>
                Officials you have <strong>already rated</strong> for the selected
                fixture are automatically hidden.
            </li>
        </ul>
    </div>
</div>

<EntityCrudWrapper entity_type="OfficialPerformanceRating" />
