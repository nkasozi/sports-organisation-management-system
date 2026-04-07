<script lang="ts">
    import { split_organization_name } from "$lib/presentation/logic/dashboardPageLogic";

    export let organization_name: string;
    export let organization_tagline: string;
    export let user_is_super_admin: boolean;
    export let is_resetting: boolean;
    export let on_reset: () => void;

    $: organization_name_parts = split_organization_name(organization_name);
</script>

<div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6"
>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
            <h1
                class="text-2xl sm:text-3xl font-bold text-accent-900 dark:text-accent-100 mb-2"
            >
                Welcome to
                {#if organization_name_parts.prefix}
                    {organization_name_parts.prefix}
                {/if}
                <span class="text-theme-secondary-600"
                    >{organization_name_parts.suffix}</span
                >
                {#if organization_name_parts.remainder}
                    {organization_name_parts.remainder}
                {/if}
            </h1>
            <p class="text-accent-600 dark:text-accent-300 text-mobile">
                {organization_tagline}
            </p>
        </div>
        {#if user_is_super_admin}
            <div class="mt-4 md:mt-0">
                <button
                    class="btn btn-primary-action mobile-touch"
                    on:click={on_reset}
                    disabled={is_resetting}
                >
                    {is_resetting ? "Resetting..." : "Reset Demo Data"}
                </button>
            </div>
        {/if}
    </div>
</div>
