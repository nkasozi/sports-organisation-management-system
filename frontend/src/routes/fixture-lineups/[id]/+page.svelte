<script lang="ts">
  import { page } from "$app/stores";

  import FixtureLineupDetailPage from "../../../lib/presentation/components/fixtureLineup/FixtureLineupDetailPage.svelte";

  $: lineup_id = $page.params.id || "";
</script>

<FixtureLineupDetailPage {lineup_id} />
