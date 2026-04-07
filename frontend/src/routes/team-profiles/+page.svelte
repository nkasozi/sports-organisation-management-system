<script lang="ts">
  import { team_profile_management_configuration } from "$lib/presentation/logic/profileManagementPageConfigurations";

  import ProfileManagementPage from "../../lib/presentation/components/profile/ProfileManagementPage.svelte";
</script>

<ProfileManagementPage configuration={team_profile_management_configuration} />
