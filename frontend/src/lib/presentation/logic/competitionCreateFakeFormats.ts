import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import { FORMAT_TYPE } from "$lib/core/entities/StatusConstants";

const ANY_TEAM_COUNT_FORMAT_TYPES: ReadonlySet<string> = new Set([
  FORMAT_TYPE.LEAGUE,
  FORMAT_TYPE.ROUND_ROBIN,
]);

export function select_fake_friendly_formats(
  formats: CompetitionFormat[],
): CompetitionFormat[] {
  const friendly = formats.filter((format) =>
    ANY_TEAM_COUNT_FORMAT_TYPES.has(String(format.format_type)),
  );
  return friendly.length > 0 ? friendly : formats;
}
