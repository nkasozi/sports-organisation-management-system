import type {
  EntityId,
  IsoDateString,
  Name,
  ScalarInput,
  ScalarValueInput,
} from "../types/DomainScalars";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "../types/Option";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import {
  check_condition,
  collect_validation_errors,
  is_blank_text,
} from "./EntityValidation";
import {
  count_local_calendar_days_between,
  is_local_calendar_date_before,
  parse_local_calendar_date,
} from "./LocalCalendarDate";
import { ENTITY_STATUS } from "./StatusConstants";

const QUALIFICATION_VALIDATION_MESSAGES = {
  HOLDER_TYPE_REQUIRED: "Holder type is required",
  HOLDER_ID_REQUIRED: "Holder ID is required",
  CERTIFICATION_NAME_REQUIRED: "Certification name is required",
  CERTIFICATION_LEVEL_REQUIRED: "Certification level is required",
  EXPIRY_NOT_AFTER_ISSUE: "Expiry date must be after issue date",
} as const;

export const QUALIFICATION_HOLDER_TYPE = {
  OFFICIAL: "official",
  TEAM_STAFF: "team_staff",
} as const;

export type QualificationHolderType =
  (typeof QUALIFICATION_HOLDER_TYPE)[keyof typeof QUALIFICATION_HOLDER_TYPE];

const CERTIFICATION_LEVEL = {
  TRAINEE: "trainee",
  LOCAL: "local",
  REGIONAL: "regional",
  NATIONAL: "national",
  INTERNATIONAL: "international",
  FIFA: "fifa",
  OTHER: "other",
} as const;

export type CertificationLevel =
  (typeof CERTIFICATION_LEVEL)[keyof typeof CERTIFICATION_LEVEL];

export interface Qualification extends BaseEntity {
  holder_type: QualificationHolderType;
  holder_id: EntityId;
  certification_name: Name;
  certification_level: CertificationLevel;
  certification_number: string;
  issuing_authority: string;
  issue_date: IsoDateString;
  expiry_date: IsoDateString;
  specializations: string[];
  notes: string;
  status: EntityStatus;
}

export type CreateQualificationInput = Omit<
  ScalarInput<Qualification>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateQualificationInput = Partial<CreateQualificationInput>;

const ISO_DATE_TIME_SEPARATOR = "T";

function to_iso_date(date: Date): string {
  return date.toISOString().split(ISO_DATE_TIME_SEPARATOR)[0];
}

export function create_empty_qualification_input(
  holder_type: QualificationHolderType,
  holder_id: CreateQualificationInput["holder_id"],
): CreateQualificationInput {
  const one_year_from_now = new Date();
  one_year_from_now.setFullYear(one_year_from_now.getFullYear() + 1);

  return {
    holder_type,
    holder_id,
    certification_name: "",
    certification_level: CERTIFICATION_LEVEL.LOCAL,
    certification_number: "",
    issuing_authority: "",
    issue_date: to_iso_date(new Date()),
    expiry_date: to_iso_date(one_year_from_now),
    specializations: [],
    notes: "",
    status: ENTITY_STATUS.ACTIVE,
  };
}

export function validate_qualification_input(
  input: CreateQualificationInput,
): string[] {
  const has_both_dates =
    Boolean(input.issue_date) && Boolean(input.expiry_date);
  return collect_validation_errors([
    check_condition(
      Boolean(input.holder_type),
      QUALIFICATION_VALIDATION_MESSAGES.HOLDER_TYPE_REQUIRED,
    ),
    check_condition(
      Boolean(input.holder_id),
      QUALIFICATION_VALIDATION_MESSAGES.HOLDER_ID_REQUIRED,
    ),
    check_condition(
      !is_blank_text(input.certification_name),
      QUALIFICATION_VALIDATION_MESSAGES.CERTIFICATION_NAME_REQUIRED,
    ),
    check_condition(
      Boolean(input.certification_level),
      QUALIFICATION_VALIDATION_MESSAGES.CERTIFICATION_LEVEL_REQUIRED,
    ),
    check_condition(
      !has_both_dates ||
        new Date(input.expiry_date) > new Date(input.issue_date),
      QUALIFICATION_VALIDATION_MESSAGES.EXPIRY_NOT_AFTER_ISSUE,
    ),
  ]);
}

export function is_qualification_expired(
  expiry_date: ScalarValueInput<Qualification["expiry_date"]>,
  reference_date: Date = new Date(),
): boolean {
  if (!expiry_date) {
    return false;
  }
  return is_local_calendar_date_before(String(expiry_date), reference_date);
}

export function get_days_until_expiry(
  expiry_date: ScalarValueInput<Qualification["expiry_date"]>,
  reference_date: Date = new Date(),
): Option<number> {
  if (!expiry_date) {
    return create_none_option();
  }
  const expiry = parse_local_calendar_date(String(expiry_date));
  if (expiry.status === OptionStatus.NONE) return create_none_option();
  return create_some_option(
    count_local_calendar_days_between(reference_date, expiry.value),
  );
}
