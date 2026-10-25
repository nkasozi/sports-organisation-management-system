<script lang="ts">
    import { onMount } from "svelte";

    import { page } from "$app/stores";
    import ConceptGuidePage from "$lib/presentation/components/guide/ConceptGuidePage.svelte";
    import { ensure_route_access } from "$lib/presentation/logic/authGuard";

    onMount(() => {
        void ensure_route_access($page.url.pathname);
    });
</script>

<svelte:head>
    <title>How It Works - Sports Management</title>
</svelte:head>

<ConceptGuidePage />
