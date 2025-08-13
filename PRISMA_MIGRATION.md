# Migration to Prisma ORM

## Overview

This project is planned to migrate from SQLAlchemy to Prisma ORM for better type safety, developer experience, and modern database management.

## Current State

- Using in-memory repositories for development and testing
- SQLAlchemy dependencies are present but not yet implemented in concrete repositories
- All repository interfaces are designed to be ORM-agnostic

## Migration Plan

### Phase 1: Prisma Setup

1. Install Prisma CLI and Python client
2. Create `schema.prisma` file with current entity definitions
3. Set up database connection and migrations

### Phase 2: Repository Implementation

1. Implement Prisma-based repositories replacing in-memory ones
2. Update repository factories to use Prisma repositories
3. Maintain same repository interface contracts

### Phase 3: Migration & Testing

1. Update tests to work with Prisma repositories
2. Migrate development and production databases
3. Remove SQLAlchemy dependencies

## Benefits of Prisma

- **Type Safety**: Auto-generated typed client
- **Developer Experience**: Excellent tooling and introspection
- **Migrations**: Declarative schema with automatic migrations
- **Performance**: Optimized queries and connection management
- **Tooling**: Prisma Studio for database inspection

## Dependencies to Add

```bash
# Install Prisma CLI globally
npm install -g prisma

# Python client (when available)
pip install prisma
```

## Schema Migration

The current entity classes will be translated to Prisma schema format, maintaining all relationships and constraints defined in the domain layer.
