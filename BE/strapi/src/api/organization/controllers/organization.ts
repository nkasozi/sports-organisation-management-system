import { Context } from 'koa';

/**
 * Organization type enum matching schema definition
 */
type OrganizationType = 'Governing Body' | 'Club' | 'School' | 'Other';

/**
 * Organization entity representing a sports organization in the system.
 */
type OrganizationData = {
  name: string;
  type: OrganizationType;
  logo?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
};

/**
 * Result of organization validation
 */
type ValidationResult = {
  isValid: boolean;
  message?: string;
  data?: OrganizationData;
};

/**
 * Allowed organization types as per business requirements
 */
const ALLOWED_ORGANIZATION_TYPES = ['Governing Body', 'Club', 'School', 'Other'];

/**
 * OrganizationController - custom controller for organization entity
 * Implements creation logic with debug logging and stateless helpers.
 */
export default {
  /**
   * Creates a new organization 
   * 
   * @param ctx Koa context
   * @returns success flag indicating operation result
   */
  async create(ctx: Context): Promise<boolean> {
    logDebug('Organization creation requested', ctx.request.body);
    
    // Validate the organization data
    const validationResult = validateOrganizationData(ctx.request.body);
    
    // If validation fails, return bad request
    if (!validationResult.isValid) {
      logDebug('Organization validation failed', { 
        requestBody: ctx.request.body, 
        reason: validationResult.message 
      });
      ctx.badRequest(validationResult.message || 'Invalid organization data');
      return false;
    }
    
    // Use the service to create the organization with business logic
    const organizationService = strapi.service('api::organization.organization');
    const creationResult = await organizationService.create(validationResult.data!);
    
    // Handle creation result
    if (creationResult.success) {
      logDebug('Organization created successfully', creationResult.data);
      ctx.body = creationResult.data;
      ctx.status = 201;
      return true;
    } else {
      logDebug('Organization creation failed', { error: creationResult.error });
      ctx.badRequest(creationResult.error || 'Failed to create organization');
      return false;
    }
  },
  
  /**
   * Updates an existing organization
   * 
   * @param ctx Koa context
   * @returns success flag indicating operation result
   */
  async update(ctx: Context): Promise<boolean> {
    const { id } = ctx.params;
    logDebug(`Organization update requested for ID: ${id}`, ctx.request.body);
    
    // Validate the organization data
    const validationResult = validateOrganizationData(ctx.request.body, true);
    
    // If validation fails, return bad request
    if (!validationResult.isValid) {
      logDebug('Organization update validation failed', { 
        id,
        requestBody: ctx.request.body, 
        reason: validationResult.message 
      });
      ctx.badRequest(validationResult.message || 'Invalid organization data');
      return false;
    }
    
    // Use the service to update the organization
    const organizationService = strapi.service('api::organization.organization');
    // Pass id as string since we're now using documentId in Strapi v5
    const updateResult = await organizationService.update(id, validationResult.data!);
    
    // Handle update result
    if (updateResult.success) {
      logDebug('Organization updated successfully', updateResult.data);
      ctx.body = updateResult.data;
      return true;
    } else {
      logDebug('Organization update failed', { id, error: updateResult.error });
      ctx.badRequest(updateResult.error || 'Failed to update organization');
      return false;
    }
  },
  
  /**
   * Finds all organizations with optional filtering
   * 
   * @param ctx Koa context
   * @returns success flag indicating operation result
   */
  async find(ctx: Context): Promise<boolean> {
    logDebug('Find organizations requested', ctx.query);
    
    try {
      // Prepare filters from query parameters
      const filters = prepareFiltersFromQuery(ctx.query);
      
      // Use the service to find organizations
      const organizationService = strapi.service('api::organization.organization');
      const findResult = await organizationService.findAll(filters);
      
      // Handle find result
      if (findResult.success) {
        logDebug('Organizations found successfully', { count: findResult.data?.length });
        ctx.body = findResult.data;
        return true;
      } else {
        logDebug('Organizations find failed', { error: findResult.error });
        ctx.internalServerError(findResult.error || 'Failed to find organizations');
        return false;
      }
    } catch (error) {
      logDebug('Exception in find organizations', error);
      ctx.internalServerError('An unexpected error occurred while finding organizations');
      return false;
    }
  },
  
  /**
   * Finds a single organization by ID
   * 
   * @param ctx Koa context
   * @returns success flag indicating operation result
   */
  async findOne(ctx: Context): Promise<boolean> {
    const { id } = ctx.params;
    logDebug(`Find organization by ID requested: ${id}`);
    
    try {
      // Use the service to find organization by ID
      const organizationService = strapi.service('api::organization.organization');
      const findResult = await organizationService.findById(id);
      
      // Handle find result
      if (findResult.success) {
        if (!findResult.data) {
          logDebug(`Organization not found with ID: ${id}`);
          ctx.notFound(`Organization with ID ${id} not found`);
          return false;
        }
        
        logDebug('Organization found successfully', findResult.data);
        ctx.body = findResult.data;
        return true;
      } else {
        logDebug('Organization find failed', { id, error: findResult.error });
        ctx.internalServerError(findResult.error || 'Failed to find organization');
        return false;
      }
    } catch (error) {
      logDebug('Exception in find organization', error);
      ctx.internalServerError('An unexpected error occurred while finding the organization');
      return false;
    }
  },
  
  /**
   * Deletes an organization by ID
   * 
   * @param ctx Koa context
   * @returns success flag indicating operation result
   */
  async delete(ctx: Context): Promise<boolean> {
    const { id } = ctx.params;
    logDebug(`Delete organization requested for ID: ${id}`);
    
    try {
      // Use the service to delete organization
      const organizationService = strapi.service('api::organization.organization');
      const deleteResult = await organizationService.delete(id);
      
      // Handle delete result
      if (deleteResult.success) {
        logDebug(`Organization deleted successfully: ${id}`);
        ctx.body = { id };
        return true;
      } else {
        logDebug('Organization deletion failed', { id, error: deleteResult.error });
        ctx.internalServerError(deleteResult.error || 'Failed to delete organization');
        return false;
      }
    } catch (error) {
      logDebug('Exception in delete organization', error);
      ctx.internalServerError('An unexpected error occurred while deleting the organization');
      return false;
    }
  }
};

/**
 * Prepares filters from query parameters
 * 
 * @param query Request query parameters
 * @returns Formatted filters object
 */
function prepareFiltersFromQuery(query: Record<string, any>): Record<string, any> {
  const filters: Record<string, any> = {};
  
  // Process basic field filters
  const filterableFields = ['name', 'type'];
  
  filterableFields.forEach(field => {
    if (query[field]) {
      filters[field] = query[field];
    }
  });
  
  return filters;
}

/**
 * Validates organization data ensuring it meets all business requirements
 * 
 * @param requestBody Request body from client
 * @param isUpdate Whether this is for an update operation (some fields optional)
 * @returns Validation result object with status and error message if any
 */
function validateOrganizationData(requestBody: any, isUpdate = false): ValidationResult {
  // Check if body exists
  if (!requestBody) {
    return { 
      isValid: false, 
      message: 'Request body is required' 
    };
  }
  
  // Extract fields from request
  const { name, type, logo, description, contact_email, contact_phone, address } = requestBody;
  
  // For create operations (not updates), name and type are required
  if (!isUpdate) {
    // Name validation
    if (!name || typeof name !== 'string') {
      return {
        isValid: false,
        message: 'Organization name is required and must be a string'
      };
    }
    
    if (name.length < 2) {
      return {
        isValid: false,
        message: 'Organization name must be at least 2 characters'
      };
    }
    
    // Type validation
    if (!type || !ALLOWED_ORGANIZATION_TYPES.includes(type)) {
      return {
        isValid: false,
        message: `Organization type must be one of: ${ALLOWED_ORGANIZATION_TYPES.join(', ')}`
      };
    }
  } else {
    // For updates, if name is provided, validate it
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length < 2) {
        return {
          isValid: false,
          message: 'Organization name must be a string with at least 2 characters'
        };
      }
    }
    
    // For updates, if type is provided, validate it
    if (type !== undefined && !ALLOWED_ORGANIZATION_TYPES.includes(type)) {
      return {
        isValid: false,
        message: `Organization type must be one of: ${ALLOWED_ORGANIZATION_TYPES.join(', ')}`
      };
    }
  }
  
  // Email validation (if provided)
  if (contact_email && !isValidEmail(contact_email)) {
    return {
      isValid: false,
      message: 'Invalid email format'
    };
  }
  
  // Build data object with only defined fields
  const data: OrganizationData = {} as OrganizationData;
  
  if (name !== undefined) data.name = name;
  if (type !== undefined) data.type = type as OrganizationType;
  if (logo !== undefined) data.logo = logo;
  if (description !== undefined) data.description = description;
  if (contact_email !== undefined) data.contact_email = contact_email;
  if (contact_phone !== undefined) data.contact_phone = contact_phone;
  if (address !== undefined) data.address = address;
  
  // Return validated data
  return {
    isValid: true,
    data
  };
}

/**
 * Helper function to validate email format
 * 
 * @param email Email to validate
 * @returns boolean indicating if email is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Debug logger for organization controller actions
 * 
 * @param message Debug message
 * @param data Associated data for context
 */
function logDebug(message: string, data: unknown): void {
  // eslint-disable-next-line no-console
  console.debug(`[OrganizationController] ${message}:`, JSON.stringify(data, null, 2));
}