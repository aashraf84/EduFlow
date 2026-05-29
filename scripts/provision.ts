import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { execSync } from 'child_process'

const NEON_HOST = process.env.NEON_HOST || ''
const NEON_DIRECT_HOST = process.env.NEON_DIRECT_HOST || ''
const NEON_USER = process.env.NEON_USER || ''
const NEON_PASSWORD = process.env.NEON_PASSWORD || ''

const masterDb = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

function simpleHash(password: string): string {
  return `hashed_${password}`
}

async function createDatabase(dbName: string) {
  const pool = new Pool({
    host: NEON_DIRECT_HOST,
    user: NEON_USER,
    password: NEON_PASSWORD,
    database: 'neondb',
    ssl: { rejectUnauthorized: false },
    max: 1,
  })

  try {
    const result = await pool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName])
    if (result.rows.length === 0) {
      await pool.query(`CREATE DATABASE "${dbName}"`)
      console.log(`✅ Created database: ${dbName}`)
    } else {
      console.log(`ℹ️ Database already exists: ${dbName}`)
    }
  } finally {
    await pool.end()
  }
}

async function pushSchema(dbUrl: string) {
  try {
    execSync(`npx prisma db push --skip-generate --accept-data-loss`, {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'pipe',
      timeout: 120000,
    })
    console.log('✅ Schema pushed to tenant database')
  } catch (error) {
    console.error('❌ Schema push failed:', error)
    throw error
  }
}

async function seedTenantData(dbUrl: string) {
  const tenantDb = new PrismaClient({ datasourceUrl: dbUrl })

  try {
    console.log('🌱 Seeding tenant database...')

    // Create School
    const school = await tenantDb.school.create({
      data: {
        name: 'Greenfield International Academy',
        code: 'GIA-001',
        address: '123 Education Boulevard',
        city: 'Springfield',
        state: 'Illinois',
        country: 'United States',
        phone: '+1-555-0100',
        email: 'admin@greenfieldacademy.edu',
        website: 'www.greenfieldacademy.edu',
        plan: 'growth',
        status: 'active',
        maxStudents: 2000,
        institutionType: 'school',
      },
    })
    console.log(`✅ Created school: ${school.name}`)

    // Create Academic Session
    const session = await tenantDb.academicSession.create({
      data: {
        schoolId: school.id,
        name: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-06-30'),
        status: 'active',
      },
    })

    const term1 = await tenantDb.term.create({
      data: {
        sessionId: session.id,
        name: 'Fall Semester',
        startDate: new Date('2024-08-15'),
        endDate: new Date('2024-12-20'),
        status: 'completed',
      },
    })

    const term2 = await tenantDb.term.create({
      data: {
        sessionId: session.id,
        name: 'Spring Semester',
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-06-15'),
        status: 'active',
      },
    })
    console.log('✅ Created academic session and terms')

    // Create Admin User
    const adminUser = await tenantDb.user.create({
      data: {
        schoolId: school.id,
        email: 'admin@greenfieldacademy.edu',
        password: simpleHash('admin123'),
        name: 'Dr. Sarah Mitchell',
        role: 'admin',
        phone: '+1-555-0101',
        status: 'active',
      },
    })

    // Create Demo User (view-only)
    const demoUser = await tenantDb.user.create({
      data: {
        schoolId: school.id,
        email: 'demo@greenfieldacademy.edu',
        password: simpleHash('demo123'),
        name: 'Demo Viewer',
        role: 'viewer',
        status: 'active',
        isDemo: true,
      },
    })
    console.log('✅ Created admin and demo users')

    // Create Principal User
    const principalUser = await tenantDb.user.create({
      data: {
        schoolId: school.id,
        email: 'principal@greenfieldacademy.edu',
        password: simpleHash('principal123'),
        name: 'Prof. James Anderson',
        role: 'principal',
        phone: '+1-555-0102',
        status: 'active',
      },
    })

    // Create Subjects
    const subjects = await Promise.all([
      tenantDb.subject.create({ data: { schoolId: school.id, name: 'Mathematics', code: 'MATH', type: 'core' } }),
      tenantDb.subject.create({ data: { schoolId: school.id, name: 'English Language', code: 'ENG', type: 'core' } }),
      tenantDb.subject.create({ data: { schoolId: school.id, name: 'Science', code: 'SCI', type: 'core' } }),
      tenantDb.subject.create({ data: { schoolId: school.id, name: 'Social Studies', code: 'SOC', type: 'core' } }),
      tenantDb.subject.create({ data: { schoolId: school.id, name: 'Computer Science', code: 'CS', type: 'elective' } }),
      tenantDb.subject.create({ data: { schoolId: school.id, name: 'Physical Education', code: 'PE', type: 'core' } }),
      tenantDb.subject.create({ data: { schoolId: school.id, name: 'Art & Design', code: 'ART', type: 'elective' } }),
      tenantDb.subject.create({ data: { schoolId: school.id, name: 'Music', code: 'MUS', type: 'elective' } }),
    ])
    console.log(`✅ Created ${subjects.length} subjects`)

    // Create Classes and Sections
    const classData = [
      { name: 'Grade 1', level: 'Primary' }, { name: 'Grade 2', level: 'Primary' },
      { name: 'Grade 3', level: 'Primary' }, { name: 'Grade 4', level: 'Primary' },
      { name: 'Grade 5', level: 'Primary' }, { name: 'Grade 6', level: 'Middle' },
      { name: 'Grade 7', level: 'Middle' }, { name: 'Grade 8', level: 'Middle' },
      { name: 'Grade 9', level: 'Secondary' }, { name: 'Grade 10', level: 'Secondary' },
      { name: 'Grade 11', level: 'Senior' }, { name: 'Grade 12', level: 'Senior' },
    ]

    const classes = []
    for (const cd of classData) {
      const cls = await tenantDb.class.create({
        data: { schoolId: school.id, name: cd.name, level: cd.level },
      })
      await tenantDb.section.create({ data: { classId: cls.id, name: 'A', capacity: 35 } })
      await tenantDb.section.create({ data: { classId: cls.id, name: 'B', capacity: 35 } })
      classes.push(cls)
    }
    console.log(`✅ Created ${classes.length} classes with sections`)

    // Create Teachers
    const teacherData = [
      { firstName: 'Emily', lastName: 'Chen', qualification: 'M.Ed', specialization: 'Mathematics', salary: 55000 },
      { firstName: 'Michael', lastName: 'Brown', qualification: 'M.A. English', specialization: 'English Language', salary: 52000 },
      { firstName: 'Priya', lastName: 'Sharma', qualification: 'M.Sc', specialization: 'Science', salary: 54000 },
      { firstName: 'David', lastName: 'Wilson', qualification: 'M.A. History', specialization: 'Social Studies', salary: 50000 },
      { firstName: 'Akira', lastName: 'Tanaka', qualification: 'M.Sc CS', specialization: 'Computer Science', salary: 60000 },
      { firstName: 'Lisa', lastName: 'Martinez', qualification: 'B.Ed', specialization: 'Physical Education', salary: 48000 },
      { firstName: 'Sofia', lastName: 'Rossi', qualification: 'M.F.A', specialization: 'Art & Design', salary: 47000 },
      { firstName: 'James', lastName: 'Taylor', qualification: 'M.Music', specialization: 'Music', salary: 47000 },
      { firstName: 'Aisha', lastName: 'Khan', qualification: 'M.Ed', specialization: 'Mathematics', salary: 53000 },
      { firstName: 'Robert', lastName: 'Johnson', qualification: 'M.Sc', specialization: 'Science', salary: 55000 },
      { firstName: 'Maria', lastName: 'Garcia', qualification: 'M.A', specialization: 'English Language', salary: 51000 },
      { firstName: 'Wei', lastName: 'Zhang', qualification: 'Ph.D', specialization: 'Computer Science', salary: 65000 },
    ]

    const teachers = []
    for (let i = 0; i < teacherData.length; i++) {
      const td = teacherData[i]
      const user = await tenantDb.user.create({
        data: {
          schoolId: school.id,
          email: `${td.firstName.toLowerCase()}.${td.lastName.toLowerCase()}@greenfieldacademy.edu`,
          password: simpleHash('teacher123'),
          name: `${td.firstName} ${td.lastName}`,
          role: 'teacher',
          phone: `+1-555-02${String(i + 1).padStart(2, '0')}`,
          status: 'active',
        },
      })

      const teacher = await tenantDb.teacher.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          employeeId: `EMP-${String(i + 1).padStart(4, '0')}`,
          firstName: td.firstName,
          lastName: td.lastName,
          qualification: td.qualification,
          specialization: td.specialization,
          salary: td.salary,
          status: 'active',
          performanceRating: 3.5 + Math.random() * 1.5,
        },
      })
      teachers.push(teacher)

      const subjectIndex = i % subjects.length
      await tenantDb.teacherSubject.create({
        data: {
          teacherId: teacher.id,
          subjectId: subjects[subjectIndex].id,
          classId: classes[i % classes.length].id,
        },
      })
    }

    for (let i = 0; i < Math.min(8, teachers.length); i++) {
      await tenantDb.class.update({
        where: { id: classes[i].id },
        data: { classTeacherId: teachers[i].id },
      })
    }
    console.log(`✅ Created ${teachers.length} teachers`)

    // Create Parents
    const parentNames = [
      'John Smith', 'Mary Johnson', 'Robert Williams', 'Jennifer Brown', 'William Jones',
      'Patricia Davis', 'David Miller', 'Linda Wilson', 'James Moore', 'Elizabeth Taylor',
      'Thomas Anderson', 'Susan Thomas', 'Charles Jackson', 'Jessica White', 'Christopher Harris',
      'Sarah Martin', 'Daniel Thompson', 'Karen Garcia', 'Matthew Martinez', 'Nancy Robinson',
    ]

    const parents = []
    for (let i = 0; i < parentNames.length; i++) {
      const user = await tenantDb.user.create({
        data: {
          schoolId: school.id,
          email: `parent${i + 1}@example.com`,
          password: simpleHash('parent123'),
          name: parentNames[i],
          role: 'parent',
          phone: `+1-555-03${String(i + 1).padStart(2, '0')}`,
          status: 'active',
        },
      })

      const parent = await tenantDb.parent.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          name: parentNames[i],
          phone: `+1-555-03${String(i + 1).padStart(2, '0')}`,
          email: `parent${i + 1}@example.com`,
          occupation: ['Engineer', 'Doctor', 'Teacher', 'Business Owner', 'Lawyer'][i % 5],
          address: `${i + 100} Oak Street, Springfield`,
        },
      })
      parents.push(parent)
    }
    console.log(`✅ Created ${parents.length} parents`)

    // Create Students
    const firstNames = ['Aiden', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella',
      'Logan', 'Mia', 'Lucas', 'Charlotte', 'Alexander', 'Amelia', 'Benjamin', 'Harper', 'Jack', 'Evelyn',
      'Daniel', 'Abigail', 'Henry', 'Emily', 'Sebastian', 'Elizabeth', 'Owen', 'Sofia', 'Samuel', 'Avery']

    const lastNames = ['Patel', 'Kim', 'Singh', 'Wang', 'Nguyen', 'Kumar', 'Lopez', 'Chen', 'Park', 'Das']

    const students = []
    for (let i = 0; i < 50; i++) {
      const fn = firstNames[i % firstNames.length]
      const ln = lastNames[i % lastNames.length]
      const classIndex = i % classes.length
      const sections = await tenantDb.section.findMany({ where: { classId: classes[classIndex].id } })
      const section = sections[i % sections.length]
      const parent = parents[i % parents.length]
      const riskLevel = i % 12 === 0 ? 'high' : i % 6 === 0 ? 'medium' : 'low'

      const user = await tenantDb.user.create({
        data: {
          schoolId: school.id,
          email: `student.${fn.toLowerCase()}${i}@greenfieldacademy.edu`,
          password: simpleHash('student123'),
          name: `${fn} ${ln}`,
          role: 'student',
          status: 'active',
        },
      })

      const student = await tenantDb.student.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          admissionNo: `STU-${String(2024000 + i).padStart(7, '0')}`,
          firstName: fn,
          lastName: ln,
          dateOfBirth: new Date(2007 + Math.floor(classIndex / 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: i % 2 === 0 ? 'Male' : 'Female',
          address: `${i + 1} Elm Street, Springfield`,
          bloodGroup: ['A+', 'B+', 'O+', 'AB+'][i % 4],
          emergencyContact: `+1-555-99${String(i).padStart(2, '0')}`,
          classId: classes[classIndex].id,
          sectionId: section.id,
          parentId: parent.id,
          status: 'active',
          riskLevel,
        },
      })
      students.push(student)
    }
    console.log(`✅ Created ${students.length} students`)

    // Create Attendance Records (last 10 days)
    const today = new Date()
    for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
      const date = new Date(today)
      date.setDate(date.getDate() - dayOffset)
      if (date.getDay() === 0 || date.getDay() === 6) continue

      for (const student of students.slice(0, 30)) {
        const status = ['present', 'present', 'present', 'absent', 'late'][Math.floor(Math.random() * 5)]
        try {
          await tenantDb.attendance.create({
            data: { schoolId: school.id, studentId: student.id, date, status, markedBy: teachers[0].id },
          })
        } catch { /* skip duplicates */ }
      }
    }
    console.log('✅ Created attendance records')

    // Create Exams
    const exams = []
    for (let i = 0; i < 8; i++) {
      const exam = await tenantDb.exam.create({
        data: {
          schoolId: school.id,
          subjectId: subjects[i % subjects.length].id,
          termId: term2.id,
          name: `Mid-Term - ${subjects[i % subjects.length].name}`,
          type: i % 3 === 0 ? 'written' : 'practical',
          totalMarks: 100,
          passingMarks: 40,
          date: new Date(2025, 1 + Math.floor(i / 4), 10 + i * 3),
          duration: 180,
        },
      })
      exams.push(exam)
    }

    for (const exam of exams) {
      for (const student of students.slice(0, 25)) {
        const marks = 30 + Math.floor(Math.random() * 65)
        let grade = 'F'
        if (marks >= 90) grade = 'A+'
        else if (marks >= 80) grade = 'A'
        else if (marks >= 70) grade = 'B'
        else if (marks >= 60) grade = 'C'
        else if (marks >= 50) grade = 'D'
        else if (marks >= 40) grade = 'E'
        try {
          await tenantDb.examResult.create({
            data: { examId: exam.id, studentId: student.id, marksObtained: marks, grade, remarks: marks >= 70 ? 'Good' : 'Needs improvement' },
          })
        } catch { /* skip */ }
      }
    }
    console.log(`✅ Created ${exams.length} exams with results`)

    // Create Fee Structures
    for (const fee of [
      { name: 'Tuition Fee', amount: 5000, frequency: 'quarterly' },
      { name: 'Lab Fee', amount: 1500, frequency: 'one_time' },
      { name: 'Library Fee', amount: 500, frequency: 'annually' },
    ]) {
      await tenantDb.feeStructure.create({ data: { schoolId: school.id, ...fee } })
    }

    // Create Fee Payments
    for (const student of students.slice(0, 25)) {
      for (let f = 0; f < 2; f++) {
        const status = ['paid', 'paid', 'pending', 'overdue'][Math.floor(Math.random() * 4)]
        const amount = 5000 + f * 1000
        await tenantDb.feePayment.create({
          data: {
            schoolId: school.id,
            studentId: student.id,
            amount,
            paidAmount: status === 'paid' ? amount : 0,
            feeType: ['Tuition Fee', 'Lab Fee'][f],
            status,
            dueDate: new Date(2025, f, 15),
            paidDate: status === 'paid' ? new Date(2025, f, 10) : null,
          },
        })
      }
    }
    console.log('✅ Created fee structures and payments')

    // Create Announcements
    for (const ann of [
      { title: 'Spring Semester Begins', content: 'Welcome back! Spring semester classes begin on January 10th.', type: 'academic', priority: 'high' },
      { title: 'Parent-Teacher Conference', content: 'Scheduled for February 15th.', type: 'event', priority: 'normal' },
      { title: 'Fee Payment Reminder', content: 'Q2 fees are due by January 31st.', type: 'general', priority: 'high' },
      { title: 'Sports Day', content: 'Annual Sports Day on April 15th.', type: 'event', priority: 'normal' },
    ]) {
      await tenantDb.announcement.create({
        data: { schoolId: school.id, ...ann, target: 'all' },
      })
    }
    console.log('✅ Created announcements')

    // Create Notifications
    for (const user of [adminUser, principalUser]) {
      await tenantDb.notification.create({ data: { schoolId: school.id, userId: user.id, title: 'Welcome to EduFlow OS', message: 'Your AI-powered education platform is ready!', type: 'success' } })
      await tenantDb.notification.create({ data: { schoolId: school.id, userId: user.id, title: 'Fee Collection Update', message: '78% of Q2 fees have been collected.', type: 'info' } })
    }
    console.log('✅ Created notifications')

    // Create Library Books
    const books = [
      { title: 'Concepts of Physics', author: 'H.C. Verma', category: 'Science', totalCopies: 5, availableCopies: 3, shelfLocation: 'A-12' },
      { title: 'Calculus: Early Transcendentals', author: 'James Stewart', category: 'Mathematics', totalCopies: 4, availableCopies: 2, shelfLocation: 'A-15' },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Literature', totalCopies: 6, availableCopies: 5, shelfLocation: 'B-03' },
      { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'Computer Science', totalCopies: 4, availableCopies: 3, shelfLocation: 'C-01' },
      { title: 'Clean Code', author: 'Robert C. Martin', category: 'Computer Science', totalCopies: 3, availableCopies: 1, shelfLocation: 'C-05' },
    ]
    for (const book of books) {
      await tenantDb.libraryBook.create({ data: { schoolId: school.id, ...book, status: 'available' } })
    }
    console.log('✅ Created library books')

    // Create Transport Routes
    for (const route of [
      { routeName: 'North Springfield Express', routeNumber: 'R-01', driverName: 'Mike Johnson', driverPhone: '+1-555-1001', vehicleNo: 'BUS-001' },
      { routeName: 'South Springfield Route', routeNumber: 'R-02', driverName: 'Carlos Rivera', driverPhone: '+1-555-1002', vehicleNo: 'BUS-002' },
      { routeName: 'East Side Connector', routeNumber: 'R-03', driverName: 'Sarah Williams', driverPhone: '+1-555-1003', vehicleNo: 'BUS-003' },
    ]) {
      await tenantDb.transportRoute.create({ data: { schoolId: school.id, ...route, capacity: 40, status: 'active' } })
    }
    console.log('✅ Created transport routes')

    // Create Hostels
    await tenantDb.hostel.create({
      data: { schoolId: school.id, name: 'Nehru Boys Hostel', type: 'boys', capacity: 120, wardenName: 'Prof. Vikram Singh', wardenPhone: '+1-555-2001', floors: 3, status: 'active' },
    })
    await tenantDb.hostel.create({
      data: { schoolId: school.id, name: 'Indira Girls Hostel', type: 'girls', capacity: 100, wardenName: 'Dr. Meera Sharma', wardenPhone: '+1-555-2002', floors: 3, status: 'active' },
    })
    console.log('✅ Created hostels')

    // Create Alumni
    for (const a of [
      { name: 'Rahul Mehta', email: 'rahul.mehta@techcorp.com', graduationYear: 2020, currentCompany: 'Google', currentRole: 'Software Engineer' },
      { name: 'Priya Nair', email: 'priya.nair@medcenter.org', graduationYear: 2019, currentCompany: 'Mayo Clinic', currentRole: 'Research Scientist' },
      { name: 'Alex Chen', email: 'alex.chen@finance.com', graduationYear: 2021, currentCompany: 'Goldman Sachs', currentRole: 'Financial Analyst' },
    ]) {
      await tenantDb.alumni.create({ data: { schoolId: school.id, ...a, status: 'active' } })
    }
    console.log('✅ Created alumni')

    // Create HR Staff
    for (const s of [
      { name: 'Robert Clarke', employeeId: 'STF-0001', email: 'robert.clarke@greenfieldacademy.edu', department: 'Administration', designation: 'Office Manager', salary: 42000 },
      { name: 'Linda Park', employeeId: 'STF-0002', email: 'linda.park@greenfieldacademy.edu', department: 'IT', designation: 'IT Administrator', salary: 48000 },
      { name: 'Grace Lee', employeeId: 'STF-0003', email: 'grace.lee@greenfieldacademy.edu', department: 'Finance', designation: 'Accountant', salary: 45000 },
    ]) {
      await tenantDb.staffMember.create({ data: { schoolId: school.id, ...s, status: 'active' } })
    }
    console.log('✅ Created staff members')

    console.log('🎉 Tenant database seeded successfully!')

  } finally {
    await tenantDb.$disconnect()
  }
}

async function main() {
  console.log('🚀 Provisioning EduFlow OS Multi-Tenant Platform...\n')

  // Step 1: Create the tenant database
  const tenantCode = 'GIA-001'
  const dbName = `eduflow_${tenantCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
  const poolerUrl = `postgresql://${NEON_USER}:${NEON_PASSWORD}@${NEON_HOST}/${dbName}?sslmode=require`
  const directUrl = `postgresql://${NEON_USER}:${NEON_PASSWORD}@${NEON_DIRECT_HOST}/${dbName}?sslmode=require`

  await createDatabase(dbName)
  await pushSchema(directUrl)

  // Step 2: Seed the master database
  console.log('\n🌱 Seeding master database...')

  // Create Owner User
  const existingOwner = await masterDb.ownerUser.findUnique({ where: { email: 'owner@eduflow.io' } })
  if (!existingOwner) {
    await masterDb.ownerUser.create({
      data: {
        email: 'owner@eduflow.io',
        password: simpleHash('owner123'),
        name: 'EduFlow Platform Owner',
        role: 'owner',
        phone: '+1-555-0000',
        status: 'active',
      },
    })
    console.log('✅ Created owner user')
  } else {
    console.log('ℹ️ Owner user already exists')
  }

  // Create Client
  const existingClient = await masterDb.client.findUnique({ where: { email: 'admin@greenfieldacademy.edu' } })
  let client = existingClient
  if (!existingClient) {
    client = await masterDb.client.create({
      data: {
        companyName: 'Greenfield International Academy',
        contactPerson: 'Dr. Sarah Mitchell',
        email: 'admin@greenfieldacademy.edu',
        phone: '+1-555-0100',
        address: '123 Education Boulevard',
        city: 'Springfield',
        state: 'Illinois',
        country: 'United States',
        status: 'active',
      },
    })
    console.log('✅ Created client')
  } else {
    console.log('ℹ️ Client already exists')
  }

  // Create Tenant
  const existingTenant = await masterDb.tenant.findUnique({ where: { code: tenantCode } })
  if (!existingTenant) {
    await masterDb.tenant.create({
      data: {
        name: 'Greenfield International Academy',
        code: tenantCode,
        databaseUrl: poolerUrl,
        databaseName: dbName,
        status: 'active',
        plan: 'growth',
        maxStudents: 2000,
        maxDevices: 5,
      },
    })
    console.log('✅ Created tenant')
  } else {
    // Update the database URL in case it changed
    await masterDb.tenant.update({
      where: { code: tenantCode },
      data: { databaseUrl: poolerUrl, databaseName: dbName },
    })
    console.log('ℹ️ Tenant already exists, updated database URL')
  }

  // Link client to tenant
  if (client) {
    await masterDb.client.update({
      where: { id: client.id },
      data: { tenantId: (await masterDb.tenant.findUnique({ where: { code: tenantCode } }))!.id },
    })
  }

  // Create Serial Key for the demo client
  const existingKey = await masterDb.serialKey.findFirst({ where: { clientId: client?.id } })
  if (!existingKey && client) {
    await masterDb.serialKey.create({
      data: {
        key: 'EDUF-2025-DEMO-GIA0-01AA-DEMO',
        clientId: client.id,
        tenantId: (await masterDb.tenant.findUnique({ where: { code: tenantCode } }))!.id,
        plan: 'growth',
        maxDevices: 5,
        maxStudents: 2000,
        status: 'activated',
        activatedAt: new Date(),
        expiresAt: new Date('2026-12-31'),
      },
    })
    console.log('✅ Created demo serial key')
  }

  // Step 3: Seed the tenant database
  console.log('\n🌱 Seeding tenant database...')
  await seedTenantData(poolerUrl)

  console.log('\n🎉 Multi-tenant provisioning complete!')
  console.log('\n📋 Login Credentials:')
  console.log('  Owner Login:   owner@eduflow.io / owner123 (School Code: OWNER)')
  console.log('  Admin Login:   admin@greenfieldacademy.edu / admin123 (School Code: GIA-001)')
  console.log('  Demo Login:    demo@greenfieldacademy.edu / demo123 (School Code: GIA-001)')
  console.log('  Teacher Login: emily.chen@greenfieldacademy.edu / teacher123 (School Code: GIA-001)')
  console.log('  Parent Login:  parent1@example.com / parent123 (School Code: GIA-001)')
  console.log('  Serial Key:    EDUF-2025-DEMO-GIA0-01AA-DEMO')
}

main()
  .catch((e) => {
    console.error('❌ Provisioning failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await masterDb.$disconnect()
  })
