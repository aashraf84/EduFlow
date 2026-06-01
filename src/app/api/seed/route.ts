import { NextResponse } from 'next/server';
import { masterDb, getTenantDbByCode } from '@/lib/tenant-manager';

const masterDbUrl = process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL!

export async function POST() {
  try {
    // ============================================
    // 1. Seed Owner User if not exists
    // ============================================
    const existingOwner = await masterDb.ownerUser.findUnique({
      where: { email: 'admin@eduflow.cloud' },
    });

    if (!existingOwner) {
      await masterDb.ownerUser.create({
        data: {
          email: 'admin@eduflow.cloud',
          password: 'hashed_Admin@180H',
          name: 'EduFlow Admin',
          role: 'owner',
          status: 'active',
        },
      });
      console.log('✅ Seeded owner user: admin@eduflow.cloud');
    }

    // ============================================
    // 2. Ensure OWNER tenant exists
    // ============================================
    let ownerTenant = await masterDb.tenant.findUnique({
      where: { code: 'OWNER' },
    });

    if (!ownerTenant) {
      ownerTenant = await masterDb.tenant.create({
        data: {
          name: 'EduFlow Platform Owner',
          code: 'OWNER',
          databaseUrl: masterDbUrl,
          databaseName: 'neondb',
          status: 'active',
          plan: 'enterprise',
          maxStudents: 999999,
          maxDevices: 100,
        },
      });
    }

    // ============================================
    // 3. Seed Demo Tenant (GIA-001) if not exists
    // ============================================
    let demoTenant = await masterDb.tenant.findUnique({
      where: { code: 'GIA-001' },
    });

    if (!demoTenant) {
      demoTenant = await masterDb.tenant.create({
        data: {
          name: 'Greenfield International Academy',
          code: 'GIA-001',
          databaseUrl: masterDbUrl,
          databaseName: 'neondb',
          status: 'active',
          plan: 'professional',
          maxStudents: 2000,
          maxDevices: 10,
        },
      });
      console.log('✅ Seeded demo tenant: GIA-001');
    }

    // ============================================
    // 4. Seed Demo Client if not exists (linked to GIA-001 tenant)
    // ============================================
    const existingDemoClient = await masterDb.client.findFirst({
      where: { email: 'demo@greenfieldacademy.edu' },
    });

    if (!existingDemoClient) {
      const demoClient = await masterDb.client.create({
        data: {
          companyName: 'Greenfield International Academy',
          contactPerson: 'Dr. Sarah Ahmed',
          email: 'demo@greenfieldacademy.edu',
          phone: '+92-300-1234567',
          address: '123 Education Blvd',
          city: 'Lahore',
          state: 'Punjab',
          country: 'Pakistan',
          status: 'active',
          tenantId: demoTenant.id,
        },
      });

      // Create owner serial key if not exists
      const existingOwnerKey = await masterDb.serialKey.findUnique({
        where: { key: 'EF-OWNR-2025-0001' },
      });

      if (!existingOwnerKey) {
        await masterDb.serialKey.create({
          data: {
            key: 'EF-OWNR-2025-0001',
            clientId: demoClient.id,
            tenantId: ownerTenant.id,
            plan: 'enterprise',
            maxDevices: 100,
            maxStudents: 999999,
            status: 'activated',
            activatedAt: new Date(),
          },
        });
      }
      console.log('✅ Seeded demo client and serial key');
    }

    // ============================================
    // 5. Seed demo school + user in tenant DB
    // ============================================
    try {
      const tenantDb = await getTenantDbByCode('GIA-001');
      if (tenantDb) {
        const existingSchool = await tenantDb.school.findFirst();
        if (!existingSchool) {
          const school = await tenantDb.school.create({
            data: {
              name: 'Greenfield International Academy',
              code: 'GIA-001',
              address: '123 Education Blvd, Lahore',
              city: 'Lahore',
              state: 'Punjab',
              country: 'Pakistan',
              phone: '+92-42-35761234',
              email: 'info@greenfieldacademy.edu',
              website: 'www.greenfieldacademy.edu',
              plan: 'professional',
              status: 'active',
              maxStudents: 2000,
              institutionType: 'school',
            },
          });

          // Create demo admin user
          const existingDemoUser = await tenantDb.user.findUnique({
            where: { email: 'demo@greenfieldacademy.edu' },
          });

          if (!existingDemoUser) {
            await tenantDb.user.create({
              data: {
                schoolId: school.id,
                email: 'demo@greenfieldacademy.edu',
                password: 'hashed_demo123',
                name: 'Demo Admin',
                role: 'admin',
                status: 'active',
                isDemo: true,
              },
            });
          }
          console.log('✅ Seeded demo school and user in tenant DB');
        }
      }
    } catch (tenantError) {
      // Non-critical — tenant DB might not be ready yet
      console.log('⚠️ Could not seed tenant DB:', (tenantError as Error).message);
    }

    return NextResponse.json({
      success: true,
      message: 'Seed completed successfully',
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Seed failed' },
      { status: 500 }
    );
  }
}
