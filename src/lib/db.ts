// Re-export from tenant manager for backward compatibility
// Use masterDb for platform/owner operations
// Use getTenantDb* functions for tenant-specific operations

export { masterDb as db, masterDb, getTenantDb, getTenantDbByCode, getTenantDbById, provisionTenant, decommissionTenant, disconnectAllTenants } from './tenant-manager'
