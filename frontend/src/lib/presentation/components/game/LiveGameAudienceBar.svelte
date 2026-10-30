<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import {
        create_none_option,
        type Option,
        OptionStatus,
    } from "$lib/core/types/Option";
    import type { LiveAudienceSession } from "$lib/infrastructure/liveAudience/liveAudienceSession";
    import {
        type AudienceDisplay,
        build_audience_display,
    } from "$lib/presentation/logic/liveAudienceDisplay";
    import { follow_live_game_audience } from "$lib/presentation/logic/liveAudienceRuntime";

    export let fixture_id: string;

    const FACE_COLORS = [
        "bg-rose-500",
        "bg-amber-500",
        "bg-emerald-500",
        "bg-sky-500",
        "bg-violet-500",
        "bg-pink-500",
        "bg-teal-500",
        "bg-orange-500",
    ];

    let display: AudienceDisplay = build_audience_display({
        watching_now: 0,
        is_viewer_counted: false,
        other_faces: [],
    });
    let session: Option<LiveAudienceSession> = create_none_option();

    onMount(() => {
        session = follow_live_game_audience(fixture_id, (audience) => {
            display = build_audience_display(audience);
        });
    });

    onDestroy(() => {
        if (session.status === OptionStatus.SOME) session.value.stop();
    });
</script>

{#if session.status === OptionStatus.SOME}<div
        class="bg-gray-800 text-gray-100 px-4 py-2"
        data-testid="live-audience-bar"
    >
        <div
            class="max-w-4xl mx-auto flex items-center justify-center gap-3"
            aria-live="polite"
        >
            <div class="flex -space-x-2" aria-hidden="true">
                {#each display.faces as face (face.key)}<span
                        class="h-7 min-w-7 px-1 rounded-full ring-2 ring-gray-800 flex items-center justify-center text-[0.65rem] font-semibold text-white {face.is_you
                            ? 'bg-gray-600'
                            : FACE_COLORS[
                                  face.color_index % FACE_COLORS.length
                              ]}"
                        title={face.name}>{face.initial}</span
                    >{/each}{#if display.hidden_count > 0}<span
                        class="h-7 min-w-7 px-1 rounded-full ring-2 ring-gray-800 bg-gray-700 flex items-center justify-center text-[0.65rem] font-semibold"
                        title="{display.hidden_count} more watching"
                        >+{display.hidden_count}</span
                    >{/if}
            </div>
            <p class="text-sm flex items-center gap-1.5">
                <span
                    class="h-2 w-2 rounded-full bg-red-500 animate-pulse"
                    aria-hidden="true"
                ></span>{display.headline}
            </p>
        </div>
    </div>{/if}
