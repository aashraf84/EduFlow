import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

// ============================================
// MASTER DATABASE CLIENT
// ============================================

const masterDbUrl = process.env.DATABASE_URL!

const globalForPrisma = globalThis as unknown as {
  masterPrisma: PrismaClient | undefined
}

export const masterDb = globalForPrisma.masterPrisma ??
  new PrismaClient({
    datasourceUrl: masterDbUrl,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.masterPrisma = masterDb

// ============================================
// TENANT DATABASE CONNECTION POOL
// ============================================

const tenantClients = new Map<string, PrismaClient>()

/**
 * Get or create a PrismaClient for a specific tenant database
 */
export function getTenantDb(tenantId: string, databaseUrl: string): PrismaClient {
  const cacheKey = `${tenantId}_${databaseUrl}`
  
  if (!tenantClients.has(cacheKey)) {
    const client = new PrismaClient({
      datasourceUrl: databaseUrl,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
    tenantClients.set(cacheKey, client)
    
    // Clean up on process exit
    process.on('beforeExit', async () => {
      await client.$disconnect()
      tenantClients.delete(cacheKey)
    })
  }
  
  return tenantClients.get(cacheKey)!
}

/**
 * Get tenant database URL from master database by tenant code
 */
export async function getTenantDbUrl(tenantCode: string): Promise<{ tenantId: string; databaseUrl: string } | null> {
  const tenant = await masterDb.tenant.findUnique({
    where: { code: tenantCode },
    select: { id: true, databaseUrl: true, status: true },
  })
  
  if (!tenant || tenant.status !== 'active') return null
  
  return { tenantId: tenant.id, databaseUrl: tenant.databaseUrl }
}

/**
 * Get tenant PrismaClient by tenant code (resolves DB URL from master)
 */
export async function getTenantDbByCode(tenantCode: string): Promise<PrismaClient | null> {
  const tenantInfo = await getTenantDbUrl(tenantCode)
  if (!tenantInfo) return null
  
  return getTenantDb(tenantInfo.tenantId, tenantInfo.databaseUrl)
}

/**
 * Get tenant PrismaClient by tenant ID (resolves DB URL from master)
 */
export async function getTenantDbById(tenantId: string): Promise<PrismaClient | null> {
  const tenant = await masterDb.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, databaseUrl: true, status: true },
  })
  
  if (!tenant || tenant.status !== 'active') return null
  
  return getTenantDb(tenant.id, tenant.databaseUrl)
}

// ============================================
// DATABASE PROVISIONING
// ============================================

const NEON_HOST = process.env.NEON_HOST || ''
const NEON_DIRECT_HOST = process.env.NEON_DIRECT_HOST || ''
const NEON_USER = process.env.NEON_USER || ''
const NEON_PASSWORD = process.env.NEON_PASSWORD || ''

/**
 * Create a new tenant database in Neon PostgreSQL
 * Uses the direct (non-pooler) connection for DDL operations
 */
export async function createTenantDatabase(tenantCode: string): Promise<{
  databaseName: string
  poolerUrl: string
  directUrl: string
}> {
  const databaseName = `eduflow_${tenantCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
  
  // Use direct connection for CREATE DATABASE (can't run in transaction/pooler)
  const directPool = new Pool({
    host: NEON_DIRECT_HOST,
    user: NEON_USER,
    password: NEON_PASSWORD,
    database: 'neondb', // Connect to default DB first
    ssl: { rejectUnauthorized: false },
    max: 1,
  })

  try {
    // Check if database already exists
    const checkResult = await directPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName]
    )
    
    if (checkResult.rows.length === 0) {
      // Create the database
      await directPool.query(`CREATE DATABASE "${databaseName}"`)
      console.log(`✅ Created tenant database: ${databaseName}`)
    } else {
      console.log(`ℹ️ Database already exists: ${databaseName}`)
    }
  } catch (error) {
    console.error(`❌ Failed to create database ${databaseName}:`, error)
    throw error
  } finally {
    await directPool.end()
  }

  const poolerUrl = `postgresql://${NEON_USER}:${NEON_PASSWORD}@${NEON_HOST}/${databaseName}?sslmode=require`
  const directUrl = `postgresql://${NEON_USER}:${NEON_PASSWORD}@${NEON_DIRECT_HOST}/${databaseName}?sslmode=require`

  // Push the Prisma schema to the new tenant database
  await pushSchemaToTenant(directUrl)

  return { databaseName, poolerUrl, directUrl }
}

/**
 * Push Prisma schema to a tenant database using a temporary PrismaClient
 */
async function pushSchemaToTenant(databaseUrl: string): Promise<void> {
  const { execSync } = require('child_process')
  
  try {
    // Use Prisma CLI to push schema to the tenant database
    execSync(
      `npx prisma db push --skip-generate --accept-data-loss`,
      {
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
        stdio: 'pipe',
        timeout: 120000,
      }
    )
    console.log(`✅ Schema pushed to tenant database`)
  } catch (error) {
    console.error(`❌ Failed to push schema to tenant:`, error)
    throw error
  }
}

/**
 * Provision a complete new tenant: create database, register in master
 */
export async function provisionTenant(params: {
  name: string
  code: string
  plan?: string
  maxStudents?: number
  maxDevices?: number
}): Promise<{
  tenantId: string
  databaseName: string
  poolerUrl: string
}> {
  // Check if tenant code already exists
  const existing = await masterDb.tenant.findUnique({
    where: { code: params.code },
  })
  
  if (existing) {
    throw new Error(`Tenant with code "${params.code}" already exists`)
  }

  // Create the database
  const { databaseName, poolerUrl } = await createTenantDatabase(params.code)

  // Register the tenant in the master database
  const tenant = await masterDb.tenant.create({
    data: {
      name: params.name,
      code: params.code,
      databaseUrl: poolerUrl,
      databaseName: databaseName,
      plan: params.plan || 'starter',
      maxStudents: params.maxStudents || 500,
      maxDevices: params.maxDevices || 3,
      status: 'active',
    },
  })

  return {
    tenantId: tenant.id,
    databaseName,
    poolerUrl,
  }
}

/**
 * Delete a tenant database and remove from master
 */
export async function decommissionTenant(tenantId: string): Promise<void> {
  const tenant = await masterDb.tenant.findUnique({
    where: { id: tenantId },
  })
  
  if (!tenant) throw new Error('Tenant not found')

  // Disconnect any cached clients
  const cacheKey = `${tenantId}_${tenant.databaseUrl}`
  const cachedClient = tenantClients.get(cacheKey)
  if (cachedClient) {
    await cachedClient.$disconnect()
    tenantClients.delete(cacheKey)
  }

  // Drop the database using direct connection
  const directPool = new Pool({
    host: NEON_DIRECT_HOST,
    user: NEON_USER,
    password: NEON_PASSWORD,
    database: 'neondb',
    ssl: { rejectUnauthorized: false },
    max: 1,
  })

  try {
    // Terminate existing connections to the database
    await directPool.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = $1 AND pid <> pg_backend_pid()
    `, [tenant.databaseName])
    
    await directPool.query(`DROP DATABASE IF EXISTS "${tenant.databaseName}"`)
    console.log(`✅ Dropped tenant database: ${tenant.databaseName}`)
  } finally {
    await directPool.end()
  }

  // Remove from master database
  await masterDb.tenant.delete({
    where: { id: tenantId },
  })
}

/**
 * Clean up all tenant connections (for graceful shutdown)
 */
export async function disconnectAllTenants(): Promise<void> {
  const disconnectPromises = Array.from(tenantClients.values()).map(client =>
    client.$disconnect().catch(console.error)
  )
  await Promise.all(disconnectPromises)
  tenantClients.clear()
}

// Export master db as default for backward compatibility
export const db = masterDb
