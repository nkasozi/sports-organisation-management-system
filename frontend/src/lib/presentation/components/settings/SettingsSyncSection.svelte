<script lang="ts">
    import { get_use_cases_container } from "$lib/infrastructure/container";
    import { configure_scheduled_interval } from "$lib/infrastructure/sync/backgroundSyncService";
    import SettingsSectionCard from "$lib/presentation/components/settings/SettingsSectionCard.svelte";
    import {
        is_allowed_sync_interval,
        SYNC_INTERVAL_OPTIONS,
    } from "$lib/presentation/logic/settingsPageState";

    export let selected_organization_id: string;
    export let selected_sync_interval_ms: number;
    export let caller_role: string;
    export let show_toast: (
        message: string,
        type: "success" | "error" | "info",
    ) => void;

    async function handle_sync_interval_change(): Promise<void> {
        if (
            !selected_organization_id ||
            !is_allowed_sync_interval(selected_sync_interval_ms)
        ) {
            return;
        }

        const use_cases = get_use_cases_container();
        const result =
            await use_cases.organization_settings_use_cases.save_or_update(
                caller_role,
                selected_organization_id,
                { sync_interval_ms: selected_sync_interval_ms },
            );

        if (!result.success) {
            show_toast(
                result.error ?? "Failed to update sync interval",
                "error",
            );
            return;
        }

        configure_scheduled_interval(selected_sync_interval_ms);
        show_toast(
            "Sync interval updated for all organization users",
            "success",
        );
    }
</script>

<SettingsSectionCard
    title="Data Sync"
    description="Configure how often the app syncs with the server for all users in your organization"
    content_class_name="space-y-4"
>
    <div>
        <label
            for="sync_interval"
            class="block text-sm font-medium text-accent-700 dark:text-accent-300 mb-2"
        >
            Scheduled Sync Interval
        </label>
        <select
            id="sync_interval"
            class="select-styled w-full max-w-xs"
            bind:value={selected_sync_interval_ms}
            on:change={handle_sync_interval_change}
        >
            {#each SYNC_INTERVAL_OPTIONS as option}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
        <p class="mt-2 text-xs text-accent-500 dark:text-accent-400">
            Changes apply to all users in your organization after their next
            sync.
        </p>
    </div>
</SettingsSectionCard>
