import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const INFO_LABEL_RADIUS_CLASS = "rounded-[0.175rem]";

const SOURCE_CONTRACTS = [
  {
    relative_path: "./calendar/CalendarPageControls.svelte",
    legacy_patterns: [
      /bg-accent-100 dark:bg-accent-800 rounded-lg/,
      /inline-flex items-center gap-1\.5 px-2 py-1 text-xs rounded-full/,
    ],
  },
  {
    relative_path: "./competition/CompetitionResultsHeader.svelte",
    legacy_patterns: [
      /bg-accent-100 dark:bg-accent-800 rounded-lg/,
      /bg-purple-100 text-purple-700 dark:bg-purple-900\/50 dark:text-purple-300 rounded-full/,
    ],
  },
  {
    relative_path: "./game/LiveGamesHeader.svelte",
    legacy_patterns: [/bg-accent-100 dark:bg-accent-800 rounded-lg/],
  },
  {
    relative_path: "./official/OfficialLeaderboardPageShell.svelte",
    legacy_patterns: [/rounded-md bg-accent-100 px-3 py-2 text-sm font-medium/],
  },
  {
    relative_path: "./settings/SettingsOrganizationBrandingSection.svelte",
    legacy_patterns: [
      /input text-xs py-1 px-2 rounded-full/,
      /px-3 py-1 rounded-full text-xs font-medium/,
    ],
  },
  {
    relative_path: "./competition/CompetitionEditHeader.svelte",
    legacy_patterns: [/rounded-full text-xs font-medium/],
  },
  {
    relative_path: "./competition/CompetitionScoringOverrides.svelte",
    legacy_patterns: [/rounded-full text-xs font-medium bg-primary-100/],
  },
  {
    relative_path: "./competition/SportRulesPeriodsSection.svelte",
    legacy_patterns: [/rounded-full text-xs font-medium bg-primary-100/],
  },
  {
    relative_path: "./competition/SportRulesOvertimeSection.svelte",
    legacy_patterns: [/rounded-full text-xs font-medium bg-primary-100/],
  },
  {
    relative_path: "./competition/SportRulesSubstitutionsSection.svelte",
    legacy_patterns: [/rounded-full text-xs font-medium bg-primary-100/],
  },
  {
    relative_path: "./competition/SportRulesSquadLimitsSection.svelte",
    legacy_patterns: [/rounded-full text-xs font-medium bg-primary-100/],
  },
  {
    relative_path: "./playerTeamMemberships/BulkPlayerAssignmentSection.svelte",
    legacy_patterns: [/rounded-full text-xs font-medium bg-violet-100/],
  },
  {
    relative_path: "./SyncStatusIndicatorDetails.svelte",
    legacy_patterns: [/px-2 py-0\.5 rounded-full text-xs font-medium/],
  },
  {
    relative_path: "./audit/AuditLogTable.svelte",
    legacy_patterns: [/px-2\.5 py-0\.5 rounded-full text-xs font-medium/],
  },
] as const;

function read_component_source(relative_path: string): string {
  return readFileSync(new URL(relative_path, import.meta.url), "utf8");
}

describe("info label radius source contract", () => {
  it("uses the shared 0.175rem radius for extra-info label surfaces", () => {
    for (const source_contract of SOURCE_CONTRACTS) {
      const source = read_component_source(source_contract.relative_path);

      expect(source).toContain(INFO_LABEL_RADIUS_CLASS);

      for (const legacy_pattern of source_contract.legacy_patterns) {
        expect(source).not.toMatch(legacy_pattern);
      }
    }
  });
});
