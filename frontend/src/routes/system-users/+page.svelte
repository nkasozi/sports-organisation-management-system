<script lang="ts">
    import EntityCrudWrapper from "$lib/presentation/components/EntityCrudWrapper.svelte";
    import { auth_store } from "$lib/presentation/stores/auth";

    const SYSTEM_USER_ENTITY_TYPE = "SystemUser";
    const SYSTEM_USERS_EVENT = {
        PROFILE_REFRESH_STARTED: "system_users_profile_refresh_started",
        PROFILE_REFRESH_SUCCEEDED: "system_users_profile_refresh_succeeded",
        PROFILE_REFRESH_FAILED: "system_users_profile_refresh_failed",
    } as const;

    async function handle_system_user_changed(): Promise<void> {
        console.debug("[SystemUsersPage] System user changed", {
            event: SYSTEM_USERS_EVENT.PROFILE_REFRESH_STARTED,
        });
        const refresh_succeeded = await auth_store.refresh_profiles();
        const event = refresh_succeeded
            ? SYSTEM_USERS_EVENT.PROFILE_REFRESH_SUCCEEDED
            : SYSTEM_USERS_EVENT.PROFILE_REFRESH_FAILED;
        console.debug("[SystemUsersPage] Profile refresh finished", { event });
    }
</script>

<svelte:head>
    <title>System Users - Sports Management</title>
</svelte:head>

<EntityCrudWrapper
    entity_type={SYSTEM_USER_ENTITY_TYPE}
    on:entity_created={handle_system_user_changed}
    on:entity_updated={handle_system_user_changed}
    on:entity_deleted={handle_system_user_changed}
    on:entities_deleted={handle_system_user_changed}
/>
