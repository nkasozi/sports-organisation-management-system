<script lang="ts">
    import type { Fixture } from "$lib/core/entities/Fixture";
    import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";

    import LiveGameAudienceBar from "./LiveGameAudienceBar.svelte";
    import LiveGameViewerStats from "./LiveGameViewerStats.svelte";

    export let fixture_id: string;
    export let fixture_status: Fixture["status"];
</script>

{#if fixture_status === FIXTURE_STATUS.IN_PROGRESS}<LiveGameAudienceBar
        {fixture_id}
    />{:else if fixture_status === FIXTURE_STATUS.COMPLETED}<div
        class="max-w-3xl mx-auto w-full px-4"
    >
        <LiveGameViewerStats {fixture_id} />
    </div>{/if}
