<script lang="ts">
    import { onMount } from "svelte";

    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import HelpPageContent from "$lib/presentation/components/help/HelpPageContent.svelte";
    import { ensure_route_access } from "$lib/presentation/logic/authGuard";
    import { HELP_PAGE_BROWSER_TITLE } from "$lib/presentation/logic/helpPageContent";
    import {
        get_next_help_section_state,
        type HelpSectionExpansionState,
    } from "$lib/presentation/logic/helpPageState";

    let expanded_faq_state: HelpSectionExpansionState = {
        status: "collapsed",
    };
    let expanded_guide_state: HelpSectionExpansionState = {
        status: "collapsed",
    };

    async function initialize_help_page(): Promise<void> {
        if (!browser) return;
        await ensure_route_access($page.url.pathname);
    }

    function toggle_faq(selected_index: number): void {
        expanded_faq_state = get_next_help_section_state(
            expanded_faq_state,
            selected_index,
        );
    }

    function toggle_guide(selected_index: number): void {
        expanded_guide_state = get_next_help_section_state(
            expanded_guide_state,
            selected_index,
        );
    }

    onMount(() => {
        void initialize_help_page();
    });
</script>

<svelte:head>
    <title>{HELP_PAGE_BROWSER_TITLE}</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
    <HelpPageContent
        {expanded_faq_state}
        {expanded_guide_state}
        on_faq_toggle={toggle_faq}
        on_guide_toggle={toggle_guide}
    />
</div>
