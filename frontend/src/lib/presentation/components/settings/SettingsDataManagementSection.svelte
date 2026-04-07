<script lang="ts">
    import SettingsSectionCard from "$lib/presentation/components/settings/SettingsSectionCard.svelte";
</script>

<SettingsSectionCard
    title="Data Management"
    description="Export and manage your organization data"
    content_class_name="space-y-4"
>
    <div class="flex flex-col sm:flex-row gap-3">
        <button type="button" class="btn btn-outline">
            <svg
                class="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                /></svg
            >
            Export All Data
        </button>
        <button type="button" class="btn btn-outline">
            <svg
                class="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                /></svg
            >
            Import Data
        </button>
    </div>

    <p class="text-xs text-accent-500 dark:text-accent-400">
        Export data as JSON for backup or migration purposes
    </p>
</SettingsSectionCard>
