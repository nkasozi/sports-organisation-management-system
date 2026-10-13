import {
  GENDERED_RECORD_FIELD,
  read_text_field,
} from "./dynamicEntityFormGenderedRecords";
import { DYNAMIC_ENTITY_FORM_EVENT } from "./dynamicEntityFormMessages";
import { PRESENCE_STATUS } from "./presenceStatus";

export type ReadByIdUseCases = {
  get_by_id: (id: string) => Promise<{ success: boolean; data?: unknown }>;
};

export type UseCasesResult = {
  success: boolean;
  data?: ReadByIdUseCases;
};

type UseCasesState =
  | { status: typeof PRESENCE_STATUS.PRESENT; use_cases: ReadByIdUseCases }
  | { status: typeof PRESENCE_STATUS.MISSING };

type GenderedPairState =
  | { status: typeof PRESENCE_STATUS.PRESENT; first: unknown; second: unknown }
  | { status: typeof PRESENCE_STATUS.MISSING };

export function resolve_use_cases_state(result: UseCasesResult): UseCasesState {
  if (!result.success || !result.data)
    return { status: PRESENCE_STATUS.MISSING };
  return { status: PRESENCE_STATUS.PRESENT, use_cases: result.data };
}

export async function load_gendered_pair(
  first_loader: ReadByIdUseCases,
  first_id: string,
  second_loader: ReadByIdUseCases,
  second_id: string,
): Promise<GenderedPairState> {
  const [first_result, second_result] = await Promise.all([
    first_loader.get_by_id(first_id),
    second_loader.get_by_id(second_id),
  ]);
  if (!first_result.success || !second_result.success) {
    console.warn("[DynamicEntityForm] Gender check records unavailable", {
      event: DYNAMIC_ENTITY_FORM_EVENT.GENDER_CHECK_RECORDS_UNAVAILABLE,
      first_id,
      second_id,
    });
    return { status: PRESENCE_STATUS.MISSING };
  }
  return {
    status: PRESENCE_STATUS.PRESENT,
    first: first_result.data,
    second: second_result.data,
  };
}

export async function build_gender_name_map(
  gender_use_cases: ReadByIdUseCases,
  gender_ids: string[],
): Promise<Map<string, string>> {
  const gender_name_map = new Map<string, string>();
  for (const gender_id of [...new Set(gender_ids)]) {
    const gender_result = await gender_use_cases.get_by_id(gender_id);
    if (!gender_result.success) continue;
    const gender_name = read_text_field(
      gender_result.data,
      GENDERED_RECORD_FIELD.NAME,
    );
    if (gender_name) gender_name_map.set(gender_id, gender_name);
  }
  return gender_name_map;
}
