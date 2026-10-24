<script lang="ts">
    import { beforeNavigate } from "$app/navigation";
    import { updated } from "$app/stores";
    import RootLayoutPage from "$lib/presentation/components/layout/RootLayoutPage.svelte";
    import { should_reload_for_new_version } from "$lib/presentation/logic/appVersionUpdateNavigation";

    const NEW_VERSION_RELOAD_EVENT = "app_new_version_reload";

    beforeNavigate(({ willUnload, to }) => {
        const target_href = to?.url.href ?? "";
        if (
            !should_reload_for_new_version({
                is_new_version_available: $updated,
                will_unload: willUnload,
                has_target_url: target_href.length > 0,
            })
        )
            return;
        console.log("[Layout] Loading the newly deployed version", {
            event: NEW_VERSION_RELOAD_EVENT,
        });
        location.href = target_href;
    });
</script>

<RootLayoutPage>
    <slot />
</RootLayoutPage>
