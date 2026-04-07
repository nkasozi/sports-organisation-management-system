<script lang="ts">
  import { player_profile_management_configuration } from "$lib/presentation/logic/profileManagementPageConfigurations";

  import ProfileManagementPage from "../../lib/presentation/components/profile/ProfileManagementPage.svelte";
</script>

<ProfileManagementPage
  configuration={player_profile_management_configuration}
/>
