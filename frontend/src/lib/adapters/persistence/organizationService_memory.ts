// Organization service using in-memory store
import { memoryStore } from "../../presentation/stores/memoryStore";
import type { Organization } from "../../presentation/stores/memoryStore";

export type { Organization };

export interface CreateOrganizationData {
  name: string;
  description: string;
  sport_type: string;
  founded_date: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  status: "active" | "inactive" | "suspended";
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {}

export interface OrganizationFilters {
  sport_type?: string;
  status?: string;
  search?: string;
}

// Simulated delay to mimic network requests
const SIMULATED_DELAY = 200;

// Utility function to simulate network delay
async function simulate_network_delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY));
}

class OrganizationServiceClass {
  /**
   * Retrieve all organizations from the memory store with optional filtering
   * @param filters - Optional filters to apply
   * @returns Promise<Organization[]> Array of organization objects
   */
  async get_all_organizations(
    filters?: OrganizationFilters,
  ): Promise<Organization[]> {
    try {
      await simulate_network_delay();

      let organizations = memoryStore.get_all_organizations();

      // Apply filters if provided
      if (filters) {
        if (filters.sport_type) {
          organizations = organizations.filter(
            (org) =>
              org.sport_type.toLowerCase() ===
              filters.sport_type?.toLowerCase(),
          );
        }

        if (filters.status) {
          organizations = organizations.filter(
            (org) => org.status === filters.status,
          );
        }

        if (filters.search) {
          const search_term = filters.search.toLowerCase();
          organizations = organizations.filter(
            (org) =>
              org.name.toLowerCase().includes(search_term) ||
              org.description.toLowerCase().includes(search_term) ||
              org.sport_type.toLowerCase().includes(search_term),
          );
        }
      }

      console.log("OrganizationService: Retrieved organizations", {
        total: organizations.length,
        filters,
      });

      return organizations;
    } catch (error) {
      console.error(
        "OrganizationService: Error fetching organizations:",
        error,
      );
      throw new Error(`Failed to fetch organizations: ${error}`);
    }
  }

  /**
   * Retrieve a single organization by ID
   * @param organization_id - The unique identifier for the organization
   * @returns Promise<Organization> Organization object
   */
  async get_organization_by_id(organization_id: string): Promise<Organization> {
    try {
      await simulate_network_delay();

      if (!organization_id?.trim()) {
        throw new Error("Organization ID is required");
      }

      const organization = memoryStore.get_organization_by_id(organization_id);

      if (!organization) {
        throw new Error(`Organization with ID ${organization_id} not found`);
      }

      console.log("OrganizationService: Retrieved organization by ID", {
        organization_id,
        name: organization.name,
      });

      return organization;
    } catch (error) {
      console.error("OrganizationService: Error fetching organization:", error);
      throw error;
    }
  }

  /**
   * Create a new organization
   * @param organization_data - The organization data to create
   * @returns Promise<Organization> Created organization object
   */
  async create_organization(
    organization_data: CreateOrganizationData,
  ): Promise<Organization> {
    try {
      await simulate_network_delay();

      // Validate the data
      const validation = this.validate_organization_data(organization_data);
      if (!validation.is_valid) {
        const error_messages = Object.values(validation.errors).join(", ");
        throw new Error(`Validation failed: ${error_messages}`);
      }

      const organization = memoryStore.create_organization(organization_data);

      console.log("OrganizationService: Created organization", {
        organization_id: organization.id,
        name: organization.name,
      });

      return organization;
    } catch (error) {
      console.error("OrganizationService: Error creating organization:", error);
      throw error;
    }
  }

  /**
   * Update an existing organization
   * @param organization_id - The ID of the organization to update
   * @param organization_data - The updated organization data
   * @returns Promise<Organization> Updated organization object
   */
  async update_organization(
    organization_id: string,
    organization_data: UpdateOrganizationData,
  ): Promise<Organization> {
    try {
      await simulate_network_delay();

      if (!organization_id?.trim()) {
        throw new Error("Organization ID is required");
      }

      // Check if organization exists
      const existing_organization =
        memoryStore.get_organization_by_id(organization_id);
      if (!existing_organization) {
        throw new Error(`Organization with ID ${organization_id} not found`);
      }

      // Validate partial data
      if (Object.keys(organization_data).length > 0) {
        const full_data = { ...existing_organization, ...organization_data };
        const validation = this.validate_organization_data(
          full_data as CreateOrganizationData,
        );
        if (!validation.is_valid) {
          const error_messages = Object.values(validation.errors).join(", ");
          throw new Error(`Validation failed: ${error_messages}`);
        }
      }

      const updated_organization = memoryStore.update_organization(
        organization_id,
        organization_data,
      );

      if (!updated_organization) {
        throw new Error(
          `Failed to update organization with ID ${organization_id}`,
        );
      }

      console.log("OrganizationService: Updated organization", {
        organization_id,
        name: updated_organization.name,
      });

      return updated_organization;
    } catch (error) {
      console.error("OrganizationService: Error updating organization:", error);
      throw error;
    }
  }

  /**
   * Delete an organization
   * @param organization_id - The ID of the organization to delete
   * @returns Promise<boolean> True if successful
   */
  async delete_organization(organization_id: string): Promise<boolean> {
    try {
      await simulate_network_delay();

      if (!organization_id?.trim()) {
        throw new Error("Organization ID is required");
      }

      const success = memoryStore.delete_organization(organization_id);

      if (!success) {
        throw new Error(`Organization with ID ${organization_id} not found`);
      }

      console.log("OrganizationService: Deleted organization", {
        organization_id,
      });

      return true;
    } catch (error) {
      console.error("OrganizationService: Error deleting organization:", error);
      throw error;
    }
  }

  /**
   * Get organization statistics
   * @returns Promise<object> Statistics about organizations
   */
  async get_organization_statistics(): Promise<{
    total_organizations: number;
    organizations_by_sport: Record<string, number>;
    organizations_by_status: Record<string, number>;
  }> {
    try {
      await simulate_network_delay();

      const organizations = memoryStore.get_all_organizations();

      const statistics = {
        total_organizations: organizations.length,
        organizations_by_sport: {} as Record<string, number>,
        organizations_by_status: {} as Record<string, number>,
      };

      // Count by sport type
      organizations.forEach((org) => {
        statistics.organizations_by_sport[org.sport_type] =
          (statistics.organizations_by_sport[org.sport_type] || 0) + 1;
      });

      // Count by status
      organizations.forEach((org) => {
        statistics.organizations_by_status[org.status] =
          (statistics.organizations_by_status[org.status] || 0) + 1;
      });

      console.log(
        "OrganizationService: Retrieved organization statistics",
        statistics,
      );

      return statistics;
    } catch (error) {
      console.error("OrganizationService: Error fetching statistics:", error);
      throw new Error(`Failed to fetch organization statistics: ${error}`);
    }
  }

  /**
   * Validate organization data
   * @param data - The organization data to validate
   * @returns Validation result with errors
   */
  validate_organization_data(data: CreateOrganizationData): {
    is_valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
      errors.name = "Organization name is required";
    }

    if (!data.sport_type?.trim()) {
      errors.sport_type = "Sport type is required";
    }

    if (data.contact_email && !this.is_valid_email(data.contact_email)) {
      errors.contact_email = "Please enter a valid email address";
    }

    if (data.website && !this.is_valid_url(data.website)) {
      errors.website = "Please enter a valid URL";
    }

    return {
      is_valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns Boolean indicating if email is valid
   */
  private is_valid_email(email: string): boolean {
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email_regex.test(email);
  }

  /**
   * Validate URL format
   * @param url - URL to validate
   * @returns Boolean indicating if URL is valid
   */
  private is_valid_url(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format organization display name
   * @param organization - Organization object
   * @returns Formatted display name
   */
  format_organization_display_name(organization: Organization): string {
    return `${organization.name} (${organization.sport_type})`;
  }

  /**
   * Get CSS class for organization status badge
   * @param status - Organization status
   * @returns CSS class string
   */
  get_status_badge_class(status: Organization["status"]): string {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  }
}

// Export singleton instance
export const organizationService = new OrganizationServiceClass();
