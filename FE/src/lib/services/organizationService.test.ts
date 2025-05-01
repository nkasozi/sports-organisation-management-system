import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOrganization, getOrganizations, getOrganizationById } from '$lib/services/organizationService';
import type { OrganizationData } from '$lib/services/organizationService';

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock environment variable
vi.mock('$env/static/public', () => ({
  PUBLIC_API_BASE_URL: 'http://test-api-url/api'
}));

describe('organizationService', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // Clean up after all tests
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createOrganization', () => {
    const validOrganizationData: OrganizationData = {
      name: 'Test Organization',
      type: 'Club',
      description: 'A test organization',
      contact_email: 'test@example.com'
    };

    it('should successfully create an organization when API returns success', async () => {
      // Arrange: mock successful API response
      const mockResponseData = {
        data: {
          id: 1,
          attributes: validOrganizationData
        }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData
      });

      // Act: call the function being tested
      const result = await createOrganization(validOrganizationData);

      // Assert: verify expected outcomes
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponseData.data);
      expect(mockFetch).toHaveBeenCalledWith('http://test-api-url/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: validOrganizationData }),
      });
    });

    it('should return error response when API returns an error', async () => {
      // Arrange: mock API error response
      const errorMessage = 'Organization with this name already exists';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: errorMessage
          }
        })
      });

      // Act: call the function being tested
      const result = await createOrganization(validOrganizationData);

      // Assert: verify expected outcomes
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should handle network errors gracefully', async () => {
      // Arrange: mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act: call the function being tested
      const result = await createOrganization(validOrganizationData);

      // Assert: verify expected outcomes
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getOrganizations', () => {
    it('should return organizations when API call succeeds', async () => {
      // Arrange: mock successful API response
      const mockOrganizations = {
        data: [
          {
            id: 1,
            attributes: {
              name: 'Org 1',
              type: 'Club'
            }
          },
          {
            id: 2,
            attributes: {
              name: 'Org 2',
              type: 'School'
            }
          }
        ]
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrganizations
      });

      // Act: call the function being tested
      const result = await getOrganizations();

      // Assert: verify expected outcomes
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrganizations.data);
      expect(mockFetch).toHaveBeenCalledWith('http://test-api-url/api/organizations');
    });

    it('should apply filters correctly when provided', async () => {
      // Arrange: mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });

      // Act: call the function with filters
      await getOrganizations({ type: 'Club', name: 'Test' });

      // Assert: verify URL contains correct query parameters
      const expectedUrl = 'http://test-api-url/api/organizations?filters[type][$eq]=Club&filters[name][$eq]=Test';
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('getOrganizationById', () => {
    it('should return a single organization when API call succeeds', async () => {
      // Arrange: mock successful API response
      const mockOrganization = {
        data: {
          id: 1,
          attributes: {
            name: 'Test Org',
            type: 'Governing Body'
          }
        }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrganization
      });

      // Act: call the function being tested
      const result = await getOrganizationById(1);

      // Assert: verify expected outcomes
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrganization.data);
      expect(mockFetch).toHaveBeenCalledWith('http://test-api-url/api/organizations/1');
    });
  });
});