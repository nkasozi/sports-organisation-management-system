<script lang="ts">
    import type { ProfileManagementConfiguration } from "$lib/presentation/logic/profileManagementPageState";

    import ProfileManagementPageController from "./ProfileManagementPageController.svelte";

    export let configuration: ProfileManagementConfiguration;
</script>

<ProfileManagementPageController {configuration} />
