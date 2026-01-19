// Organization service using in-memory store
import {
  memoryStore,
  type Organization,
} from "$lib/presentation/stores/memoryStore";

export type { Organization };

export interface CreateOrganizationData {
  name: string;
  description: string;
  sport_type: string;
  founded_date?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  website?: string | null;
  status: "active" | "inactive" | "suspended";
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {}

export interface OrganizationFilters {
  sport_type?: string;
  status?: string;
  search?: string;
}

class OrganizationServiceClass {
  constructor() {
    // Using in-memory store instead of API calls
  }

  private simulate_network_delay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200),
    );
  }

  async get_all_organizations(
    filters?: OrganizationFilters,
  ): Promise<Organization[]> {
    await this.simulate_network_delay();

    let organizations = memoryStore.get_all_organizations();

    if (filters) {
      if (filters.sport_type) {
        organizations = organizations.filter((org) =>
          org.sport_type
            .toLowerCase()
            .includes(filters.sport_type!.toLowerCase()),
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
            org.description.toLowerCase().includes(search_term),
        );
      }
    }

    return organizations;
  }

  async get_organization_by_id(organization_id: string): Promise<Organization> {
    await this.simulate_network_delay();

    const organization = memoryStore.get_organization_by_id(organization_id);
    if (!organization) {
      throw new Error(`Organization with ID ${organization_id} not found`);
    }

    return organization;
  }

  async create_organization(
    organization_data: CreateOrganizationData,
  ): Promise<Organization> {
    await this.simulate_network_delay();

    const validation = this.validate_organization_data(organization_data);
    if (!validation.is_valid) {
      throw new Error(Object.values(validation.errors).join(", "));
    }

    return memoryStore.create_organization({
      ...organization_data,
      founded_date: organization_data.founded_date ?? null,
      contact_email: organization_data.contact_email ?? null,
      contact_phone: organization_data.contact_phone ?? null,
      address: organization_data.address ?? null,
      website: organization_data.website ?? null,
    });
  }

  async update_organization(
    organization_id: string,
    organization_data: UpdateOrganizationData,
  ): Promise<Organization> {
    await this.simulate_network_delay();

    const updated_organization = memoryStore.update_organization(
      organization_id,
      organization_data,
    );
    if (!updated_organization) {
      throw new Error(`Organization with ID ${organization_id} not found`);
    }

    return updated_organization;
  }

  async delete_organization(organization_id: string): Promise<boolean> {
    await this.simulate_network_delay();

    const success = memoryStore.delete_organization(organization_id);
    if (!success) {
      throw new Error(`Organization with ID ${organization_id} not found`);
    }

    return true;
  }

  async get_organization_statistics(): Promise<{
    total_organizations: number;
    organizations_by_sport: Record<string, number>;
    organizations_by_status: Record<string, number>;
  }> {
    await this.simulate_network_delay();

    const organizations = memoryStore.get_all_organizations();

    const organizations_by_sport: Record<string, number> = {};
    const organizations_by_status: Record<string, number> = {};

    organizations.forEach((org) => {
      // Count by sport
      organizations_by_sport[org.sport_type] =
        (organizations_by_sport[org.sport_type] || 0) + 1;

      // Count by status
      organizations_by_status[org.status] =
        (organizations_by_status[org.status] || 0) + 1;
    });

    return {
      total_organizations: organizations.length,
      organizations_by_sport,
      organizations_by_status,
    };
  }

  // Helper method to validate organization data
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

  private is_valid_email(email: string): boolean {
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email_regex.test(email);
  }

  private is_valid_url(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Helper method to format organization display name
  format_organization_display_name(organization: Organization): string {
    return `${organization.name} (${organization.sport_type})`;
  }

  // Helper method to get organization status badge class
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
