import { e as escape_html, a as ensure_array_like, f as attr_class, c as attr, s as stringify, m as maybe_selected, i as bind_props, p as pop, b as push } from "./index2.js";
import { f as fallback } from "./utils.js";
import { faker } from "@faker-js/faker";
class InMemoryUnifiedApiService {
  constructor() {
    this.entity_storage_map = /* @__PURE__ */ new Map();
    this.storage_key_prefix = "sports_unified_storage_";
  }
  load_entities_from_local_storage(entity_type) {
    if (typeof window === "undefined") {
      return /* @__PURE__ */ new Map();
    }
    const storage_key = `${this.storage_key_prefix}${entity_type}`;
    const stored_data = localStorage.getItem(storage_key);
    if (!stored_data) {
      return /* @__PURE__ */ new Map();
    }
    try {
      const parsed_data = JSON.parse(stored_data);
      const entity_map = /* @__PURE__ */ new Map();
      Object.entries(parsed_data).forEach(([id, entity]) => {
        entity_map.set(id, entity);
      });
      return entity_map;
    } catch (error) {
      console.warn(`Failed to parse stored data for ${entity_type}:`, error);
      return /* @__PURE__ */ new Map();
    }
  }
  save_entities_to_local_storage(entity_type, entities) {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      const storage_key = `${this.storage_key_prefix}${entity_type}`;
      const entities_object = Object.fromEntries(entities);
      localStorage.setItem(storage_key, JSON.stringify(entities_object));
      return true;
    } catch (error) {
      console.error(`Failed to save entities for ${entity_type}:`, error);
      return false;
    }
  }
  get_entity_storage_for_type(entity_type) {
    if (!this.entity_storage_map.has(entity_type)) {
      const loaded_entities = this.load_entities_from_local_storage(entity_type);
      this.entity_storage_map.set(entity_type, loaded_entities);
    }
    return this.entity_storage_map.get(entity_type);
  }
  async get_entity_by_id(entity_type, id) {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const found_entity = entities.get(id);
      if (!found_entity) {
        return {
          success: false,
          error_message: `Entity with id ${id} not found in ${entity_type}`,
          debug_info: `Searched in storage with ${entities.size} entities`
        };
      }
      return {
        success: true,
        data: found_entity,
        debug_info: `Successfully retrieved ${entity_type} with id ${id}`
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Failed to retrieve entity: ${error}`,
        debug_info: `Error occurred while getting ${entity_type} by id ${id}`
      };
    }
  }
  async get_all_entities(entity_type, filter_function) {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      let entities_array = Array.from(entities.values());
      if (filter_function) {
        entities_array = entities_array.filter(filter_function);
      }
      return {
        success: true,
        data: entities_array,
        total_count: entities_array.length,
        debug_info: `Retrieved ${entities_array.length} entities of type ${entity_type}`
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        total_count: 0,
        error_message: `Failed to retrieve entities: ${error}`,
        debug_info: `Error occurred while getting all ${entity_type} entities`
      };
    }
  }
  async create_entity(entity_type, entity_data) {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const entity_id = this.generate_unique_entity_id(entity_type);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const new_entity = {
        ...entity_data,
        id: entity_id,
        created_at: now,
        updated_at: now
      };
      entities.set(entity_id, new_entity);
      const save_success = this.save_entities_to_local_storage(
        entity_type,
        entities
      );
      if (!save_success) {
        return {
          success: false,
          error_message: "Failed to persist entity to storage",
          debug_info: `Entity created in memory but failed to save to localStorage for ${entity_type}`
        };
      }
      return {
        success: true,
        data: new_entity,
        debug_info: `Successfully created ${entity_type} with id ${entity_id}`
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Failed to create entity: ${error}`,
        debug_info: `Error occurred while creating ${entity_type}`
      };
    }
  }
  async update_entity(entity_type, id, updates) {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const existing_entity = entities.get(id);
      if (!existing_entity) {
        return {
          success: false,
          error_message: `Entity with id ${id} not found for update`,
          debug_info: `Attempted to update non-existent ${entity_type} with id ${id}`
        };
      }
      const updated_entity = {
        ...existing_entity,
        ...updates,
        id,
        // Ensure ID doesn't change
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      entities.set(id, updated_entity);
      const save_success = this.save_entities_to_local_storage(
        entity_type,
        entities
      );
      if (!save_success) {
        return {
          success: false,
          error_message: "Failed to persist updated entity to storage",
          debug_info: `Entity updated in memory but failed to save to localStorage for ${entity_type}`
        };
      }
      return {
        success: true,
        data: updated_entity,
        debug_info: `Successfully updated ${entity_type} with id ${id}`
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Failed to update entity: ${error}`,
        debug_info: `Error occurred while updating ${entity_type} with id ${id}`
      };
    }
  }
  async delete_entity(entity_type, id) {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const entity_existed = entities.has(id);
      if (!entity_existed) {
        return {
          success: false,
          error_message: `Entity with id ${id} not found for deletion`,
          debug_info: `Attempted to delete non-existent ${entity_type} with id ${id}`
        };
      }
      entities.delete(id);
      const save_success = this.save_entities_to_local_storage(
        entity_type,
        entities
      );
      if (!save_success) {
        return {
          success: false,
          error_message: "Failed to persist deletion to storage",
          debug_info: `Entity deleted from memory but failed to save to localStorage for ${entity_type}`
        };
      }
      return {
        success: true,
        data: true,
        debug_info: `Successfully deleted ${entity_type} with id ${id}`
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Failed to delete entity: ${error}`,
        debug_info: `Error occurred while deleting ${entity_type} with id ${id}`
      };
    }
  }
  async delete_multiple_entities(entity_type, ids) {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      let deleted_count = 0;
      for (const id of ids) {
        if (entities.has(id)) {
          entities.delete(id);
          deleted_count++;
        }
      }
      const save_success = this.save_entities_to_local_storage(
        entity_type,
        entities
      );
      if (!save_success) {
        return {
          success: false,
          error_message: "Failed to persist bulk deletion to storage",
          debug_info: `${deleted_count} entities deleted from memory but failed to save to localStorage`
        };
      }
      return {
        success: true,
        data: true,
        debug_info: `Successfully deleted ${deleted_count} out of ${ids.length} requested ${entity_type} entities`
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Failed to delete multiple entities: ${error}`,
        debug_info: `Error occurred while bulk deleting ${entity_type} entities`
      };
    }
  }
  generate_unique_entity_id(entity_type) {
    const timestamp = Date.now();
    const random_part = Math.random().toString(36).substring(2, 15);
    return `${entity_type}-${timestamp}-${random_part}`;
  }
}
const unifiedApiService = new InMemoryUnifiedApiService();
class EntityMetadataRegistry {
  constructor() {
    this.metadata_map = /* @__PURE__ */ new Map();
    this.initialize_all_entity_metadata();
  }
  get_entity_metadata(entity_type) {
    return this.metadata_map.get(entity_type) || null;
  }
  get_all_entity_types() {
    return Array.from(this.metadata_map.keys());
  }
  get_entities_with_foreign_key_to(target_entity_type) {
    const related_entities = [];
    for (const [entity_type, metadata] of this.metadata_map) {
      const has_foreign_key = metadata.fields.some(
        (field) => field.field_type === "foreign_key" && field.foreign_key_entity === target_entity_type
      );
      if (has_foreign_key) {
        related_entities.push(entity_type);
      }
    }
    return related_entities;
  }
  initialize_all_entity_metadata() {
    this.register_organization_metadata();
    this.register_competition_metadata();
    this.register_competition_constraint_metadata();
    this.register_team_metadata();
    this.register_player_metadata();
    this.register_official_metadata();
    this.register_game_metadata();
  }
  register_organization_metadata() {
    this.metadata_map.set("organization", {
      entity_name: "organization",
      display_name: "Organization",
      fields: [
        {
          field_name: "name",
          display_name: "Organization Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 2,
              error_message: "Name must be at least 2 characters"
            }
          ]
        },
        {
          field_name: "description",
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "sport_type",
          display_name: "Sport Type",
          field_type: "string",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "founded_date",
          display_name: "Founded Date",
          field_type: "date",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "contact_email",
          display_name: "Contact Email",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "pattern",
              rule_value: "^[^@]+@[^@]+\\.[^@]+$",
              error_message: "Must be a valid email"
            }
          ]
        },
        {
          field_name: "contact_phone",
          display_name: "Contact Phone",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "address",
          display_name: "Address",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "website",
          display_name: "Website",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "status",
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive", "suspended"]
        }
      ]
    });
  }
  register_competition_metadata() {
    this.metadata_map.set("competition", {
      entity_name: "competition",
      display_name: "Competition",
      fields: [
        {
          field_name: "name",
          display_name: "Competition Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 2,
              error_message: "Name must be at least 2 characters"
            }
          ]
        },
        {
          field_name: "description",
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "organization_id",
          display_name: "Organization",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "organization"
        },
        {
          field_name: "start_date",
          display_name: "Start Date",
          field_type: "date",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "end_date",
          display_name: "End Date",
          field_type: "date",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "sport_type",
          display_name: "Sport Type",
          field_type: "string",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "status",
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["upcoming", "active", "completed", "cancelled"]
        },
        {
          field_name: "max_teams",
          display_name: "Maximum Teams",
          field_type: "number",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 2,
              error_message: "Must allow at least 2 teams"
            }
          ]
        },
        {
          field_name: "registration_deadline",
          display_name: "Registration Deadline",
          field_type: "date",
          is_required: true,
          is_read_only: false
        }
      ]
    });
  }
  register_competition_constraint_metadata() {
    this.metadata_map.set("competition_constraint", {
      entity_name: "competition_constraint",
      display_name: "Competition Constraint",
      fields: [
        {
          field_name: "competition_id",
          display_name: "Competition",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "competition"
        },
        {
          field_name: "constraint_type",
          display_name: "Constraint Type",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["game", "player", "team", "match"]
        },
        {
          field_name: "name",
          display_name: "Constraint Name",
          field_type: "string",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "description",
          display_name: "Description",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "value_type",
          display_name: "Value Type",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["number", "string", "boolean"]
        },
        {
          field_name: "value",
          display_name: "Value",
          field_type: "string",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "is_mandatory",
          display_name: "Is Mandatory",
          field_type: "boolean",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "applies_to",
          display_name: "Applies To",
          field_type: "string",
          is_required: true,
          is_read_only: false
        }
      ]
    });
  }
  register_team_metadata() {
    this.metadata_map.set("team", {
      entity_name: "team",
      display_name: "Team",
      fields: [
        {
          field_name: "name",
          display_name: "Team Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 2,
              error_message: "Name must be at least 2 characters"
            }
          ]
        },
        {
          field_name: "competition_id",
          display_name: "Competition",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "competition"
        },
        {
          field_name: "coach_name",
          display_name: "Coach Name",
          field_type: "string",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "coach_email",
          display_name: "Coach Email",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "pattern",
              rule_value: "^[^@]+@[^@]+\\.[^@]+$",
              error_message: "Must be a valid email"
            }
          ]
        },
        {
          field_name: "established_year",
          display_name: "Established Year",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 1800,
              error_message: "Year must be realistic"
            }
          ]
        },
        {
          field_name: "home_ground",
          display_name: "Home Ground",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "team_color",
          display_name: "Team Color",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "logo_url",
          display_name: "Logo URL",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "status",
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive", "disqualified"]
        }
      ]
    });
  }
  register_player_metadata() {
    this.metadata_map.set("player", {
      entity_name: "player",
      display_name: "Player",
      fields: [
        {
          field_name: "first_name",
          display_name: "First Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 1,
              error_message: "First name is required"
            }
          ]
        },
        {
          field_name: "last_name",
          display_name: "Last Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 1,
              error_message: "Last name is required"
            }
          ]
        },
        {
          field_name: "team_id",
          display_name: "Team",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "team"
        },
        {
          field_name: "position",
          display_name: "Position",
          field_type: "string",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "jersey_number",
          display_name: "Jersey Number",
          field_type: "number",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 1,
              error_message: "Jersey number must be positive"
            },
            {
              rule_type: "max_value",
              rule_value: 99,
              error_message: "Jersey number must be under 100"
            }
          ]
        },
        {
          field_name: "date_of_birth",
          display_name: "Date of Birth",
          field_type: "date",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "email",
          display_name: "Email",
          field_type: "string",
          is_required: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "pattern",
              rule_value: "^[^@]+@[^@]+\\.[^@]+$",
              error_message: "Must be a valid email"
            }
          ]
        },
        {
          field_name: "phone",
          display_name: "Phone",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "address",
          display_name: "Address",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "emergency_contact",
          display_name: "Emergency Contact",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "status",
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive", "injured", "suspended"]
        }
      ]
    });
  }
  register_official_metadata() {
    this.metadata_map.set("official", {
      entity_name: "official",
      display_name: "Official",
      fields: [
        {
          field_name: "first_name",
          display_name: "First Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 1,
              error_message: "First name is required"
            }
          ]
        },
        {
          field_name: "last_name",
          display_name: "Last Name",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_length",
              rule_value: 1,
              error_message: "Last name is required"
            }
          ]
        },
        {
          field_name: "email",
          display_name: "Email",
          field_type: "string",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "pattern",
              rule_value: "^[^@]+@[^@]+\\.[^@]+$",
              error_message: "Must be a valid email"
            }
          ]
        },
        {
          field_name: "phone",
          display_name: "Phone",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "official_type",
          display_name: "Official Type",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: [
            "referee",
            "umpire",
            "assistant_referee",
            "judge",
            "timekeeper",
            "scorekeeper",
            "linesman"
          ]
        },
        {
          field_name: "certification_level",
          display_name: "Certification Level",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["junior", "senior", "expert", "international"]
        },
        {
          field_name: "years_experience",
          display_name: "Years Experience",
          field_type: "number",
          is_required: true,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 0,
              error_message: "Experience cannot be negative"
            }
          ]
        },
        {
          field_name: "specialization",
          display_name: "Specialization",
          field_type: "string",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "availability_status",
          display_name: "Availability Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["available", "unavailable", "busy"]
        },
        {
          field_name: "rating",
          display_name: "Rating",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 1,
              error_message: "Rating must be at least 1"
            },
            {
              rule_type: "max_value",
              rule_value: 5,
              error_message: "Rating cannot exceed 5"
            }
          ]
        },
        {
          field_name: "emergency_contact",
          display_name: "Emergency Contact",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "address",
          display_name: "Address",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "date_of_birth",
          display_name: "Date of Birth",
          field_type: "date",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "certification_expiry",
          display_name: "Certification Expiry",
          field_type: "date",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "status",
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: ["active", "inactive", "retired"]
        }
      ]
    });
  }
  register_game_metadata() {
    this.metadata_map.set("game", {
      entity_name: "game",
      display_name: "Game",
      fields: [
        {
          field_name: "competition_id",
          display_name: "Competition",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "competition"
        },
        {
          field_name: "home_team_id",
          display_name: "Home Team",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "team"
        },
        {
          field_name: "away_team_id",
          display_name: "Away Team",
          field_type: "foreign_key",
          is_required: true,
          is_read_only: false,
          foreign_key_entity: "team"
        },
        {
          field_name: "scheduled_date",
          display_name: "Scheduled Date",
          field_type: "date",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "scheduled_time",
          display_name: "Scheduled Time",
          field_type: "string",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "venue",
          display_name: "Venue",
          field_type: "string",
          is_required: true,
          is_read_only: false
        },
        {
          field_name: "status",
          display_name: "Status",
          field_type: "enum",
          is_required: true,
          is_read_only: false,
          enum_values: [
            "scheduled",
            "in_progress",
            "paused",
            "completed",
            "cancelled",
            "postponed"
          ]
        },
        {
          field_name: "home_team_score",
          display_name: "Home Team Score",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 0,
              error_message: "Score cannot be negative"
            }
          ]
        },
        {
          field_name: "away_team_score",
          display_name: "Away Team Score",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 0,
              error_message: "Score cannot be negative"
            }
          ]
        },
        {
          field_name: "duration_minutes",
          display_name: "Duration (Minutes)",
          field_type: "number",
          is_required: false,
          is_read_only: false,
          validation_rules: [
            {
              rule_type: "min_value",
              rule_value: 0,
              error_message: "Duration cannot be negative"
            }
          ]
        },
        {
          field_name: "actual_start_time",
          display_name: "Actual Start Time",
          field_type: "string",
          is_required: false,
          is_read_only: false
        },
        {
          field_name: "actual_end_time",
          display_name: "Actual End Time",
          field_type: "string",
          is_required: false,
          is_read_only: false
        }
      ]
    });
  }
}
const entityMetadataRegistry = new EntityMetadataRegistry();
class FakeDataGeneratorService {
  constructor(config = {}) {
    this.config = {
      locale: "en",
      seed: void 0,
      enable_fake_data_generation: true,
      ...config
    };
    if (this.config.seed) {
      faker.seed(this.config.seed);
    }
  }
  generate_fake_data_for_entity_fields(fields) {
    if (!this.config.enable_fake_data_generation) {
      return {
        success: false,
        generated_data: {},
        error_message: "Fake data generation is disabled",
        debug_info: "Check enable_fake_data_generation config setting"
      };
    }
    try {
      const generated_data = {};
      for (const field of fields) {
        if (field.is_read_only || field.field_name === "id" || field.field_name === "created_at" || field.field_name === "updated_at") {
          continue;
        }
        const fake_value = this.generate_fake_value_for_field(field);
        generated_data[field.field_name] = fake_value;
      }
      return {
        success: true,
        generated_data,
        debug_info: `Generated fake data for ${Object.keys(generated_data).length} fields`
      };
    } catch (error) {
      return {
        success: false,
        generated_data: {},
        error_message: `Failed to generate fake data: ${error}`,
        debug_info: "Error occurred during fake data generation process"
      };
    }
  }
  generate_fake_value_for_field(field) {
    if (field.field_type === "enum" && field.enum_values && field.enum_values.length > 0) {
      return faker.helpers.arrayElement(field.enum_values);
    }
    if (field.field_type === "foreign_key") {
      return "";
    }
    const field_name_lower = field.field_name.toLowerCase();
    if (field.field_type === "string") {
      return this.generate_fake_string_value(
        field_name_lower,
        field.display_name
      );
    }
    if (field.field_type === "number") {
      return this.generate_fake_number_value(field_name_lower);
    }
    if (field.field_type === "boolean") {
      return faker.datatype.boolean();
    }
    if (field.field_type === "date") {
      return this.generate_fake_date_value(field_name_lower);
    }
    return "";
  }
  generate_fake_string_value(field_name, display_name) {
    if (field_name.includes("email")) {
      return faker.internet.email();
    }
    if (field_name.includes("phone") || field_name.includes("contact")) {
      return faker.phone.number();
    }
    if (field_name.includes("first_name") || field_name.includes("firstname")) {
      return faker.person.firstName();
    }
    if (field_name.includes("last_name") || field_name.includes("lastname")) {
      return faker.person.lastName();
    }
    if (field_name.includes("name") && !field_name.includes("user") && !field_name.includes("file")) {
      return faker.company.name();
    }
    if (field_name.includes("address")) {
      return faker.location.streetAddress();
    }
    if (field_name.includes("website") || field_name.includes("url")) {
      return faker.internet.url();
    }
    if (field_name.includes("description") || field_name.includes("desc")) {
      return faker.lorem.sentences(2);
    }
    if (field_name.includes("title")) {
      return faker.lorem.words(3);
    }
    if (field_name.includes("position")) {
      return faker.person.jobTitle();
    }
    if (field_name.includes("venue") || field_name.includes("location")) {
      return faker.location.city() + " Stadium";
    }
    if (field_name.includes("coach")) {
      return faker.person.fullName();
    }
    if (field_name.includes("sport")) {
      return faker.helpers.arrayElement([
        "Football",
        "Basketball",
        "Tennis",
        "Soccer",
        "Baseball",
        "Hockey"
      ]);
    }
    if (field_name.includes("color")) {
      return faker.internet.color();
    }
    if (field_name.includes("specialization")) {
      return faker.helpers.arrayElement([
        "Football",
        "Basketball",
        "Tennis",
        "Soccer",
        "Baseball"
      ]);
    }
    if (field_name.includes("emergency")) {
      return faker.person.fullName() + " - " + faker.phone.number();
    }
    return faker.lorem.words(2);
  }
  generate_fake_number_value(field_name) {
    if (field_name.includes("year")) {
      return faker.date.between({ from: "1950-01-01", to: "2024-12-31" }).getFullYear();
    }
    if (field_name.includes("age")) {
      return faker.number.int({ min: 18, max: 65 });
    }
    if (field_name.includes("experience")) {
      return faker.number.int({ min: 0, max: 30 });
    }
    if (field_name.includes("score")) {
      return faker.number.int({ min: 0, max: 10 });
    }
    if (field_name.includes("jersey")) {
      return faker.number.int({ min: 1, max: 99 });
    }
    if (field_name.includes("rating")) {
      return faker.number.int({ min: 1, max: 5 });
    }
    if (field_name.includes("max_teams")) {
      return faker.number.int({ min: 4, max: 32 });
    }
    if (field_name.includes("duration")) {
      return faker.number.int({ min: 60, max: 120 });
    }
    return faker.number.int({ min: 1, max: 100 });
  }
  generate_fake_date_value(field_name) {
    if (field_name.includes("birth")) {
      return faker.date.between({ from: "1970-01-01", to: "2005-12-31" }).toISOString().split("T")[0];
    }
    if (field_name.includes("founded")) {
      return faker.date.between({ from: "1900-01-01", to: "2020-12-31" }).toISOString().split("T")[0];
    }
    if (field_name.includes("start")) {
      return faker.date.future().toISOString().split("T")[0];
    }
    if (field_name.includes("end")) {
      return faker.date.future({ years: 1 }).toISOString().split("T")[0];
    }
    if (field_name.includes("expiry")) {
      return faker.date.future({ years: 2 }).toISOString().split("T")[0];
    }
    if (field_name.includes("registration") || field_name.includes("deadline")) {
      return faker.date.future({ years: 0.08 }).toISOString().split("T")[0];
    }
    if (field_name.includes("scheduled")) {
      return faker.date.future({ years: 0.2 }).toISOString().split("T")[0];
    }
    return faker.date.future().toISOString().split("T")[0];
  }
  // Public method to update configuration
  update_config(new_config) {
    this.config = { ...this.config, ...new_config };
    if (new_config.seed !== void 0) {
      faker.seed(new_config.seed);
    }
  }
  // Public method to check if fake data generation is enabled
  is_fake_data_generation_enabled() {
    return this.config.enable_fake_data_generation === true;
  }
}
const fakeDataGenerator = new FakeDataGeneratorService({
  enable_fake_data_generation: true,
  locale: "en"
});
function DynamicEntityForm($$payload, $$props) {
  push();
  let entity_metadata, is_edit_mode, form_title;
  let entity_type = $$props["entity_type"];
  let entity_data = fallback($$props["entity_data"], null);
  let is_mobile_view = fallback($$props["is_mobile_view"], true);
  let show_fake_data_button = fallback($$props["show_fake_data_button"], true);
  let form_data = {};
  let validation_errors = {};
  let is_loading = false;
  let is_save_in_progress = false;
  let foreign_key_options = {};
  function get_entity_metadata_for_type(type) {
    const metadata = entityMetadataRegistry.get_entity_metadata(type);
    if (!metadata) {
      console.error(`No metadata found for entity type: ${type}`);
    }
    return metadata;
  }
  function determine_if_edit_mode(data) {
    return data !== null && data.id !== void 0;
  }
  function build_form_title(display_name, edit_mode) {
    const action = edit_mode ? "Edit" : "Create";
    return `${action} ${display_name}`;
  }
  function initialize_form_data_for_entity(metadata, existing_data) {
    const new_form_data = {};
    for (const field of metadata.fields) {
      if (existing_data && existing_data[field.field_name] !== void 0) {
        new_form_data[field.field_name] = existing_data[field.field_name];
      } else {
        new_form_data[field.field_name] = get_default_value_for_field_type(field);
      }
    }
    form_data = new_form_data;
    validation_errors = {};
  }
  function get_default_value_for_field_type(field) {
    if (field.field_type === "string") return "";
    if (field.field_type === "number") return 0;
    if (field.field_type === "boolean") return false;
    if (field.field_type === "date") return "";
    if (field.field_type === "enum" && field.enum_values && field.enum_values.length > 0) return field.enum_values[0];
    if (field.field_type === "foreign_key") return "";
    return "";
  }
  async function load_foreign_key_options_for_all_fields(fields) {
    is_loading = true;
    const new_options = {};
    for (const field of fields) {
      if (field.field_type === "foreign_key" && field.foreign_key_entity) {
        const options_result = await load_foreign_key_options_for_field(field.foreign_key_entity);
        if (options_result.success) {
          new_options[field.field_name] = options_result.data;
        }
      }
    }
    foreign_key_options = new_options;
    is_loading = false;
  }
  async function load_foreign_key_options_for_field(foreign_entity_type) {
    try {
      const result = await unifiedApiService.get_all_entities(foreign_entity_type);
      if (result.success) {
        return { success: true, data: result.data };
      }
      console.warn(`Failed to load options for ${foreign_entity_type}:`, result.error_message);
      return { success: false, data: [] };
    } catch (error) {
      console.error(`Error loading foreign key options for ${foreign_entity_type}:`, error);
      return { success: false, data: [] };
    }
  }
  function should_show_fake_data_button() {
    return show_fake_data_button && !is_edit_mode && fakeDataGenerator.is_fake_data_generation_enabled();
  }
  function get_display_value_for_foreign_key(field_name, value) {
    const options = foreign_key_options[field_name] || [];
    const found_option = options.find((option) => option.id === value);
    if (found_option) {
      return found_option.name || found_option.id;
    }
    return value;
  }
  entity_metadata = get_entity_metadata_for_type(entity_type);
  is_edit_mode = determine_if_edit_mode(entity_data);
  form_title = build_form_title(entity_metadata?.display_name || "", is_edit_mode);
  {
    if (entity_metadata) {
      initialize_form_data_for_entity(entity_metadata, entity_data);
      load_foreign_key_options_for_all_fields(entity_metadata.fields);
    }
  }
  $$payload.out.push(`<div class="w-full max-w-4xl mx-auto px-2 sm:px-0">`);
  if (!entity_metadata) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="alert bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 p-4 rounded-lg"><p>Error: No metadata found for entity type "${escape_html(entity_type)}"</p></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    const each_array = ensure_array_like(entity_metadata.fields);
    $$payload.out.push(`<div class="card p-4 sm:p-6 space-y-4 sm:space-y-6"><div class="border-b border-gray-200 dark:border-gray-700 pb-4"><h2 class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100">${escape_html(form_title)}</h2> `);
    if (is_loading) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<p class="text-sm text-accent-600 dark:text-accent-400">Loading form options...</p>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <form class="space-y-4"><div${attr_class(`grid grid-cols-1 ${stringify(is_mobile_view ? "gap-4" : "sm:grid-cols-2 gap-4 sm:gap-6")}`)}><!--[-->`);
    for (let $$index_2 = 0, $$length = each_array.length; $$index_2 < $$length; $$index_2++) {
      let field = each_array[$$index_2];
      $$payload.out.push(`<div${attr_class(`space-y-2 ${stringify(field.field_type === "string" && field.field_name.includes("description") ? "sm:col-span-2" : "")}`)}><label class="label"${attr("for", `field_${field.field_name}`)}>${escape_html(field.display_name)} `);
      if (field.is_required) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="text-red-500 dark:text-red-400">*</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></label> `);
      if (field.field_type === "string") {
        $$payload.out.push("<!--[-->");
        if (field.field_name.includes("description") || field.field_name.includes("address")) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<textarea${attr("id", `field_${field.field_name}`)} class="input"${attr("readonly", field.is_read_only, true)} rows="3">`);
          const $$body = escape_html(form_data[field.field_name]);
          if ($$body) {
            $$payload.out.push(`${$$body}`);
          }
          $$payload.out.push(`</textarea>`);
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<input${attr("id", `field_${field.field_name}`)} type="text" class="input"${attr("value", form_data[field.field_name])}${attr("readonly", field.is_read_only, true)}/>`);
        }
        $$payload.out.push(`<!--]-->`);
      } else {
        $$payload.out.push("<!--[!-->");
        if (field.field_type === "number") {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<input${attr("id", `field_${field.field_name}`)} type="number" class="input"${attr("value", form_data[field.field_name])}${attr("readonly", field.is_read_only, true)}/>`);
        } else {
          $$payload.out.push("<!--[!-->");
          if (field.field_type === "boolean") {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<div class="flex items-center space-x-2"><input${attr("id", `field_${field.field_name}`)} type="checkbox" class="w-4 h-4 text-accent-600 dark:text-accent-400 border-gray-300 dark:border-gray-600 rounded focus:ring-accent-500 dark:focus:ring-accent-400"${attr("checked", form_data[field.field_name], true)}${attr("disabled", field.is_read_only, true)}/> <span class="text-sm text-accent-700 dark:text-accent-300">Yes</span></div>`);
          } else {
            $$payload.out.push("<!--[!-->");
            if (field.field_type === "date") {
              $$payload.out.push("<!--[-->");
              $$payload.out.push(`<input${attr("id", `field_${field.field_name}`)} type="date" class="input"${attr("value", form_data[field.field_name])}${attr("readonly", field.is_read_only, true)}/>`);
            } else {
              $$payload.out.push("<!--[!-->");
              if (field.field_type === "enum" && field.enum_values) {
                $$payload.out.push("<!--[-->");
                const each_array_1 = ensure_array_like(field.enum_values);
                $$payload.out.push(`<select${attr("id", `field_${field.field_name}`)} class="input"${attr("disabled", field.is_read_only, true)}>`);
                $$payload.select_value = form_data[field.field_name];
                $$payload.out.push(`<!--[-->`);
                for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                  let option = each_array_1[$$index];
                  $$payload.out.push(`<option${attr("value", option)}${maybe_selected($$payload, option)}>${escape_html(option)}</option>`);
                }
                $$payload.out.push(`<!--]-->`);
                $$payload.select_value = void 0;
                $$payload.out.push(`</select>`);
              } else {
                $$payload.out.push("<!--[!-->");
                if (field.field_type === "foreign_key") {
                  $$payload.out.push("<!--[-->");
                  const each_array_2 = ensure_array_like(foreign_key_options[field.field_name] || []);
                  $$payload.out.push(`<select${attr("id", `field_${field.field_name}`)} class="input"${attr("disabled", field.is_read_only, true)}>`);
                  $$payload.select_value = form_data[field.field_name];
                  $$payload.out.push(`<option value=""${maybe_selected($$payload, "")}>Select ${escape_html(field.display_name)}</option><!--[-->`);
                  for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
                    let option = each_array_2[$$index_1];
                    $$payload.out.push(`<option${attr("value", option.id)}${maybe_selected($$payload, option.id)}>${escape_html(get_display_value_for_foreign_key(field.field_name, option.id))}</option>`);
                  }
                  $$payload.out.push(`<!--]-->`);
                  $$payload.select_value = void 0;
                  $$payload.out.push(`</select>`);
                } else {
                  $$payload.out.push("<!--[!-->");
                }
                $$payload.out.push(`<!--]-->`);
              }
              $$payload.out.push(`<!--]-->`);
            }
            $$payload.out.push(`<!--]-->`);
          }
          $$payload.out.push(`<!--]-->`);
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]--> `);
      if (validation_errors[field.field_name]) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<p class="mt-1 text-sm text-red-600 dark:text-red-300">${escape_html(validation_errors[field.field_name])}</p>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    }
    $$payload.out.push(`<!--]--></div> <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">`);
    if (should_show_fake_data_button()) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<button type="button" class="btn btn-ghost w-full sm:w-auto order-1 sm:order-1 flex items-center justify-center gap-2"${attr("disabled", is_save_in_progress, true)} title="Generate realistic fake data for testing"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg> <span class="hidden sm:inline">Fill with Fake Data</span> <span class="sm:hidden">Fake Data</span></button>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <button type="button" class="btn btn-outline w-full sm:w-auto order-2 sm:order-2"${attr("disabled", is_save_in_progress, true)}>Cancel</button> <button type="submit" class="btn btn-secondary w-full sm:w-auto order-3 sm:order-3"${attr("disabled", is_loading, true)}>`);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`${escape_html(is_edit_mode ? "Update" : "Create")}
              ${escape_html(entity_metadata.display_name)}`);
    }
    $$payload.out.push(`<!--]--></button></div></form></div>`);
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, {
    entity_type,
    entity_data,
    is_mobile_view,
    show_fake_data_button
  });
  pop();
}
function DynamicEntityList($$payload, $$props) {
  push();
  let entity_metadata, display_name, all_selected, some_selected, can_show_bulk_actions;
  let entity_type = $$props["entity_type"];
  let show_actions = fallback($$props["show_actions"], true);
  let is_mobile_view = fallback($$props["is_mobile_view"], true);
  let entities = [];
  let selected_entity_ids = /* @__PURE__ */ new Set();
  let is_deleting = false;
  function get_entity_metadata_for_type(type) {
    const metadata = entityMetadataRegistry.get_entity_metadata(type);
    if (!metadata) {
      console.error(`No metadata found for entity type: ${type}`);
    }
    return metadata;
  }
  function check_if_all_entities_selected(entity_list, selected_ids) {
    if (entity_list.length === 0) return false;
    return entity_list.every((entity) => selected_ids.has(entity.id));
  }
  function check_if_some_entities_selected(selected_ids) {
    return selected_ids.size > 0;
  }
  function determine_if_bulk_actions_available(has_selection, actions_enabled) {
    return has_selection && actions_enabled;
  }
  function get_selected_entities_list() {
    return entities.filter((entity) => selected_entity_ids.has(entity.id));
  }
  function dispatch_selection_changed() {
    get_selected_entities_list();
  }
  function get_display_value_for_entity_field(entity, field_name) {
    const value = entity[field_name];
    if (value === null || value === void 0) return "";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  }
  function get_primary_display_fields() {
    if (!entity_metadata) return ["id"];
    const name_fields = entity_metadata.fields.filter((f) => f.field_name.includes("name") || f.field_name === "title");
    const status_fields = entity_metadata.fields.filter((f) => f.field_name === "status" || f.field_name.includes("status"));
    const display_fields = [...name_fields, ...status_fields.slice(0, 1)].slice(0, is_mobile_view ? 2 : 4).map((f) => f.field_name);
    return display_fields.length > 0 ? display_fields : ["id"];
  }
  function get_current_selected_entities() {
    return get_selected_entities_list();
  }
  function clear_all_selections() {
    selected_entity_ids.clear();
    selected_entity_ids = selected_entity_ids;
    dispatch_selection_changed();
  }
  function get_selected_entity_count() {
    return selected_entity_ids.size;
  }
  entity_metadata = get_entity_metadata_for_type(entity_type);
  display_name = entity_metadata?.display_name || entity_type;
  all_selected = check_if_all_entities_selected(entities, selected_entity_ids);
  some_selected = check_if_some_entities_selected(selected_entity_ids);
  can_show_bulk_actions = determine_if_bulk_actions_available(some_selected, show_actions);
  $$payload.out.push(`<div class="w-full max-w-6xl mx-auto px-2 sm:px-0">`);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="card p-4 sm:p-6 space-y-4 sm:space-y-6"><div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4"><div><h2 class="text-lg sm:text-xl font-semibold text-accent-900 dark:text-accent-100">${escape_html(display_name)} List</h2> <p class="text-sm text-accent-600 dark:text-accent-400">${escape_html(entities.length)}
          ${escape_html(entities.length === 1 ? "item" : "items")}</p></div> <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">`);
  if (can_show_bulk_actions) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="btn btn-outline w-full sm:w-auto"${attr("disabled", is_deleting, true)}>Delete Selected (${escape_html(selected_entity_ids.size)})</button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (show_actions) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="btn btn-secondary w-full sm:w-auto">Create New ${escape_html(display_name)}</button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
    if (entities.length === 0) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="text-center py-8 space-y-4"><p class="text-accent-600 dark:text-accent-400">No ${escape_html(display_name.toLowerCase())} found.</p> `);
      if (show_actions) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button class="btn btn-secondary">Create First ${escape_html(display_name)}</button>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      const each_array = ensure_array_like(get_primary_display_fields());
      const each_array_1 = ensure_array_like(entities);
      $$payload.out.push(`<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead class="bg-gray-50 dark:bg-gray-800"><tr>`);
      if (show_actions) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<th class="px-3 py-3 text-left"><input type="checkbox" class="w-4 h-4 text-accent-600 dark:text-accent-400 border-gray-300 dark:border-gray-600 rounded focus:ring-accent-500 dark:focus:ring-accent-400"${attr("checked", all_selected, true)}/></th>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--><!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let field_name = each_array[$$index];
        $$payload.out.push(`<th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">${escape_html(entity_metadata?.fields.find((f) => f.field_name === field_name)?.display_name || field_name)}</th>`);
      }
      $$payload.out.push(`<!--]-->`);
      if (show_actions) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<th class="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></tr></thead><tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
      for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
        let entity = each_array_1[$$index_2];
        const each_array_2 = ensure_array_like(get_primary_display_fields());
        $$payload.out.push(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">`);
        if (show_actions) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<td class="px-3 py-4"><input type="checkbox" class="w-4 h-4 text-accent-600 dark:text-accent-400 border-gray-300 dark:border-gray-600 rounded focus:ring-accent-500 dark:focus:ring-accent-400"${attr("checked", selected_entity_ids.has(entity.id), true)}/></td>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--><!--[-->`);
        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
          let field_name = each_array_2[$$index_1];
          $$payload.out.push(`<td class="px-3 py-4 text-sm text-accent-900 dark:text-accent-100"><div class="max-w-xs truncate">${escape_html(get_display_value_for_entity_field(entity, field_name))}</div></td>`);
        }
        $$payload.out.push(`<!--]-->`);
        if (show_actions) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<td class="px-3 py-4 text-right text-sm space-x-2"><button class="btn btn-outline btn-sm">Edit</button> <button class="btn btn-outline btn-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Delete</button></td>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></tr>`);
      }
      $$payload.out.push(`<!--]--></tbody></table></div>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, {
    entity_type,
    show_actions,
    is_mobile_view,
    get_current_selected_entities,
    clear_all_selections,
    get_selected_entity_count
  });
  pop();
}
function EntityCrudWrapper($$payload, $$props) {
  push();
  let page_title, show_back_button;
  let entity_type = $$props["entity_type"];
  let initial_view = fallback($$props["initial_view"], "list");
  let is_mobile_view = fallback($$props["is_mobile_view"], true);
  let show_list_actions = fallback($$props["show_list_actions"], true);
  let current_view = initial_view;
  let current_entity_for_editing = null;
  let total_entity_count = 0;
  function build_page_title_for_current_view(view, type) {
    const type_display = type.charAt(0).toUpperCase() + type.slice(1);
    if (view === "create") return `Create New ${type_display}`;
    if (view === "edit") return `Edit ${type_display}`;
    return `${type_display} Management`;
  }
  function determine_if_back_button_needed(view) {
    return view !== "list";
  }
  function refresh_entity_data() {
  }
  function get_current_view_info() {
    return {
      view: current_view,
      entity_count: total_entity_count,
      editing_entity: current_entity_for_editing
    };
  }
  function get_selected_entities_from_list() {
    return [];
  }
  function get_selected_entity_count() {
    return 0;
  }
  page_title = build_page_title_for_current_view(current_view, entity_type);
  show_back_button = determine_if_back_button_needed(current_view);
  $$payload.out.push(`<div class="crud-wrapper w-full svelte-13u5e7q"><div class="crud-header mb-4 sm:mb-6 svelte-13u5e7q"><div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div class="flex items-center gap-4">`);
  if (show_back_button) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="btn btn-outline" aria-label="Back to list">← Back</button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div><h1 class="text-xl sm:text-2xl font-bold text-accent-900 dark:text-accent-100">${escape_html(page_title)}</h1> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></div></div></div> <div class="crud-content svelte-13u5e7q">`);
  if (current_view === "list") {
    $$payload.out.push("<!--[-->");
    DynamicEntityList($$payload, { entity_type, show_actions: show_list_actions, is_mobile_view });
  } else {
    $$payload.out.push("<!--[!-->");
    if (current_view === "create") {
      $$payload.out.push("<!--[-->");
      DynamicEntityForm($$payload, { entity_type, entity_data: null, is_mobile_view });
    } else {
      $$payload.out.push("<!--[!-->");
      if (current_view === "edit") {
        $$payload.out.push("<!--[-->");
        DynamicEntityForm($$payload, {
          entity_type,
          entity_data: current_entity_for_editing,
          is_mobile_view
        });
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  bind_props($$props, {
    entity_type,
    initial_view,
    is_mobile_view,
    show_list_actions,
    refresh_entity_data,
    get_current_view_info,
    get_selected_entities_from_list,
    get_selected_entity_count
  });
  pop();
}
export {
  DynamicEntityForm as D,
  EntityCrudWrapper as E,
  DynamicEntityList as a
};
