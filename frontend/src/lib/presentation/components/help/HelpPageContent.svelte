<script lang="ts">
    import type { HelpSectionExpansionState } from "$lib/presentation/logic/helpPageState";

    import {
        HELP_PAGE_DESCRIPTION,
        HELP_PAGE_TITLE,
    } from "../../logic/helpPageContent";
    import HelpFaqSection from "./HelpFaqSection.svelte";
    import HelpGuideSection from "./HelpGuideSection.svelte";
    import HelpOverviewCards from "./HelpOverviewCards.svelte";
    import HelpSupportPanel from "./HelpSupportPanel.svelte";

    export let expanded_faq_state: HelpSectionExpansionState;
    export let expanded_guide_state: HelpSectionExpansionState;
    export let on_faq_toggle: (selected_index: number) => void;
    export let on_guide_toggle: (selected_index: number) => void;
</script>

<div>
    <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
        {HELP_PAGE_TITLE}
    </h1>
    <p class="text-accent-600 dark:text-accent-400 mt-1">
        {HELP_PAGE_DESCRIPTION}
    </p>
</div>

<HelpOverviewCards />
<HelpGuideSection {expanded_guide_state} on_toggle={on_guide_toggle} />
<HelpFaqSection {expanded_faq_state} on_toggle={on_faq_toggle} />
<HelpSupportPanel />
