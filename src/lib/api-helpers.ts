import { NextRequest, NextResponse } from 'next/server'
import { masterDb, getTenantDbByCode, getTenantDbById } from './tenant-manager'
import { PrismaClient } from '@prisma/client'

/**
 * Resolve tenant database from request
 * Looks for schoolCode in query params (GET) or body (POST/PUT/PATCH)
 */
export async function resolveTenantDb(request: NextRequest): Promise<{
  db: PrismaClient
  tenantId: string
  schoolCode: string
} | null> {
  let schoolCode = ''

  // Try query params first (for GET requests)
  const url = new URL(request.url)
  schoolCode = url.searchParams.get('schoolCode') || ''

  // Try request body for POST/PUT/PATCH
  if (!schoolCode) {
    try {
      const body = await request.clone().json()
      schoolCode = body.schoolCode || ''
    } catch {
      // Not JSON body, ignore
    }
  }

  if (!schoolCode) return null

  const tenantDb = await getTenantDbByCode(schoolCode)
  if (!tenantDb) return null

  // Get tenant ID from master (with fallback)
  let tenantId = `fallback_${schoolCode}`
  try {
    const tenant = await masterDb.tenant.findUnique({
      where: { code: schoolCode },
      select: { id: true },
    })
    if (tenant) tenantId = tenant.id
  } catch {
    // Master DB unreachable, use fallback ID
  }

  return {
    db: tenantDb,
    tenantId,
    schoolCode,
  }
}

/**
 * Resolve tenant DB by tenant ID (for internal use)
 */
export async function resolveTenantDbById(tenantId: string): Promise<PrismaClient | null> {
  return getTenantDbById(tenantId)
}

/**
 * Standard error response helper
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

/**
 * Standard success response helper
 */
export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Get tenant info from master database by school code
 */
export async function getTenantInfo(schoolCode: string) {
  try {
    return await masterDb.tenant.findUnique({
      where: { code: schoolCode },
    })
  } catch {
    return null
  }
}
