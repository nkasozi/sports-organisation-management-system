<script lang="ts">
  interface GuideStep {
    step_number: number;
    title: string;
    description: string;
    link: string;
    details: string[];
  }

  interface FaqItem {
    question: string;
    answer: string;
  }

  const guide_steps: GuideStep[] = [
    {
      step_number: 1,
      title: "Create a Sport",
      description:
        "Define the sport your organization will manage. This establishes the rules, scoring system, and game structure.",
      link: "/sports/create",
      details: [
        "Navigate to Sports from the sidebar menu",
        "Click 'Add Sport' to create a new sport entry",
        "Enter the sport name (e.g., Football, Basketball, Rugby)",
        "Configure game periods (halves, quarters, sets, etc.)",
        "Set period duration and any break times",
        "Define scoring types (goals, points, tries, etc.)",
        "Save to establish your sport foundation",
      ],
    },
    {
      step_number: 2,
      title: "Set Up Your Organization",
      description:
        "Create your sports organization that will govern competitions, teams, and officials.",
      link: "/organizations",
      details: [
        "Go to Organizations from the sidebar",
        "Click 'Add Organization' to create new",
        "Enter organization name and details",
        "Add contact information (email, address)",
        "Upload your organization logo in Settings",
        "Configure branding colors to match your identity",
        "Add social media links for public visibility",
      ],
    },
    {
      step_number: 3,
      title: "Create Teams",
      description:
        "Register the teams that will participate in your competitions.",
      link: "/teams",
      details: [
        "Navigate to Teams from the sidebar",
        "Click 'Add Team' to register a new team",
        "Enter team name and nickname",
        "Select the sport the team plays",
        "Associate the team with your organization",
        "Upload team logo for identification",
        "Note the home venue if applicable",
      ],
    },
    {
      step_number: 4,
      title: "Set Up Team Profiles & Jerseys",
      description:
        "Configure team visual identity including jersey colors for home and away matches.",
      link: "/team-profiles",
      details: [
        "Go to Team Profiles from the sidebar",
        "Select the team to configure",
        "Set primary jersey color (home matches)",
        "Set secondary jersey color (away matches)",
        "Define jersey patterns if applicable",
        "Upload team photos or crests",
        "This helps distinguish teams during live games",
      ],
    },
    {
      step_number: 5,
      title: "Register Players",
      description:
        "Add players to your system who can then be assigned to teams.",
      link: "/players",
      details: [
        "Navigate to Players from the sidebar",
        "Click 'Add Player' to register new players",
        "Enter player personal details (name, date of birth)",
        "Add identification information if required",
        "Upload player photo for profiles",
        "Players can later be assigned to multiple teams",
        "Track player statistics across competitions",
      ],
    },
    {
      step_number: 6,
      title: "Assign Players to Teams",
      description:
        "Create team rosters by assigning registered players to teams.",
      link: "/player-team-memberships",
      details: [
        "Go to Player Team Memberships",
        "Click 'Add Membership' to assign a player",
        "Select the player from the registry",
        "Choose the team they will play for",
        "Set their jersey number for that team",
        "Assign their playing position",
        "Set membership dates (season start/end)",
      ],
    },
    {
      step_number: 7,
      title: "Configure Player Positions",
      description:
        "Define the positions players can occupy based on your sport.",
      link: "/player-positions",
      details: [
        "Navigate to Player Positions",
        "Create positions specific to your sport",
        "For football: Goalkeeper, Defender, Midfielder, Forward",
        "For basketball: Point Guard, Center, etc.",
        "Positions are used in lineup management",
        "Helps with tactical planning and statistics",
        "Can track position-specific performance metrics",
      ],
    },
    {
      step_number: 8,
      title: "Register Officials",
      description:
        "Add referees, umpires, and other match officials to your system.",
      link: "/officials",
      details: [
        "Go to Officials from the sidebar",
        "Click 'Add Official' to register",
        "Enter official personal details",
        "Assign official roles (referee, assistant, etc.)",
        "Set certification/qualification level",
        "Associate with your organization",
        "Officials can be assigned to fixtures later",
      ],
    },
    {
      step_number: 9,
      title: "Configure Official Roles",
      description:
        "Define the types of officiating roles available in your sport.",
      link: "/official-roles",
      details: [
        "Navigate to Official Roles",
        "Create roles like Main Referee, Assistant Referee",
        "Add Fourth Official, Video Referee if applicable",
        "Define responsibilities for each role",
        "Roles help organize match day assignments",
        "Ensures proper coverage for all matches",
        "Can track official performance by role",
      ],
    },
    {
      step_number: 10,
      title: "Register Staff Members",
      description:
        "Add coaches, managers, physiotherapists, and other team staff.",
      link: "/team-staff",
      details: [
        "Go to Team Staff from the sidebar",
        "Click 'Add Staff' to register",
        "Enter staff member details",
        "Assign to specific teams",
        "Define their staff role",
        "Staff appear on team sheets",
        "Can track staff certifications and licenses",
      ],
    },
    {
      step_number: 11,
      title: "Configure Staff Roles",
      description: "Define the types of staff positions available for teams.",
      link: "/staff-roles",
      details: [
        "Navigate to Staff Roles",
        "Create roles like Head Coach, Assistant Coach",
        "Add Team Manager, Physiotherapist, etc.",
        "Roles help organize team management",
        "Defines who can perform what actions",
        "Important for access control if implemented",
        "Shows proper hierarchy on team sheets",
      ],
    },
    {
      step_number: 12,
      title: "Set Up Venues",
      description:
        "Register stadiums, pitches, and courts where matches will be played.",
      link: "/venues/create",
      details: [
        "Go to Venues from the sidebar",
        "Click 'Add Venue' to create new",
        "Enter venue name and location",
        "Add address details for directions",
        "Set venue capacity if relevant",
        "Upload venue photos",
        "Venues are assigned to fixtures",
      ],
    },
    {
      step_number: 13,
      title: "Configure Competition Formats",
      description:
        "Define how competitions will be structured (league, knockout, groups).",
      link: "/competition-formats",
      details: [
        "Navigate to Competition Formats",
        "Create formats like Round Robin, Knockout",
        "Add Group Stage + Knockout combinations",
        "Define how standings are calculated",
        "Set tiebreaker rules",
        "Formats can be reused across competitions",
        "Determines how fixtures are generated",
      ],
    },
    {
      step_number: 14,
      title: "Create a Competition",
      description:
        "Set up a league, tournament, or championship for teams to compete in.",
      link: "/competitions/create",
      details: [
        "Go to Competitions from the sidebar",
        "Click 'Add Competition' to create new",
        "Enter competition name and description",
        "Select the sport type",
        "Choose competition format (league, knockout, etc.)",
        "Set start and end dates for the season",
        "Associate with your organization",
      ],
    },
    {
      step_number: 15,
      title: "Add Teams to Competition",
      description: "Register which teams will participate in your competition.",
      link: "/competitions",
      details: [
        "Go to the Competition detail page",
        "Find the Teams section",
        "Click 'Add Team' to include teams",
        "Select from your registered teams",
        "Set group assignments if applicable",
        "Confirm team registration status",
        "Teams appear in fixture scheduling",
      ],
    },
    {
      step_number: 16,
      title: "Create Fixtures",
      description: "Schedule matches between teams in your competition.",
      link: "/fixtures/create",
      details: [
        "Navigate to Fixtures from the sidebar",
        "Click 'Create Fixture' for new matches",
        "Select the competition",
        "Choose home team and away team",
        "Set match date and kick-off time",
        "Assign the venue for the match",
        "Set matchday/round number if applicable",
      ],
    },
    {
      step_number: 17,
      title: "Assign Officials to Fixtures",
      description: "Appoint referees and officials for each scheduled match.",
      link: "/fixtures",
      details: [
        "Go to the Fixture detail page",
        "Find the Officials assignment section",
        "Add Main Referee for the match",
        "Add Assistant Referees",
        "Add Fourth Official if required",
        "Officials receive their assignments",
        "Ensures proper match coverage",
      ],
    },
    {
      step_number: 18,
      title: "Prepare Match Lineups",
      description:
        "Set starting lineups and substitutes for upcoming fixtures.",
      link: "/fixture-lineups/create",
      details: [
        "Navigate to Fixture Lineups",
        "Select the fixture to prepare",
        "Choose starting XI (or appropriate number)",
        "Assign jersey numbers and positions",
        "Add substitute players",
        "Include team staff on the bench",
        "Lineups can be modified until match starts",
      ],
    },
    {
      step_number: 19,
      title: "Start a Live Game",
      description: "Begin live scoring and match management for a fixture.",
      link: "/live-games",
      details: [
        "Go to Live Games from the sidebar",
        "Or click 'Manage' on a fixture from Fixtures list",
        "Click 'Start Game' when ready",
        "The match clock begins automatically",
        "Current period is tracked (1st half, 2nd half, etc.)",
        "Both teams' lineups are displayed",
        "Score updates appear in real-time",
      ],
    },
    {
      step_number: 20,
      title: "Record Match Events",
      description:
        "Log goals, cards, substitutions, and other match events as they happen.",
      link: "/live-games",
      details: [
        "During a live game, use the event controls",
        "Record goals with scorer and time",
        "Log yellow and red cards",
        "Record substitutions (player in/out)",
        "Add assists if applicable",
        "Track injuries or stoppages",
        "All events are timestamped automatically",
      ],
    },
    {
      step_number: 21,
      title: "Manage Game Periods",
      description:
        "Control half-time, extra time, and period transitions during matches.",
      link: "/live-games",
      details: [
        "Use 'End Period' to conclude current period",
        "Start next period when teams are ready",
        "Half-time break is tracked automatically",
        "Add extra time if regulations require",
        "Penalty shootouts can be recorded",
        "Match duration is calculated precisely",
        "Period-by-period stats are maintained",
      ],
    },
    {
      step_number: 22,
      title: "Complete the Game",
      description: "Finalize the match and confirm the final result.",
      link: "/live-games",
      details: [
        "When all periods are complete, click 'End Game'",
        "Final score is locked and recorded",
        "Match status changes to 'Completed'",
        "Results are automatically added to standings",
        "Player statistics are updated",
        "Match report becomes available",
        "Competition table recalculates immediately",
      ],
    },
    {
      step_number: 23,
      title: "View Competition Results",
      description:
        "Check standings, results, and statistics for your competition.",
      link: "/competition-results",
      details: [
        "Navigate to Competition Results",
        "Select the competition to view",
        "See the current standings table",
        "Points, wins, draws, losses displayed",
        "Goal difference and goals scored/conceded",
        "Click teams to see their match history",
        "Track who's leading, who needs improvement",
      ],
    },
  ];

  const faq_items: FaqItem[] = [
    {
      question: "How do I create a new competition?",
      answer:
        "Navigate to Competitions from the sidebar, then click 'Add Competition'. Fill in the required details like name, sport type, dates, and organization. Make sure you've created the sport first.",
    },
    {
      question: "How do I add teams to a competition?",
      answer:
        "First create the teams under the Teams section, then go to the competition's edit page and use the 'Teams' tab to add teams to that competition.",
    },
    {
      question: "How do I schedule fixtures/games?",
      answer:
        "Go to Fixtures from the sidebar and click 'Create Fixture'. Select the competition, home team, away team, date, time, and venue. You can create individual matches or bulk generate fixture schedules.",
    },
    {
      question: "How do I manage live game scores?",
      answer:
        "From the Fixtures list, click on any scheduled fixture to view its details, then click 'Manage Live Game'. You can start the game, record events like goals and cards, manage periods, and end the game when complete.",
    },
    {
      question: "How do I add officials/referees?",
      answer:
        "Navigate to Officials from the sidebar and click 'Add Official'. You can specify their role, certification level, and assign them to your organization. Then assign them to specific fixtures.",
    },
    {
      question: "How do I set up player positions?",
      answer:
        "Go to Player Positions and create the positions relevant to your sport (e.g., Goalkeeper, Defender, Midfielder, Forward for football). These are used when creating lineups for fixtures.",
    },
    {
      question: "How do I create lineups for a match?",
      answer:
        "Navigate to Fixture Lineups, select the fixture, and add players from each team's roster. Assign their positions and jersey numbers for that specific match.",
    },
    {
      question: "Can I customize the theme colors?",
      answer:
        "Yes! Go to Settings from the sidebar. You can toggle dark mode, and customize primary and secondary colors to match your organization's branding. You can also customize header/footer patterns.",
    },
    {
      question:
        "What's the difference between Players and Player Team Memberships?",
      answer:
        "Players are individual person records. Player Team Memberships link a player to a specific team with their jersey number and position. One player can have multiple memberships across different teams or seasons.",
    },
    {
      question: "How do I track competition standings?",
      answer:
        "Competition Results automatically calculates standings based on completed fixtures. Points are awarded for wins/draws, and the table shows goal difference, goals scored, and current rankings.",
    },
  ];

  let expanded_index: number | null = null;
  let expanded_guide_index: number | null = null;

  function toggle_faq(index: number): void {
    expanded_index = expanded_index === index ? null : index;
  }

  function toggle_guide(index: number): void {
    expanded_guide_index = expanded_guide_index === index ? null : index;
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
      Complete guide to managing your sports organization from start to finish
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <a
      href="#step-by-step"
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      </div>
      <h3 class="font-semibold text-accent-900 dark:text-accent-100">
        Step-by-Step Guide
      </h3>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Complete 23-step walkthrough from setup to results
      </p>
    </a>

    <a
      href="#faq"
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
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 class="font-semibold text-accent-900 dark:text-accent-100">FAQ</h3>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Quick answers to common questions
      </p>
    </a>

    <a
      href="/settings"
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <h3 class="font-semibold text-accent-900 dark:text-accent-100">
        Settings
      </h3>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Customize branding, colors, and preferences
      </p>
    </a>
  </div>

  <div
    id="step-by-step"
    class="bg-white dark:bg-accent-800 rounded-lg shadow-sm border border-accent-200 dark:border-accent-700"
  >
    <div class="p-6 border-b border-accent-200 dark:border-accent-700">
      <h2 class="text-lg font-semibold text-accent-900 dark:text-accent-100">
        Complete Setup Guide
      </h2>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
        Follow these 23 steps to set up your sports organization, run
        competitions, and track results
      </p>
    </div>
    <div class="divide-y divide-accent-200 dark:divide-accent-700">
      {#each guide_steps as step, index}
        <div class="p-0">
          <button
            type="button"
            class="w-full px-6 py-4 text-left flex items-start gap-4 hover:bg-accent-50 dark:hover:bg-accent-700/50 transition-colors"
            on:click={() => toggle_guide(index)}
            aria-expanded={expanded_guide_index === index}
            aria-label="Step {step.step_number}: {step.title}"
          >
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold {expanded_guide_index ===
              index
                ? 'bg-theme-primary-500 text-white'
                : 'bg-accent-200 dark:bg-accent-700 text-accent-700 dark:text-accent-300'}"
            >
              {step.step_number}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="font-medium text-accent-900 dark:text-accent-100">
                  {step.title}
                </h3>
                <svg
                  class="h-5 w-5 text-accent-500 transform transition-transform flex-shrink-0 ml-2 {expanded_guide_index ===
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
              </div>
              <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">
                {step.description}
              </p>
            </div>
          </button>
          {#if expanded_guide_index === index}
            <div class="px-6 pb-4 pl-18">
              <div class="ml-12 space-y-2">
                <ul class="space-y-2">
                  {#each step.details as detail}
                    <li
                      class="flex items-start gap-2 text-sm text-accent-600 dark:text-accent-400"
                    >
                      <svg
                        class="h-4 w-4 text-theme-primary-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span>{detail}</span>
                    </li>
                  {/each}
                </ul>
                <a
                  href={step.link}
                  class="inline-flex items-center mt-3 text-sm font-medium text-theme-primary-600 dark:text-theme-primary-400 hover:text-theme-primary-700 dark:hover:text-theme-primary-300"
                >
                  Go to {step.title}
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
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div
    id="faq"
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
