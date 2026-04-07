<script lang="ts">
    import SettingsSectionCard from "$lib/presentation/components/settings/SettingsSectionCard.svelte";
    import SettingsToggleRow from "$lib/presentation/components/settings/SettingsToggleRow.svelte";

    let notifications_enabled: boolean = true;
    let email_notifications: boolean = true;
</script>

<SettingsSectionCard
    title="Notifications"
    description="Configure how you receive updates"
>
    <SettingsToggleRow
        title="Push Notifications"
        description="Receive browser notifications for important updates"
        aria_label="Toggle push notifications"
        bind:enabled={notifications_enabled}
    />

    <SettingsToggleRow
        title="Email Notifications"
        description="Receive email updates for game results and schedules"
        aria_label="Toggle email notifications"
        bind:enabled={email_notifications}
    />
</SettingsSectionCard>
