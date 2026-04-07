<script lang="ts">
    import { onMount } from "svelte";

    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    import HelpPageContent from "$lib/presentation/components/help/HelpPageContent.svelte";
    import { ensure_route_access } from "$lib/presentation/logic/authGuard";
    import { HELP_PAGE_BROWSER_TITLE } from "$lib/presentation/logic/helpPageContent";
    import { get_next_help_section_index } from "$lib/presentation/logic/helpPageState";

    let expanded_faq_index: number | null = null;
    let expanded_guide_index: number | null = null;

    async function initialize_help_page(): Promise<void> {
        if (!browser) return;
        await ensure_route_access($page.url.pathname);
    }

    function toggle_faq(selected_index: number): void {
        expanded_faq_index = get_next_help_section_index(
            expanded_faq_index,
            selected_index,
        );
    }

    function toggle_guide(selected_index: number): void {
        expanded_guide_index = get_next_help_section_index(
            expanded_guide_index,
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
        {expanded_faq_index}
        {expanded_guide_index}
        on_faq_toggle={toggle_faq}
        on_guide_toggle={toggle_guide}
    />
</div>
