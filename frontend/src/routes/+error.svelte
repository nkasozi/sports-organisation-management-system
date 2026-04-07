<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import ErrorPageCard from "$lib/presentation/components/ui/ErrorPageCard.svelte";
    import { get_error_config } from "$lib/presentation/logic/errorPageState";

    $: error_code = $page.status;
    $: error_message = $page.error?.message || "An unexpected error occurred";
    $: config = get_error_config(error_code);

    function handle_primary_action(): void {
        if (config.primary_action_href) {
            void goto(config.primary_action_href);
            return;
        }
        window.location.reload();
    }

    function handle_secondary_action(): void {
        if (config.secondary_action_label === "Go Back") {
            if (window.history.length > 1) return window.history.back();
            void goto("/");
            return;
        }
        if (config.secondary_action_label === "Go Home") {
            void goto("/");
            return;
        }
        void goto("/contact");
    }
</script>

<ErrorPageCard
    {config}
    {error_code}
    {error_message}
    on_primary_action={handle_primary_action}
    on_secondary_action={handle_secondary_action}
/>
