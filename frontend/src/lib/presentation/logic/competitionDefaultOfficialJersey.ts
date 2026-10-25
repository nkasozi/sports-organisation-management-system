import {
  type CreateJerseyColorInput,
  JERSEY_COLOR_HOLDER_TYPE,
  type JerseyColor,
} from "$lib/core/entities/JerseyColor";

const OFFICIAL_JERSEY_PAGE = { page_number: 1, page_size: 200 };
const STANDARD_KIT_PREFIX = "standard";
const DEFAULT_OFFICIAL_JERSEY_EVENT = {
  ASSIGNED: "competition_default_official_jersey_assigned",
  FAILED: "competition_default_official_jersey_failed",
} as const;

type JerseyListResult =
  | { success: true; data: { items: JerseyColor[] } }
  | { success: false; error: string };

export interface DefaultOfficialJerseyUseCases {
  list(
    filter: { holder_type: string },
    options: { page_number: number; page_size: number },
  ): Promise<JerseyListResult>;
  create(
    input: CreateJerseyColorInput,
  ): Promise<{ success: boolean; error?: string }>;
}

function is_standard_kit(jersey: JerseyColor): boolean {
  return String(jersey.nickname).toLowerCase().startsWith(STANDARD_KIT_PREFIX);
}

function order_default_candidates(jerseys: JerseyColor[]): JerseyColor[] {
  return [...jerseys].sort(
    (first, second) =>
      Number(is_standard_kit(second)) - Number(is_standard_kit(first)) ||
      String(first.created_at).localeCompare(String(second.created_at)) ||
      String(first.nickname).localeCompare(String(second.nickname)),
  );
}

function copy_for_competition(
  jersey: JerseyColor,
  competition_id: string,
): CreateJerseyColorInput {
  return {
    holder_type: JERSEY_COLOR_HOLDER_TYPE.COMPETITION_OFFICIAL,
    holder_id: competition_id,
    nickname: jersey.nickname,
    main_color: jersey.main_color,
    secondary_color: jersey.secondary_color,
    tertiary_color: jersey.tertiary_color,
    status: jersey.status,
  } as CreateJerseyColorInput;
}

export async function assign_default_official_jersey(
  competition_id: string,
  jersey_use_cases: DefaultOfficialJerseyUseCases,
): Promise<boolean> {
  const jerseys_result = await jersey_use_cases.list(
    { holder_type: JERSEY_COLOR_HOLDER_TYPE.COMPETITION_OFFICIAL },
    OFFICIAL_JERSEY_PAGE,
  );
  if (!jerseys_result.success) return false;
  const jerseys = jerseys_result.data.items;
  const [first_jersey] = order_default_candidates(jerseys);
  if (
    !first_jersey ||
    jerseys.some((jersey) => String(jersey.holder_id) === competition_id)
  )
    return false;
  const create_result = await jersey_use_cases.create(
    copy_for_competition(first_jersey, competition_id),
  );
  const event = create_result.success
    ? DEFAULT_OFFICIAL_JERSEY_EVENT.ASSIGNED
    : DEFAULT_OFFICIAL_JERSEY_EVENT.FAILED;
  console.info("[CompetitionCreate] Default official jersey", {
    event,
    competition_id,
  });
  return create_result.success;
}
