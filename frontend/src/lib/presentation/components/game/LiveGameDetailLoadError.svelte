<script lang="ts">
    import { LIVE_GAME_DETAIL_TEXT } from "./liveGameDetailMessages";

    export let message: string;
    export let on_back: () => void;
</script>

<div class="max-w-2xl mx-auto p-6">
    <div
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
    >
        <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            {LIVE_GAME_DETAIL_TEXT.ERROR_TITLE}
        </h3>
        <p class="text-red-600 dark:text-red-400">{message}</p>
        <button type="button" class="btn btn-outline mt-4" on:click={on_back}
            >{LIVE_GAME_DETAIL_TEXT.BACK_TO_LIVE_GAMES}</button
        >
    </div>
</div>
