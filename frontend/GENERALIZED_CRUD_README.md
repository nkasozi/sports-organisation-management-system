# Generalized CRUD System Documentation

## Overview

This generalized CRUD system follows your coding guidelines and provides a component-based approach to entity management. Instead of separate CRUD implementations for each entity, we now have a unified system that automatically adapts based on entity metadata.

## Architecture

### Core Components

1. **BaseEntity.ts** - Defines base entity interface and common types
2. **UnifiedApiService.ts** - Single service handling all entity CRUD operations
3. **EntityMetadataRegistry.ts** - Centralized metadata definitions for all entities
4. **DynamicEntityForm.svelte** - Auto-generates forms based on entity metadata
5. **DynamicEntityList.svelte** - Auto-generates lists with CRUD operations
6. **EntityCrudWrapper.svelte** - Combines form and list for complete entity management
7. **UiWizardStepper.svelte** - Progress stepper for multi-step workflows

### Key Benefits

1. **No Code Duplication** - Single implementation handles all entities
2. **Automatic Form Generation** - Forms adapt to field types (string, number, enum, foreign key)
3. **Relationship Handling** - Foreign keys automatically generate dropdowns
4. **Mobile-First Design** - Responsive layouts optimized for mobile
5. **Type Safety** - Full TypeScript support with validation
6. **Consistent Theming** - Secondary color used for actions and progress

## Entity Definition

Adding a new entity is simple - just define it in `EntityMetadataRegistry.ts`:

```typescript
export interface NewEntity extends BaseEntity {
  name: string;
  status: 'active' | 'inactive';
  // ... other fields
}

// Then register metadata:
private register_new_entity_metadata(): void {
  this.metadata_map.set('new_entity', {
    entity_name: 'new_entity',
    display_name: 'New Entity',
    fields: [
      {
        field_name: 'name',
        display_name: 'Name',
        field_type: 'string',
        is_required: true,
        is_read_only: false,
        show_in_list: true,
      },
      // ... other field definitions
    ]
  });
}
```

## Usage Examples

### Simple Entity Management

```svelte
<EntityCrudWrapper
  entity_type="organization"
  initial_view="list"
  is_mobile_view={true}
  show_list_actions={true}
  on:entity_created={handle_created}
  on:entity_updated={handle_updated}
  on:entity_deleted={handle_deleted}
/>
```

### Workflow Wizard

```svelte
<UiWizardStepper
  steps={wizard_steps}
  current_step_index={0}
  is_mobile_view={true}
  allow_skip_steps={true}
  on:step_changed={handle_step_change}
  on:wizard_completed={handle_completion}
/>
```

## Field Types Supported

- **string** - Text input or textarea for descriptions
- **number** - Number input with validation
- **boolean** - Checkbox
- **date** - Date picker
- **enum** - Dropdown with predefined options
- **foreign_key** - Dropdown populated from related entities

## Validation

Validation rules are defined in metadata:

```typescript
validation_rules: [
  { rule_type: "min_length", rule_value: 2, error_message: "Name too short" },
  {
    rule_type: "pattern",
    rule_value: "^[^@]+@[^@]+\\.[^@]+$",
    error_message: "Invalid email",
  },
];
```

## File Organization

```
src/lib/
├── core/
│   ├── BaseEntity.ts              # Base entity types
│   ├── UnifiedApiService.ts       # Single API service
│   └── EntityMetadataRegistry.ts  # Entity definitions
├── components/
│   ├── DynamicEntityForm.svelte   # Auto-generated forms
│   ├── DynamicEntityList.svelte   # Auto-generated lists
│   ├── EntityCrudWrapper.svelte   # Combined CRUD
│   └── UiWizardStepper.svelte     # Workflow wizard
└── routes/
    ├── workflow/+page-enhanced.svelte  # Enhanced workflow
    └── crud-test/+page.svelte          # Test interface
```

## Key Design Principles Applied

1. **Mobile-First** - All components prioritize mobile experience
2. **Stateless Functions** - Helpers take parameters and return values
3. **Explicit Return Types** - All functions have clear return types
4. **Long Descriptive Names** - Variables and methods clearly named
5. **No Nested IFs** - Flat conditional logic
6. **Modular Files** - Each file under 200 lines when possible
7. **Debug Logging** - Comprehensive logging for troubleshooting

## Next Steps

1. Add more validation rule types as needed
2. Extend field types (file upload, rich text, etc.)
3. Add bulk operations
4. Implement data export/import
5. Add advanced filtering and search
