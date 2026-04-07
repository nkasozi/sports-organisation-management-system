<script lang="ts">
    import {
        HELP_SUPPORT_DESCRIPTION,
        HELP_SUPPORT_EMAIL,
        HELP_SUPPORT_LINK_LABEL,
        HELP_SUPPORT_TITLE,
    } from "../../logic/helpPageContent";
</script>

<div
    class="bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 p-6"
>
    <div class="flex items-start gap-4">
        <div
            class="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center"
        >
            <svg
                class="h-5 w-5 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        </div>
        <div>
            <h3 class="font-semibold text-primary-900 dark:text-primary-100">
                {HELP_SUPPORT_TITLE}
            </h3>
            <p class="text-sm text-primary-700 dark:text-primary-300 mt-1">
                {HELP_SUPPORT_DESCRIPTION}
            </p>
            <a
                href={HELP_SUPPORT_EMAIL}
                class="inline-flex items-center mt-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
                {HELP_SUPPORT_LINK_LABEL}
                <svg
                    class="ml-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                </svg>
            </a>
        </div>
    </div>
</div>
