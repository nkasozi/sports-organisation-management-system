/**
 * Organization service containing business logic for organization operations
 */

/**
 * Organization type enum matching schema definition
 */
type OrganizationType = 'Governing Body' | 'Club' | 'School' | 'Other';

/**
 * Organization data interface matching the entity fields with proper typing
 */
interface OrganizationData {
  name: string;
  type: OrganizationType;
  logo?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
}

/**
 * Service result structure for consistent error handling
 */
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Define the organization content type as a string
const ORGANIZATION_CONTENT_TYPE = 'api::organization.organization';

/**
 * Organization service implementation with Strapi v5 document service
 */
export default {
  /**
   * Finds an organization by name
   * 
   * @param name Organization name to search for
   * @returns Service result with the found organization or error
   */
  async findByName(name: string): Promise<ServiceResult<any>> {
    try {
      // Using the new documents API with filters
      const organizations = await strapi.documents(ORGANIZATION_CONTENT_TYPE).findMany({
        filters: { name },
      });
      
      return {
        success: true,
        data: organizations?.[0] || null
      };
    } catch (error) {
      return handleServiceError('findByName', error);
    }
  },
  
  /**
   * Creates a new organization after performing business rule validations
   * 
   * @param data Organization data to create
   * @returns Service result with created organization or error
   */
  async create(data: OrganizationData): Promise<ServiceResult<any>> {
    try {
      // Check for duplicate organization name
      const existingOrg = await this.findByName(data.name);
      if (existingOrg.success && existingOrg.data) {
        return {
          success: false,
          error: `Organization with name "${data.name}" already exists`
        };
      }
      
      // Using the new documents API to create
      const createdOrganization = await strapi.documents(ORGANIZATION_CONTENT_TYPE).create({
        data: data as any,
      });
      
      return {
        success: true,
        data: createdOrganization
      };
    } catch (error) {
      return handleServiceError('create', error);
    }
  },
  
  /**
   * Updates an existing organization
   * 
   * @param id Organization ID to update
   * @param data Updated organization data
   * @returns Service result with updated organization or error
   */
  async update(id: string, data: Partial<OrganizationData>): Promise<ServiceResult<any>> {
    try {
      // If name is being updated, check for duplicates
      if (data.name) {
        const existingOrg = await this.findByName(data.name);
        if (existingOrg.success && existingOrg.data && existingOrg.data.id !== id) {
          return {
            success: false,
            error: `Another organization with name "${data.name}" already exists`
          };
        }
      }
      
      // Using the new documents API to update
      const updatedOrganization = await strapi.documents(ORGANIZATION_CONTENT_TYPE).update({
        documentId: id,
        data: data as any,
      });
      
      return {
        success: true,
        data: updatedOrganization
      };
    } catch (error) {
      return handleServiceError('update', error);
    }
  },
  
  /**
   * Deletes an organization by ID
   * 
   * @param id Organization ID to delete
   * @returns Service result indicating success or error
   */
  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      // Using the new documents API to delete
      await strapi.documents(ORGANIZATION_CONTENT_TYPE).delete({
        documentId: id,
      });
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      return handleServiceError('delete', error);
    }
  },
  
  /**
   * Gets a single organization by ID
   * 
   * @param id Organization ID to retrieve
   * @returns Service result with the organization or error
   */
  async findById(id: string): Promise<ServiceResult<any>> {
    try {
      // Using the new documents API to find one
      const organization = await strapi.documents(ORGANIZATION_CONTENT_TYPE).findOne({
        documentId: id,
      });
      
      return {
        success: true,
        data: organization
      };
    } catch (error) {
      return handleServiceError('findById', error);
    }
  },
  
  /**
   * Gets all organizations with optional filters
   * 
   * @param filters Optional filters to apply to the query
   * @returns Service result with organizations array or error
   */
  async findAll(filters?: Record<string, any>): Promise<ServiceResult<any[]>> {
    try {
      // Using the new documents API to find many with optional filters
      const organizations = await strapi.documents(ORGANIZATION_CONTENT_TYPE).findMany({
        filters: filters || {},
      });
      
      return {
        success: true,
        data: organizations
      };
    } catch (error) {
      return handleServiceError('findAll', error);
    }
  },
};

/**
 * Handles errors consistently across service methods
 * 
 * @param method Method name where error occurred
 * @param error The caught error
 * @returns Formatted service error result
 */
function handleServiceError(method: string, error: unknown): ServiceResult<never> {
  // Log the error for debugging
  console.error(`[OrganizationService.${method}] Error:`, error);
  
  // Return formatted error
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An unexpected error occurred'
  };
}