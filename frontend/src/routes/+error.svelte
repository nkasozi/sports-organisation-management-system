<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import ErrorPageCard from "$lib/presentation/components/ui/ErrorPageCard.svelte";
    import {
        ERROR_PAGE_PATHS,
        ERROR_PAGE_SECONDARY_ACTION,
        resolve_error_page_secondary_action,
    } from "$lib/presentation/components/ui/errorPageCardPresentation";
    import { get_error_config } from "$lib/presentation/logic/errorPageState";

    const ERROR_PAGE_DISPLAYED_EVENT = "error_page_displayed";
    const MINIMUM_HISTORY_LENGTH_FOR_BACK = 2;

    $: error_code = $page.status;
    $: config = get_error_config(error_code);
    $: log_error_page_display(error_code, $page.error?.message ?? "");

    function log_error_page_display(
        status_code: number,
        technical_message: string,
    ): boolean {
        console.error("[ErrorPage] Error page displayed", {
            event: ERROR_PAGE_DISPLAYED_EVENT,
            status_code,
            path: $page.url.pathname,
            technical_message,
        });
        return true;
    }

    function handle_primary_action(): void {
        if (config.primary_action_href) {
            void goto(config.primary_action_href);
            return;
        }
        window.location.reload();
    }

    function go_back_or_home(): void {
        if (window.history.length >= MINIMUM_HISTORY_LENGTH_FOR_BACK)
            return window.history.back();
        void goto(ERROR_PAGE_PATHS.HOME);
    }

    function handle_secondary_action(): void {
        const secondary_action = resolve_error_page_secondary_action(
            config.secondary_action_label,
        );
        switch (secondary_action) {
            case ERROR_PAGE_SECONDARY_ACTION.GO_BACK:
                return go_back_or_home();
            case ERROR_PAGE_SECONDARY_ACTION.GO_HOME:
                void goto(ERROR_PAGE_PATHS.HOME);
                return;
            case ERROR_PAGE_SECONDARY_ACTION.CONTACT_SUPPORT:
                void goto(ERROR_PAGE_PATHS.CONTACT);
                return;
        }
    }
</script>

<ErrorPageCard
    {config}
    {error_code}
    on_primary_action={handle_primary_action}
    on_secondary_action={handle_secondary_action}
/>
