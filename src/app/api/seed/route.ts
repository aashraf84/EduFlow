import { NextResponse } from 'next/server';
import { masterDb, getTenantDbByCode } from '@/lib/tenant-manager';

// Use MASTER_DATABASE_URL preferentially (avoids SQLite override from system env)
const masterDbUrl = process.env.MASTER_DATABASE_URL 
  || (process.env.DATABASE_URL?.startsWith('postgresql://') ? process.env.DATABASE_URL : undefined) 
  || ''

// Derive the database name from the URL
function getDatabaseName(url: string): string {
  try {
    const path = new URL(url).pathname.slice(1) // remove leading /
    return path || 'neondb'
  } catch {
    return 'neondb'
  }
}

export async function POST() {
  try {
    const dbName = getDatabaseName(masterDbUrl)

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

    // Also seed demo@eduflow.cloud for backward compatibility
    const existingDemoOwner = await masterDb.ownerUser.findUnique({
      where: { email: 'demo@eduflow.cloud' },
    });
    if (!existingDemoOwner) {
      await masterDb.ownerUser.create({
        data: {
          email: 'demo@eduflow.cloud',
          password: 'hashed_Demo@2025',
          name: 'EduFlow Demo',
          role: 'owner',
          status: 'active',
        },
      });
      console.log('✅ Seeded demo owner user: demo@eduflow.cloud');
    }

    // ============================================
    // 2. Ensure OWNER tenant exists (update DB URL if stale)
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
          databaseName: dbName,
          status: 'active',
          plan: 'enterprise',
          maxStudents: 999999,
          maxDevices: 100,
        },
      });
    } else if (ownerTenant.databaseUrl !== masterDbUrl) {
      // Update stale database URL
      ownerTenant = await masterDb.tenant.update({
        where: { id: ownerTenant.id },
        data: { databaseUrl: masterDbUrl, databaseName: dbName },
      });
      console.log('🔄 Updated OWNER tenant databaseUrl');
    }

    // ============================================
    // 3. Seed Demo Tenant (GIA-001) if not exists (update DB URL if stale)
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
          databaseName: dbName,
          status: 'active',
          plan: 'professional',
          maxStudents: 2000,
          maxDevices: 10,
        },
      });
      console.log('✅ Seeded demo tenant: GIA-001');
    } else if (demoTenant.databaseUrl !== masterDbUrl) {
      // Update stale database URL so the tenant points to the current DB
      demoTenant = await masterDb.tenant.update({
        where: { id: demoTenant.id },
        data: { databaseUrl: masterDbUrl, databaseName: dbName },
      });
      console.log('🔄 Updated GIA-001 tenant databaseUrl');
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

      // Create GIA-001 demo serial key
      const existingGiaKey = await masterDb.serialKey.findFirst({
        where: { key: 'EF-GIA1-2025-0001' },
      });

      if (!existingGiaKey) {
        await masterDb.serialKey.create({
          data: {
            key: 'EF-GIA1-2025-0001',
            clientId: demoClient.id,
            tenantId: demoTenant.id,
            plan: 'professional',
            maxDevices: 10,
            maxStudents: 2000,
            status: 'activated',
            activatedAt: new Date(),
          },
        });
      }

      console.log('✅ Seeded demo client and serial keys');
    }

    // ============================================
    // 5. Seed demo school + users in tenant DB
    // ============================================
    try {
      const tenantDb = await getTenantDbByCode('GIA-001');
      if (tenantDb) {
        let school = await tenantDb.school.findFirst();

        if (!school) {
          school = await tenantDb.school.create({
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
          console.log('✅ Seeded school in tenant DB');
        }

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
          console.log('✅ Seeded demo admin user in tenant DB');
        }

        // Seed sample data if no students exist
        const studentCount = await tenantDb.student.count({ where: { schoolId: school.id } });
        if (studentCount === 0) {
          await seedSampleData(tenantDb, school.id);
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

// ============================================
// Seed sample data for a fresh database
// ============================================
async function seedSampleData(
  tenantDb: NonNullable<Awaited<ReturnType<typeof getTenantDbByCode>>>,
  schoolId: string
) {
  try {
    // Create classes
    const classNames = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
    const classes = [];
    for (const name of classNames) {
      const cls = await tenantDb.class.create({
        data: { schoolId, name },
      });
      classes.push(cls);
    }

    // Create subjects
    const subjectNames = ['Mathematics', 'English', 'Science', 'Social Studies', 'Urdu', 'Computer Science', 'Physical Education', 'Art'];
    const subjects = [];
    for (const name of subjectNames) {
      const subject = await tenantDb.subject.create({
        data: { schoolId, name, code: name.substring(0, 3).toUpperCase() },
      });
      subjects.push(subject);
    }

    // Create sample students (each needs a User record for foreign key)
    const firstNames = ['Ahmed', 'Fatima', 'Muhammad', 'Aisha', 'Hassan', 'Zainab', 'Ali', 'Maryam', 'Omar', 'Khadija', 'Bilal', 'Amina', 'Usman', 'Hafsa', 'Ibrahim', 'Sana', 'Khalid', 'Noor', 'Tariq', 'Sadia'];
    const lastNames = ['Khan', 'Ahmed', 'Malik', 'Hussain', 'Raza', 'Ali', 'Shah', 'Naqvi', 'Siddiqui', 'Chaudhry', 'Butt', 'Sheikh', 'Hashmi', 'Qureshi', 'Farooq'];

    const students = [];
    let admissionNo = 1000;
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const cls = classes[i % classes.length];
      const email = `student.${i + 1}@greenfieldacademy.edu`;

      // Create User record first (required by FK constraint)
      const user = await tenantDb.user.create({
        data: {
          schoolId,
          email,
          password: 'hashed_student',
          name: `${firstName} ${lastName}`,
          role: 'student',
          status: 'active',
          isDemo: true,
        },
      });

      const student = await tenantDb.student.create({
        data: {
          schoolId,
          userId: user.id,
          admissionNo: `GIA-${++admissionNo}`,
          firstName,
          lastName,
          gender: i % 2 === 0 ? 'male' : 'female',
          dateOfBirth: new Date(2010 + Math.floor(i / 10), (i % 12), 15),
          classId: cls.id,
          status: 'active',
          riskLevel: i < 5 ? 'high' : i < 15 ? 'medium' : 'low',
        },
      });
      students.push(student);
    }

    // Create sample attendance for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const student of students) {
      const rand = Math.random();
      const status = rand > 0.15 ? 'present' : rand > 0.05 ? 'late' : 'absent';
      await tenantDb.attendance.create({
        data: {
          schoolId,
          studentId: student.id,
          date: today,
          status,
        },
      });
    }

    // Create fee payments
    for (const student of students.slice(0, 30)) {
      const isPaid = Math.random() > 0.3;
      await tenantDb.feePayment.create({
        data: {
          schoolId,
          studentId: student.id,
          amount: 15000,
          paidAmount: isPaid ? 15000 : 0,
          feeType: 'Tuition Fee',
          status: isPaid ? 'paid' : Math.random() > 0.5 ? 'pending' : 'overdue',
          dueDate: new Date(today.getFullYear(), today.getMonth(), 10),
          paidDate: isPaid ? new Date() : null,
        },
      });
    }

    // Create an announcement
    await tenantDb.announcement.create({
      data: {
        schoolId,
        title: 'Welcome to EduFlow ERP',
        content: 'We are excited to launch the AI-powered EduFlow Education Operating System. This platform will help manage all school operations efficiently.',
        type: 'general',
        priority: 'high',
      },
    });

    console.log('✅ Seeded sample data (50 students, 10 classes, 8 subjects, attendance, fees)');
  } catch (error) {
    console.log('⚠️ Sample data seeding partially failed:', (error as Error).message);
  }
}
