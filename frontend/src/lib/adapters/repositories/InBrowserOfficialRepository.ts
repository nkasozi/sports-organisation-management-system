import type { Table } from "dexie";
import type {
  Official,
  CreateOfficialInput,
  UpdateOfficialInput,
} from "../../core/entities/Official";
import { DEFAULT_OFFICIAL_AVATAR } from "../../core/entities/Official";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  OfficialRepository,
  OfficialFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "official";

export class InBrowserOfficialRepository
  extends InBrowserBaseRepository<
    Official,
    CreateOfficialInput,
    UpdateOfficialInput,
    OfficialFilter
  >
  implements OfficialRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<Official, string> {
    return this.database.officials;
  }

  protected create_entity_from_input(
    input: CreateOfficialInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): Official {
    return {
      id,
      ...timestamps,
      first_name: input.first_name,
      last_name: input.last_name,
      gender_id: input.gender_id,
      email: input.email,
      phone: input.phone,
      date_of_birth: input.date_of_birth,
      organization_id: input.organization_id,
      years_of_experience: input.years_of_experience,
      nationality: input.nationality,
      profile_image_url: input.profile_image_url || DEFAULT_OFFICIAL_AVATAR,
      emergency_contact_name: input.emergency_contact_name,
      emergency_contact_phone: input.emergency_contact_phone,
      notes: input.notes,
      status: input.status,
    };
  }

  protected apply_updates_to_entity(
    entity: Official,
    updates: UpdateOfficialInput,
  ): Official {
    return {
      ...entity,
      ...updates,
    };
  }

  protected apply_entity_filter(
    entities: Official[],
    filter: OfficialFilter,
  ): Official[] {
    let filtered_entities = entities;

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_entities = filtered_entities.filter((official) =>
        `${official.first_name} ${official.last_name}`
          .toLowerCase()
          .includes(search_term),
      );
    }

    if (filter.organization_id) {
      filtered_entities = filtered_entities.filter(
        (official) => official.organization_id === filter.organization_id,
      );
    }

    if (filter.status) {
      filtered_entities = filtered_entities.filter(
        (official) => official.status === filter.status,
      );
    }

    return filtered_entities;
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    return this.find_all({ organization_id }, options);
  }

  async find_active_officials(
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    return this.find_all({ status: "active" }, options);
  }

  async find_available_for_date(
    _date: string,
    organization_id?: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<Official> {
    const filter: OfficialFilter = { status: "active" };
    if (organization_id) {
      filter.organization_id = organization_id;
    }
    return this.find_all(filter, options);
  }
}

function create_default_officials(): Official[] {
  const now = new Date().toISOString();

  return [
    {
      id: "official_default_1",
      first_name: "James",
      last_name: "Mukasa",
      gender_id: "gender_default_male",
      email: "james.mukasa@ugandahockey.org",
      phone: "+256-700-111-222",
      date_of_birth: "1985-03-15",
      organization_id: "org_default_1",
      years_of_experience: 12,
      nationality: "Ugandan",
      profile_image_url: DEFAULT_OFFICIAL_AVATAR,
      emergency_contact_name: "Mary Mukasa",
      emergency_contact_phone: "+256-700-111-333",
      notes: "Senior referee with international certification",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "official_default_2",
      first_name: "Sarah",
      last_name: "Nakato",
      gender_id: "gender_default_female",
      email: "sarah.nakato@ugandahockey.org",
      phone: "+256-700-222-333",
      date_of_birth: "1990-07-22",
      organization_id: "org_default_1",
      years_of_experience: 8,
      nationality: "Ugandan",
      profile_image_url: DEFAULT_OFFICIAL_AVATAR,
      emergency_contact_name: "Peter Nakato",
      emergency_contact_phone: "+256-700-222-444",
      notes: "Technical official specializing in timekeeping",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    {
      id: "official_default_3",
      first_name: "David",
      last_name: "Ochieng",
      gender_id: "gender_default_male",
      email: "david.ochieng@ugandahockey.org",
      phone: "+256-700-333-444",
      date_of_birth: "1988-11-08",
      organization_id: "org_default_1",
      years_of_experience: 10,
      nationality: "Ugandan",
      profile_image_url: DEFAULT_OFFICIAL_AVATAR,
      emergency_contact_name: "Grace Ochieng",
      emergency_contact_phone: "+256-700-333-555",
      notes: "Umpire with East African certification",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserOfficialRepository | null = null;

export function get_official_repository(): OfficialRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserOfficialRepository();
  }
  return singleton_instance;
}

export async function reset_official_repository(): Promise<void> {
  const repository = get_official_repository() as InBrowserOfficialRepository;
  await repository.clear_all_data();
  await repository.seed_with_data(create_default_officials());
}
