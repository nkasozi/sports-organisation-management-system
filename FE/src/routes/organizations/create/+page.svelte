<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { createOrganization, type OrganizationData } from '$lib/services/organizationService';

  /**
   * Organization types as defined in the backend
   */
  const ORGANIZATION_TYPES = [
    'Governing Body',
    'Club',
    'School',
    'Other'
  ];

  /**
   * Interface for form validation errors
   */
  interface FormErrors {
    name?: string;
    type?: string;
    contact_email?: string;
    general?: string;
  }

  // Form state
  let organizationData: OrganizationData = {
    name: '',
    type: ORGANIZATION_TYPES[0],
    description: '',
    contact_email: '',
    contact_phone: '',
    address: ''
  };

  // Form processing state
  let isSubmitting = false;
  let formErrors: FormErrors = {};
  let successMessage = '';

  onMount(() => {
    if (!browser) return;
    // Any initialization code can go here
  });

  /**
   * Validates the organization form data
   * 
   * @param data Organization data to validate
   * @returns Object with validation errors if any
   */
  function validateForm(data: OrganizationData): FormErrors {
    const errors: FormErrors = {};
    
    // Name validation
    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Organization name must be at least 2 characters';
    }
    
    // Type validation
    if (!ORGANIZATION_TYPES.includes(data.type)) {
      errors.type = 'Please select a valid organization type';
    }
    
    // Email format validation
    if (data.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
      errors.contact_email = 'Please enter a valid email address';
    }
    
    return errors;
  }

  /**
   * Submits the organization form data to the API
   * 
   * @param event Form submission event
   * @returns True if submission was successful
   */
  async function handleSubmit(event: Event): Promise<boolean> {
    event.preventDefault();
    successMessage = '';
    
    // Reset submission state
    isSubmitting = true;
    formErrors = {};
    
    try {
      // Validate form locally first
      const errors = validateForm(organizationData);
      if (Object.keys(errors).length > 0) {
        formErrors = errors;
        return false;
      }
      
      // Call API service to create the organization
      const result = await createOrganization(organizationData);
      
      // Handle response
      if (result.success) {
        console.log('Organization created:', result.data);
        
        // Reset form after successful submission
        organizationData = {
          name: '',
          type: ORGANIZATION_TYPES[0],
          description: '',
          contact_email: '',
          contact_phone: '',
          address: ''
        };
        
        successMessage = 'Organization created successfully!';
        return true;
      } else {
        console.error('Error creating organization:', result.error);
        formErrors.general = result.error || 'Failed to create organization. Please try again.';
        return false;
      }
    } catch (error) {
      console.error('Exception during organization creation:', error);
      formErrors.general = 'A network error occurred. Please check your connection and try again.';
      return false;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Create Organization | Sports Management System</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-2xl md:text-3xl font-bold mb-6">Create New Organization</h1>
  
  {#if successMessage}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
      <p>{successMessage}</p>
    </div>
  {/if}
  
  {#if formErrors.general}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
      <p>{formErrors.general}</p>
    </div>
  {/if}
  
  <form on:submit={handleSubmit} class="bg-white shadow-md rounded-lg p-4 md:p-6 mb-4">
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="name">
        Organization Name *
      </label>
      <input 
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline {formErrors.name ? 'border-red-500' : ''}" 
        id="name" 
        type="text" 
        placeholder="Uganda Hockey Association"
        bind:value={organizationData.name}
        disabled={isSubmitting}
      >
      {#if formErrors.name}
        <p class="text-red-500 text-xs italic mt-1">{formErrors.name}</p>
      {/if}
    </div>
    
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="type">
        Organization Type *
      </label>
      <select 
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline {formErrors.type ? 'border-red-500' : ''}" 
        id="type"
        bind:value={organizationData.type}
        disabled={isSubmitting}
      >
        {#each ORGANIZATION_TYPES as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
      {#if formErrors.type}
        <p class="text-red-500 text-xs italic mt-1">{formErrors.type}</p>
      {/if}
    </div>
    
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="description">
        Description
      </label>
      <textarea 
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
        id="description" 
        placeholder="Brief description of the organization"
        rows="3"
        bind:value={organizationData.description}
        disabled={isSubmitting}
      ></textarea>
    </div>
    
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="contact_email">
        Contact Email
      </label>
      <input 
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline {formErrors.contact_email ? 'border-red-500' : ''}" 
        id="contact_email" 
        type="email" 
        placeholder="contact@uha.org"
        bind:value={organizationData.contact_email}
        disabled={isSubmitting}
      >
      {#if formErrors.contact_email}
        <p class="text-red-500 text-xs italic mt-1">{formErrors.contact_email}</p>
      {/if}
    </div>
    
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="contact_phone">
        Contact Phone
      </label>
      <input 
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
        id="contact_phone" 
        type="tel" 
        placeholder="+256 XXX XXX XXX"
        bind:value={organizationData.contact_phone}
        disabled={isSubmitting}
      >
    </div>
    
    <div class="mb-6">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="address">
        Address
      </label>
      <textarea 
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
        id="address" 
        placeholder="Physical address"
        rows="2"
        bind:value={organizationData.address}
        disabled={isSubmitting}
      ></textarea>
    </div>
    
    <div class="flex items-center justify-between">
      <button 
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed" 
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Organization'}
      </button>
    </div>
  </form>
  
  <p class="text-center text-gray-500 text-xs">
    Fields marked with * are required
  </p>
</div>