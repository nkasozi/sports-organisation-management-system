<script lang="ts">
  const faq_items = [
    {
      question: "How do I create a new competition?",
      answer:
        "Navigate to Competitions from the sidebar, then click 'Add Competition'. Fill in the required details like name, sport type, dates, and organization.",
    },
    {
      question: "How do I add teams to a competition?",
      answer:
        "First create the teams under the Teams section, then go to the competition's edit page and use the 'Teams' tab to add teams to that competition.",
    },
    {
      question: "How do I schedule fixtures/games?",
      answer:
        "Go to Games from the sidebar and click 'Create Fixture'. Select the competition, home team, away team, date, time, and venue.",
    },
    {
      question: "How do I manage live game scores?",
      answer:
        "From the Games list, click 'Manage' on any fixture. You can start the game, update scores in real-time, and end the game when complete.",
    },
    {
      question: "How do I add officials/referees?",
      answer:
        "Navigate to Officials from the sidebar and click 'Add Official'. You can specify their role, certification level, and assign them to your organization.",
    },
    {
      question: "Can I customize the theme colors?",
      answer:
        "Yes! Go to Settings from the sidebar. You can toggle dark mode, and customize primary and secondary colors to match your organization's branding.",
    },
  ];

  let expanded_index: number | null = null;

  function toggle_faq(index: number): void {
    expanded_index = expanded_index === index ? null : index;
  }
</script>

<svelte:head>
  <title>Help - Sports Management</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
  <div>
    <h1 class="text-2xl font-bold text-accent-900 dark:text-accent-100">
      Help & Support
    </h1>
    <p class="text-accent-600 dark:text-accent-400 mt-1">
      Find answers to common questions and learn how to use the system
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <a
      href="/organizations"
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 hover:shadow-md transition-shadow"
    >
      <div
        class="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4"
      >
        <svg
          class="h-6 w-6 text-primary-600 dark:text-primary-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <h3 class="font-semibold text-accent-900 dark:text-accent-100">
        Getting Started
      </h3>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Create your first organization to get started
      </p>
    </a>

    <a
      href="/competitions"
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 hover:shadow-md transition-shadow"
    >
      <div
        class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4"
      >
        <svg
          class="h-6 w-6 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      </div>
      <h3 class="font-semibold text-accent-900 dark:text-accent-100">
        Run Competitions
      </h3>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Set up leagues, tournaments, and championships
      </p>
    </a>

    <a
      href="/fixtures"
      class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700 p-6 hover:shadow-md transition-shadow"
    >
      <div
        class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4"
      >
        <svg
          class="h-6 w-6 text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 class="font-semibold text-accent-900 dark:text-accent-100">
        Manage Games
      </h3>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Schedule fixtures and manage live scoring
      </p>
    </a>
  </div>

  <div
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-6 border-b border-accent-200 dark:border-accent-700">
      <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
        Frequently Asked Questions
      </h2>
    </div>
    <div class="divide-y divide-accent-200 dark:divide-accent-700">
      {#each faq_items as item, index}
        <div class="p-0">
          <button
            type="button"
            class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-accent-50 dark:hover:bg-accent-700/50 transition-colors"
            on:click={() => toggle_faq(index)}
            aria-expanded={expanded_index === index}
          >
            <span class="font-medium text-accent-900 dark:text-accent-100">
              {item.question}
            </span>
            <svg
              class="h-5 w-5 text-accent-500 transform transition-transform {expanded_index ===
              index
                ? 'rotate-180'
                : ''}"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {#if expanded_index === index}
            <div class="px-6 pb-4">
              <p class="text-accent-600 dark:text-accent-400">{item.answer}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

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
          Need more help?
        </h3>
        <p class="text-sm text-primary-700 dark:text-primary-300 mt-1">
          If you can't find what you're looking for, please reach out to our
          support team. We're here to help you get the most out of the Sports
          Management System.
        </p>
        <a
          href="mailto:support@sportsorg.com"
          class="inline-flex items-center mt-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          Contact Support
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
</div>
