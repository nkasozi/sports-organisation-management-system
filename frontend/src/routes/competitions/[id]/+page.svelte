<script lang="ts">
    import { page } from "$app/stores";
    import CompetitionEditPage from "$lib/presentation/components/competition/CompetitionEditPage.svelte";
</script>

<CompetitionEditPage competition_id={$page.params.id ?? ""} />
