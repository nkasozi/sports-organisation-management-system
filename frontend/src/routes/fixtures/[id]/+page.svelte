<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import type {
    Fixture,
    UpdateFixtureInput,
    AssignedOfficial,
  } from "$lib/domain/entities/Fixture";
  import type { Competition } from "$lib/domain/entities/Competition";
  import type { Team } from "$lib/domain/entities/Team";
  import type { CompetitionTeam } from "$lib/domain/entities/CompetitionTeam";
  import type { Official } from "$lib/domain/entities/Official";
  import type { GameOfficialRole } from "$lib/domain/entities/GameOfficialRole";
  import type { SelectOption } from "$lib/components/ui/SelectField.svelte";
  import type { LoadingState } from "$lib/components/ui/LoadingStateWrapper.svelte";
  import { get_fixture_use_cases } from "$lib/usecases/FixtureUseCases";
  import { get_competition_use_cases } from "$lib/usecases/CompetitionUseCases";
  import { get_team_use_cases } from "$lib/usecases/TeamUseCases";
  import { get_competition_team_use_cases } from "$lib/usecases/CompetitionTeamUseCases";
  import { get_official_use_cases } from "$lib/usecases/OfficialUseCases";
  import { get_game_official_role_use_cases } from "$lib/usecases/GameOfficialRoleUseCases";
  import LoadingStateWrapper from "$lib/components/ui/LoadingStateWrapper.svelte";
  import FormField from "$lib/components/ui/FormField.svelte";
  <script lang="ts">
    import EntityCrudWrapper from "$lib/components/EntityCrudWrapper.svelte";
    import { page } from "$app/stores";
    $: fixture_id = $page.params.id;
</script>

<svelte:head>
  <title>Edit Fixture - Sports Management</title>
</svelte:head>

<EntityCrudWrapper entity_type="fixture" entity_id={fixture_id} />
let fixture: Fixture | null = null;
