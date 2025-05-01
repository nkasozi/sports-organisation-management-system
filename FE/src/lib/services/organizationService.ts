/**
 * API service for organization-related operations
 */

import { PUBLIC_API_BASE_URL } from '$env/static/public';

/**
 * Organization data interface
 */
export interface OrganizationData {
  name: string;
  type: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  logo?: any; // File upload handling will be added later
}

/**
 * API response interface for organization operations
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates a new organization
 * 
 * @param organizationData Organization data to submit
 * @returns API response with created organization or error
 */
export async function createOrganization(
  organizationData: OrganizationData
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: organizationData }),
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: responseData.data
      };
    } else {
      return {
        success: false,
        error: responseData.error?.message || 'Failed to create organization'
      };
    }
  } catch (error) {
    console.error('Error creating organization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
}

/**
 * Gets all organizations with optional filtering
 * 
 * @param filters Optional query filters
 * @returns API response with organizations or error
 */
export async function getOrganizations(
  filters?: Record<string, string>
): Promise<ApiResponse<any[]>> {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(`filters[${key}][$eq]`, value);
      });
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await fetch(`${PUBLIC_API_BASE_URL}/organizations${queryString}`);
    const responseData = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: responseData.data
      };
    } else {
      return {
        success: false,
        error: responseData.error?.message || 'Failed to fetch organizations'
      };
    }
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
}

/**
 * Gets a single organization by ID
 * 
 * @param id Organization ID to fetch
 * @returns API response with organization or error
 */
export async function getOrganizationById(id: number): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}/organizations/${id}`);
    const responseData = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: responseData.data
      };
    } else {
      return {
        success: false,
        error: responseData.error?.message || 'Failed to fetch organization'
      };
    }
  } catch (error) {
    console.error(`Error fetching organization with ID ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
}