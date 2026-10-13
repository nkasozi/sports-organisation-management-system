<style>
    :global(header button) {
        transition: all 0.2s ease-in-out;
    }

    :global(header button:focus-visible) {
        outline: 2px solid theme("colors.primary.500");
        outline-offset: 2px;
    }
    :global(.header-panel) {
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }
    :global(.header-panel h1),
    :global(.header-panel p),
    :global(.header-panel span:not(.text-theme-secondary-600)),
    :global(.header-panel button) {
        color: white !important;
    }
    :global(.header-panel .text-theme-secondary-600) {
        color: var(--color-secondary-600) !important;
    }
    :global(.header-panel svg) {
        color: white !important;
        stroke: white !important;
    }
    :global(.header-panel .dropdown-menu),
    :global(.header-panel .dropdown-menu p),
    :global(.header-panel .dropdown-menu span) {
        text-shadow: none !important;
        color: inherit !important;
    }
    :global(.header-panel .dropdown-menu button) {
        color: inherit !important;
        text-shadow: none !important;
    }
    :global(.header-panel .dropdown-menu svg) {
        color: inherit !important;
        stroke: currentColor !important;
    }
</style>
