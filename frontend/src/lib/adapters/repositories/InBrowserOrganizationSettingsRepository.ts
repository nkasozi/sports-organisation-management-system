import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  CreateOrganizationSettingsInput,
  OrganizationSettings,
  UpdateOrganizationSettingsInput,
} from "../../core/entities/OrganizationSettings";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  OrganizationSettingsFilter,
  OrganizationSettingsRepository,
} from "../../core/interfaces/ports/external/repositories/OrganizationSettingsRepository";
import type { AsyncResult } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "org_settings";

class InBrowserOrganizationSettingsRepository
  extends InBrowserBaseRepository<
    OrganizationSettings,
    CreateOrganizationSettingsInput,
    UpdateOrganizationSettingsInput,
    OrganizationSettingsFilter
  >
  implements OrganizationSettingsRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<OrganizationSettings, string> {
    return this.database.organization_settings;
  }

  protected create_entity_from_input(
    input: CreateOrganizationSettingsInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): OrganizationSettings {
    return {
      id,
      ...timestamps,
      organization_id: input.organization_id,
      display_name: input.display_name,
      logo_url: input.logo_url,
      tagline: input.tagline,
      contact_email: input.contact_email,
      contact_address: input.contact_address,
      social_media_links: input.social_media_links,
      header_pattern: input.header_pattern,
      footer_pattern: input.footer_pattern,
      background_pattern_url: input.background_pattern_url,
      show_panel_borders: input.show_panel_borders,
      primary_color: input.primary_color,
      secondary_color: input.secondary_color,
      sync_interval_ms: input.sync_interval_ms,
    };
  }

  protected apply_updates_to_entity(
    entity: OrganizationSettings,
    updates: UpdateOrganizationSettingsInput,
  ): OrganizationSettings {
    return { ...entity, ...updates };
  }

  protected apply_entity_filter(
    entities: OrganizationSettings[],
    filter: OrganizationSettingsFilter,
  ): OrganizationSettings[] {
    let filtered = entities;

    if (filter.organization_id) {
      filtered = filtered.filter(
        (settings) => settings.organization_id === filter.organization_id,
      );
    }

    return filtered;
  }

  async find_by_organization_id(
    organization_id: string,
    _options?: QueryOptions,
  ): AsyncResult<OrganizationSettings | null> {
    try {
      const all_settings = await this.get_table().toArray();
      const match = all_settings.find(
        (settings) => settings.organization_id === organization_id,
      );

      console.log("[OrgSettingsRepo] find_by_organization_id", {
        event: "org_settings_find_by_org_id",
        organization_id,
        found: !!match,
      });

      return create_success_result(match ?? null);
    } catch (error) {
      console.warn("[OrgSettingsRepository] Failed to find settings for org", {
        event: "repository_find_settings_for_org_failed",
        error: String(error),
      });
      const error_message =
        error instanceof Error ? error.message : "Unknown error";
      return create_failure_result(
        `Failed to find settings for org ${organization_id}: ${error_message}`,
      );
    }
  }
}

let repository_instance: InBrowserOrganizationSettingsRepository | null = null;

export function get_organization_settings_repository(): OrganizationSettingsRepository {
  if (!repository_instance) {
    repository_instance = new InBrowserOrganizationSettingsRepository();
  }
  return repository_instance;
}
