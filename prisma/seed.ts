import { PrismaClient } from '@prisma/client'
import { hash } from 'crypto'

const prisma = new PrismaClient()

function simpleHash(password: string): string {
  // Simple hash for demo - in production use bcrypt
  return `hashed_${password}`
}

async function main() {
  console.log('🌱 Seeding EduFlow OS database...')

  // Create School
  const school = await prisma.school.create({
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
    },
  })

  console.log(`✅ Created school: ${school.name}`)

  // Create Academic Session
  const session = await prisma.academicSession.create({
    data: {
      schoolId: school.id,
      name: '2024-2025',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2025-06-30'),
      status: 'active',
    },
  })

  // Create Terms
  const term1 = await prisma.term.create({
    data: {
      sessionId: session.id,
      name: 'Fall Semester',
      startDate: new Date('2024-08-15'),
      endDate: new Date('2024-12-20'),
      status: 'completed',
    },
  })

  const term2 = await prisma.term.create({
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
  const adminUser = await prisma.user.create({
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

  // Create Principal User
  const principalUser = await prisma.user.create({
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

  console.log('✅ Created admin and principal users')

  // Create Subjects
  const subjects = await Promise.all([
    prisma.subject.create({ data: { schoolId: school.id, name: 'Mathematics', code: 'MATH', type: 'core' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'English Language', code: 'ENG', type: 'core' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Science', code: 'SCI', type: 'core' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Social Studies', code: 'SOC', type: 'core' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Computer Science', code: 'CS', type: 'elective' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Physical Education', code: 'PE', type: 'core' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Art & Design', code: 'ART', type: 'elective' } }),
    prisma.subject.create({ data: { schoolId: school.id, name: 'Music', code: 'MUS', type: 'elective' } }),
  ])

  console.log(`✅ Created ${subjects.length} subjects`)

  // Create Classes and Sections
  const classData = [
    { name: 'Grade 1', level: 'Primary' },
    { name: 'Grade 2', level: 'Primary' },
    { name: 'Grade 3', level: 'Primary' },
    { name: 'Grade 4', level: 'Primary' },
    { name: 'Grade 5', level: 'Primary' },
    { name: 'Grade 6', level: 'Middle' },
    { name: 'Grade 7', level: 'Middle' },
    { name: 'Grade 8', level: 'Middle' },
    { name: 'Grade 9', level: 'Secondary' },
    { name: 'Grade 10', level: 'Secondary' },
    { name: 'Grade 11', level: 'Senior' },
    { name: 'Grade 12', level: 'Senior' },
  ]

  const classes = []
  for (const cd of classData) {
    const cls = await prisma.class.create({
      data: {
        schoolId: school.id,
        name: cd.name,
        level: cd.level,
      },
    })
    // Create sections A and B for each class
    await prisma.section.create({ data: { classId: cls.id, name: 'A', capacity: 35 } })
    await prisma.section.create({ data: { classId: cls.id, name: 'B', capacity: 35 } })
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
    const user = await prisma.user.create({
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

    const teacher = await prisma.teacher.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        employeeId: `EMP-${String(i + 1).padStart(4, '0')}`,
        firstName: td.firstName,
        lastName: td.lastName,
        qualification: td.qualification,
        specialization: td.specialization,
        salary: td.salary,
        dateOfJoining: new Date(2020 + Math.floor(i / 3), Math.floor(Math.random() * 12), 1),
        status: 'active',
        performanceRating: 3.5 + Math.random() * 1.5,
      },
    })
    teachers.push(teacher)

    // Assign subjects to teachers
    const subjectIndex = i % subjects.length
    await prisma.teacherSubject.create({
      data: {
        teacherId: teacher.id,
        subjectId: subjects[subjectIndex].id,
        classId: classes[i % classes.length].id,
      },
    })
  }

  // Set class teachers
  for (let i = 0; i < Math.min(8, teachers.length); i++) {
    await prisma.class.update({
      where: { id: classes[i].id },
      data: { classTeacherId: teachers[i].id },
    })
  }

  console.log(`✅ Created ${teachers.length} teachers`)

  // Create Parents first
  const parentNames = [
    'John Smith', 'Mary Johnson', 'Robert Williams', 'Jennifer Brown', 'William Jones',
    'Patricia Davis', 'David Miller', 'Linda Wilson', 'James Moore', 'Elizabeth Taylor',
    'Thomas Anderson', 'Susan Thomas', 'Charles Jackson', 'Jessica White', 'Christopher Harris',
    'Sarah Martin', 'Daniel Thompson', 'Karen Garcia', 'Matthew Martinez', 'Nancy Robinson',
    'Anthony Clark', 'Betty Rodriguez', 'Richard Lewis', 'Margaret Lee', 'Joseph Walker',
    'Sandra Hall', 'Timothy Allen', 'Ashley Young', 'Kevin King', 'Donna Wright',
  ]

  const parents = []
  for (let i = 0; i < parentNames.length; i++) {
    const user = await prisma.user.create({
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

    const parent = await prisma.parent.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        name: parentNames[i],
        phone: `+1-555-03${String(i + 1).padStart(2, '0')}`,
        email: `parent${i + 1}@example.com`,
        occupation: ['Engineer', 'Doctor', 'Teacher', 'Business Owner', 'Lawyer', 'Nurse', 'Manager', 'Accountant'][i % 8],
        address: `${i + 100} Oak Street, Springfield`,
      },
    })
    parents.push(parent)
  }

  console.log(`✅ Created ${parents.length} parents`)

  // Create Students
  const firstNames = ['Aiden', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella',
    'Logan', 'Mia', 'Lucas', 'Charlotte', 'Alexander', 'Amelia', 'Benjamin', 'Harper', 'Jack', 'Evelyn',
    'Daniel', 'Abigail', 'Henry', 'Emily', 'Sebastian', 'Elizabeth', 'Owen', 'Sofia', 'Samuel', 'Avery',
    'Ryan', 'Ella', 'Nathan', 'Scarlett', 'Caleb', 'Grace', 'Christian', 'Lily', 'Dylan', 'Chloe',
    'Isaac', 'Zoey', 'Hunter', 'Penelope', 'Jayden', 'Layla', 'Aaron', 'Riley', 'Luke', 'Nora',
    'Gabriel', 'Eleanor', 'Julian', 'Hannah', 'Mateo', 'Lillian', 'Levi', 'Addison', 'Isaiah', 'Aubrey',
    'Thomas', 'Ellie', 'Joshua', 'Stella', 'Carter', 'Natalie', 'Wyatt', 'Zoe', 'Jayce', 'Leah',
    'Grayson', 'Hazel', 'Lincoln', 'Violet', 'Leo', 'Aurora', 'Easton', 'Savannah', 'Landon', 'Audrey',
    'Hudson', 'Brooklyn', 'Kai', 'Bella', 'Dominic', 'Claire', 'Jaxon', 'Skylar', 'Asher', 'Lucy',
    'Axel', 'Paisley', 'Ezra', 'Everly', 'Adam', 'Anna', 'Miles', 'Caroline', 'Connor', 'Nova']

  const lastNames = ['Patel', 'Kim', 'Singh', 'Wang', 'Nguyen', 'Kumar', 'Lopez', 'Chen', 'Park', 'Das',
    'Santos', 'Okafor', 'Ivanov', 'Costa', 'Yamamoto', 'Schmidt', 'Ali', 'Johansson', 'Fischer', 'Dubois',
    'Nakamura', 'Pereira', 'Kowalski', 'Bernardo', 'Eriksson', 'Tanaka', 'Morales', 'Lindberg', 'Ferrari', 'Sato']

  const students = []
  for (let i = 0; i < 80; i++) {
    const fn = firstNames[i % firstNames.length]
    const ln = lastNames[i % lastNames.length]
    const classIndex = i % classes.length
    const sections = await prisma.section.findMany({ where: { classId: classes[classIndex].id } })
    const section = sections[i % sections.length]
    const parent = parents[i % parents.length]
    const riskLevel = i % 12 === 0 ? 'high' : i % 6 === 0 ? 'medium' : 'low'

    const user = await prisma.user.create({
      data: {
        schoolId: school.id,
        email: `student.${fn.toLowerCase()}${i}@greenfieldacademy.edu`,
        password: simpleHash('student123'),
        name: `${fn} ${ln}`,
        role: 'student',
        status: 'active',
      },
    })

    const student = await prisma.student.create({
      data: {
        schoolId: school.id,
        userId: user.id,
        admissionNo: `STU-${String(2024000 + i).padStart(7, '0')}`,
        firstName: fn,
        lastName: ln,
        dateOfBirth: new Date(2007 + Math.floor(classIndex / 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        address: `${i + 1} Elm Street, Springfield`,
        bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'][i % 6],
        emergencyContact: `+1-555-99${String(i).padStart(2, '0')}`,
        classId: classes[classIndex].id,
        sectionId: section.id,
        parentId: parent.id,
        admissionDate: new Date(2024, 7, 15),
        status: 'active',
        riskLevel: riskLevel,
      },
    })
    students.push(student)
  }

  console.log(`✅ Created ${students.length} students`)

  // Create Attendance Records (last 30 days)
  const today = new Date()
  const attendanceStatuses = ['present', 'present', 'present', 'present', 'absent', 'late', 'excused']

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue

    for (const student of students.slice(0, 40)) { // Attendance for first 40 students
      const status = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)]
      try {
        await prisma.attendance.create({
          data: {
            schoolId: school.id,
            studentId: student.id,
            date: date,
            status: status,
            markedBy: teachers[0].id,
          },
        })
      } catch {
        // Skip duplicates
      }
    }
  }

  console.log('✅ Created attendance records')

  // Create Exams
  const examTypes = ['Mid-Term', 'Quiz 1', 'Quiz 2', 'Unit Test']
  const exams = []
  for (let i = 0; i < 8; i++) {
    const exam = await prisma.exam.create({
      data: {
        schoolId: school.id,
        subjectId: subjects[i % subjects.length].id,
        termId: term2.id,
        name: `${examTypes[i % examTypes.length]} - ${subjects[i % subjects.length].name}`,
        type: i % 3 === 0 ? 'written' : 'practical',
        totalMarks: 100,
        passingMarks: 40,
        date: new Date(2025, 1 + Math.floor(i / 4), 10 + i * 3),
        duration: 180,
      },
    })
    exams.push(exam)
  }

  // Create Exam Results
  for (const exam of exams) {
    for (const student of students.slice(0, 30)) {
      const marks = 30 + Math.floor(Math.random() * 65)
      let grade = 'F'
      if (marks >= 90) grade = 'A+'
      else if (marks >= 80) grade = 'A'
      else if (marks >= 70) grade = 'B'
      else if (marks >= 60) grade = 'C'
      else if (marks >= 50) grade = 'D'
      else if (marks >= 40) grade = 'E'

      try {
        await prisma.examResult.create({
          data: {
            examId: exam.id,
            studentId: student.id,
            marksObtained: marks,
            grade: grade,
            remarks: marks >= 70 ? 'Good performance' : marks >= 50 ? 'Needs improvement' : 'At risk',
          },
        })
      } catch {
        // Skip duplicates
      }
    }
  }

  console.log(`✅ Created ${exams.length} exams with results`)

  // Create Fee Structures
  const feeTypes = [
    { name: 'Tuition Fee', amount: 5000, frequency: 'quarterly' },
    { name: 'Lab Fee', amount: 1500, frequency: 'one_time' },
    { name: 'Library Fee', amount: 500, frequency: 'annually' },
    { name: 'Transport Fee', amount: 3000, frequency: 'quarterly' },
    { name: 'Sports Fee', amount: 800, frequency: 'annually' },
  ]

  for (const fee of feeTypes) {
    await prisma.feeStructure.create({
      data: {
        schoolId: school.id,
        name: fee.name,
        amount: fee.amount,
        frequency: fee.frequency,
      },
    })
  }

  // Create Fee Payments
  const feeStatuses = ['paid', 'paid', 'paid', 'pending', 'overdue', 'partial']
  for (const student of students.slice(0, 40)) {
    for (let f = 0; f < 3; f++) {
      const status = feeStatuses[Math.floor(Math.random() * feeStatuses.length)]
      const amount = 5000 + f * 1000
      await prisma.feePayment.create({
        data: {
          schoolId: school.id,
          studentId: student.id,
          amount: amount,
          paidAmount: status === 'paid' ? amount : status === 'partial' ? amount * 0.5 : 0,
          feeType: ['Tuition Fee', 'Lab Fee', 'Transport Fee'][f],
          status: status,
          dueDate: new Date(2025, f, 15),
          paidDate: status === 'paid' ? new Date(2025, f, 10 + Math.floor(Math.random() * 5)) : null,
          paymentMode: status === 'paid' ? ['cash', 'card', 'online'][f] : null,
          discount: Math.random() > 0.8 ? 500 : 0,
        },
      })
    }
  }

  console.log('✅ Created fee structures and payments')

  // Create Behavior Logs
  const behaviorTypes = ['positive', 'negative', 'neutral']
  const behaviorCategories = ['discipline', 'academic', 'extracurricular']
  const behaviorDescriptions = [
    'Excellent class participation',
    'Late submission of assignment',
    'Outstanding performance in sports',
    'Disrupting class behavior',
    'Helped a fellow student',
    'Unauthorized absence',
    'Science fair winner',
    'Homework not completed',
    'Perfect attendance this month',
    'Using phone during class',
  ]

  for (let i = 0; i < 30; i++) {
    await prisma.behaviorLog.create({
      data: {
        schoolId: school.id,
        studentId: students[i % students.length].id,
        type: behaviorTypes[i % 3],
        category: behaviorCategories[i % 3],
        description: behaviorDescriptions[i % behaviorDescriptions.length],
        action: i % 3 === 1 ? 'Warning issued' : i % 3 === 0 ? 'Praised' : 'Noted',
        reportedBy: teachers[i % teachers.length].id,
        date: new Date(today.getTime() - i * 86400000 * Math.random() * 7),
      },
    })
  }

  console.log('✅ Created behavior logs')

  // Create Announcements
  const announcements = [
    { title: 'Spring Semester Begins', content: 'Welcome back! Spring semester classes begin on January 10th. Please ensure all students have their materials ready.', type: 'academic', priority: 'high' },
    { title: 'Parent-Teacher Conference', content: 'Scheduled for February 15th. All parents are invited to discuss their child\'s progress.', type: 'event', priority: 'normal' },
    { title: 'Science Fair 2025', content: 'Registration open for the annual Science Fair. Projects due by March 1st.', type: 'event', priority: 'normal' },
    { title: 'Fee Payment Reminder', content: 'Q2 fees are due by January 31st. Late payments will incur a 5% surcharge.', type: 'general', priority: 'high' },
    { title: 'Holiday Notice', content: 'School will be closed from March 25-31 for Spring Break.', type: 'general', priority: 'normal' },
    { title: 'Emergency Drill', content: 'Fire drill scheduled for next Wednesday at 10 AM. All students and staff must participate.', type: 'emergency', priority: 'urgent' },
    { title: 'Sports Day', content: 'Annual Sports Day on April 15th. Register for events with your PE teacher.', type: 'event', priority: 'normal' },
  ]

  for (const ann of announcements) {
    await prisma.announcement.create({
      data: {
        schoolId: school.id,
        title: ann.title,
        content: ann.content,
        type: ann.type,
        target: 'all',
        priority: ann.priority,
      },
    })
  }

  console.log('✅ Created announcements')

  // Create Timetable Slots
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = [
    { start: '08:00', end: '08:45' },
    { start: '08:50', end: '09:35' },
    { start: '09:40', end: '10:25' },
    { start: '10:40', end: '11:25' },
    { start: '11:30', end: '12:15' },
    { start: '13:00', end: '13:45' },
    { start: '13:50', end: '14:35' },
  ]

  for (const cls of classes.slice(0, 6)) {
    for (const day of days) {
      for (let s = 0; s < timeSlots.length; s++) {
        const subjectIndex = s % subjects.length
        const teacherIndex = s % teachers.length
        await prisma.timetableSlot.create({
          data: {
            schoolId: school.id,
            classId: cls.id,
            teacherId: teachers[teacherIndex].id,
            subjectId: subjects[subjectIndex].id,
            day: day,
            startTime: timeSlots[s].start,
            endTime: timeSlots[s].end,
            room: `Room ${Math.floor(Math.random() * 30) + 100}`,
          },
        })
      }
    }
  }

  console.log('✅ Created timetable slots')

  // Create Notifications
  for (const user of [adminUser, principalUser]) {
    await prisma.notification.create({ data: { schoolId: school.id, userId: user.id, title: 'Welcome to EduFlow OS', message: 'Your AI-powered education operating system is ready!', type: 'success' } })
    await prisma.notification.create({ data: { schoolId: school.id, userId: user.id, title: 'Low Attendance Alert', message: '5 students have attendance below 75% this month', type: 'warning' } })
    await prisma.notification.create({ data: { schoolId: school.id, userId: user.id, title: 'Fee Collection Update', message: '78% of Q2 fees have been collected. 22% are pending or overdue.', type: 'info' } })
    await prisma.notification.create({ data: { schoolId: school.id, userId: user.id, title: 'AI Insight', message: 'Grade 9 Mathematics performance has declined 12% this term. Consider additional tutoring sessions.', type: 'warning' } })
  }

  console.log('✅ Created notifications')
  console.log('\n🎉 EduFlow OS database seeded successfully!')
  console.log('\n📋 Demo Login Credentials:')
  console.log('   Admin:    admin@greenfieldacademy.edu / admin123')
  console.log('   Principal: principal@greenfieldacademy.edu / principal123')
  console.log('   Teacher:  emily.chen@greenfieldacademy.edu / teacher123')
  console.log('   Parent:   parent1@example.com / parent123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
