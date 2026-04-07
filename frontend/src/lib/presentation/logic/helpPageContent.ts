export interface HelpFaqItem {
  question: string;
  answer: string;
}

export interface HelpOverviewCard {
  title: string;
  description: string;
  href: string;
  icon_background_class: string;
  icon_class: string;
  icon_paths: string[];
}

function create_help_faq_item(question: string, answer: string): HelpFaqItem {
  return { question, answer };
}

function create_help_overview_card(
  title: string,
  description: string,
  href: string,
  icon_background_class: string,
  icon_class: string,
  icon_paths: string[],
): HelpOverviewCard {
  return {
    title,
    description,
    href,
    icon_background_class,
    icon_class,
    icon_paths,
  };
}

export const HELP_PAGE_BROWSER_TITLE = "Help - Sports Management";
export const HELP_PAGE_TITLE = "Help & Support";
export const HELP_PAGE_DESCRIPTION =
  "Complete guide to managing your sports organization from start to finish";
export const HELP_GUIDE_SECTION_ID = "step-by-step";
export const HELP_GUIDE_SECTION_TITLE = "Complete Setup Guide";
export const HELP_GUIDE_SECTION_DESCRIPTION =
  "Follow these steps to set up your sports organization, run competitions, and track results";
export const HELP_FAQ_SECTION_ID = "faq";
export const HELP_FAQ_SECTION_TITLE = "Frequently Asked Questions";
export const HELP_SUPPORT_TITLE = "Need more help?";
export const HELP_SUPPORT_DESCRIPTION =
  "If you can't find what you're looking for, please reach out to our support team. We're here to help you get the most out of the Sports Management System.";
export const HELP_SUPPORT_EMAIL = "mailto:support@sport-sync.com";
export const HELP_SUPPORT_LINK_LABEL = "Contact Support";

export const HELP_OVERVIEW_CARDS: HelpOverviewCard[] = [
  create_help_overview_card(
    "Step-by-Step Guide",
    "Complete step-by-step walkthrough from setup to results",
    "#step-by-step",
    "bg-primary-100 dark:bg-primary-900/30",
    "text-primary-600 dark:text-primary-400",
    [
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    ],
  ),
  create_help_overview_card(
    "FAQ",
    "Quick answers to common questions",
    "#faq",
    "bg-green-100 dark:bg-green-900/30",
    "text-green-600 dark:text-green-400",
    [
      "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    ],
  ),
  create_help_overview_card(
    "Settings",
    "Customize branding, colors, and preferences",
    "/settings",
    "bg-blue-100 dark:bg-blue-900/30",
    "text-blue-600 dark:text-blue-400",
    [
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    ],
  ),
];

export const HELP_FAQ_ITEMS: HelpFaqItem[] = [
  create_help_faq_item(
    "How do I create a new competition?",
    "Navigate to Competitions from the sidebar, then click 'Add Competition'. Fill in the required details like name, sport type, dates, and organization. Make sure you've created the sport first.",
  ),
  create_help_faq_item(
    "How do I add teams to a competition?",
    "First create the teams under the Teams section, then go to the competition's edit page and use the 'Teams' tab to add teams to that competition.",
  ),
  create_help_faq_item(
    "How do I schedule fixtures/games?",
    "Go to Fixtures from the sidebar and click 'Create Fixture'. Select the competition, home team, away team, date, time, and venue. You can create individual matches or bulk generate fixture schedules.",
  ),
  create_help_faq_item(
    "How do I manage live game scores?",
    "From the Fixtures list, click on any scheduled fixture to view its details, then click 'Manage Live Game'. You can start the game, record events like goals and cards, manage periods, and end the game when complete.",
  ),
  create_help_faq_item(
    "How do I add officials/referees?",
    "Navigate to Officials from the sidebar and click 'Add Official'. You can specify their role, certification level, and assign them to your organization. Then assign them to specific fixtures.",
  ),
  create_help_faq_item(
    "How do I set up player positions?",
    "Go to Player Positions and create the positions relevant to your sport (e.g., Goalkeeper, Defender, Midfielder, Forward for football). These are used when creating lineups for fixtures.",
  ),
  create_help_faq_item(
    "How do I create lineups for a match?",
    "Navigate to Fixture Lineups, select the fixture, and add players from each team's roster. Assign their positions and jersey numbers for that specific match.",
  ),
  create_help_faq_item(
    "Can I customize the theme colors?",
    "Yes! Go to Settings from the sidebar. You can toggle dark mode, and customize primary and secondary colors to match your organization's branding. You can also customize header/footer patterns.",
  ),
  create_help_faq_item(
    "What's the difference between Players and Player Team Memberships?",
    "Players are individual person records. Player Team Memberships link a player to a specific team with their jersey number and position. One player can have multiple memberships across different teams or seasons.",
  ),
  create_help_faq_item(
    "How do I track competition standings?",
    "Competition Results automatically calculates standings based on completed fixtures. Points are awarded for wins/draws, and the table shows goal difference, goals scored, and current rankings.",
  ),
];
