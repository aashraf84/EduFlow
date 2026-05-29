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

  // ============================================
  // LIBRARY MANAGEMENT SEED DATA
  // ============================================

  const libraryBooks = await Promise.all([
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'Concepts of Physics', author: 'H.C. Verma', isbn: '978-8177091878', publisher: 'Bharati Bhawan', category: 'Science', totalCopies: 5, availableCopies: 3, shelfLocation: 'A-12', edition: '1st', price: 450, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'Calculus: Early Transcendentals', author: 'James Stewart', isbn: '978-1285741550', publisher: 'Cengage Learning', category: 'Mathematics', totalCopies: 4, availableCopies: 2, shelfLocation: 'A-15', edition: '8th', price: 1200, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0061120084', publisher: 'HarperCollins', category: 'Literature', totalCopies: 6, availableCopies: 5, shelfLocation: 'B-03', edition: '50th Anniversary', price: 350, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0553380163', publisher: 'Bantam', category: 'Science', totalCopies: 3, availableCopies: 1, shelfLocation: 'A-08', edition: 'Updated', price: 500, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', publisher: 'MIT Press', category: 'Computer Science', totalCopies: 4, availableCopies: 3, shelfLocation: 'C-01', edition: '3rd', price: 2500, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', publisher: 'Scribner', category: 'Literature', totalCopies: 5, availableCopies: 4, shelfLocation: 'B-05', edition: 'Reprint', price: 280, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'World History: Patterns of Interaction', author: 'McDougal Littell', isbn: '978-0547491127', publisher: 'Houghton Mifflin', category: 'History', totalCopies: 8, availableCopies: 6, shelfLocation: 'D-02', edition: '1st', price: 800, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'Organic Chemistry', author: 'Paula Bruice', isbn: '978-0134042282', publisher: 'Pearson', category: 'Science', totalCopies: 4, availableCopies: 2, shelfLocation: 'A-20', edition: '8th', price: 1500, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'Linear Algebra and Its Applications', author: 'Gilbert Strang', isbn: '978-0980232776', publisher: 'Wellesley-Cambridge', category: 'Mathematics', totalCopies: 3, availableCopies: 2, shelfLocation: 'A-18', edition: '4th', price: 900, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', publisher: 'Prentice Hall', category: 'Computer Science', totalCopies: 3, availableCopies: 1, shelfLocation: 'C-05', edition: '1st', price: 1800, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '978-0141439518', publisher: 'Penguin Classics', category: 'Literature', totalCopies: 6, availableCopies: 5, shelfLocation: 'B-08', edition: 'Reprint', price: 220, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'The Art of War', author: 'Sun Tzu', isbn: '978-1599869773', publisher: 'Filiquarian', category: 'History', totalCopies: 4, availableCopies: 3, shelfLocation: 'D-07', edition: 'Translation', price: 300, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'Biology: Life on Earth', author: 'Teresa Audesirk', isbn: '978-0321729712', publisher: 'Pearson', category: 'Science', totalCopies: 5, availableCopies: 3, shelfLocation: 'A-25', edition: '9th', price: 1400, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'Discrete Mathematics and Its Applications', author: 'Kenneth H. Rosen', isbn: '978-0073383095', publisher: 'McGraw-Hill', category: 'Mathematics', totalCopies: 4, availableCopies: 2, shelfLocation: 'A-22', edition: '7th', price: 1100, status: 'available' } }),
    prisma.libraryBook.create({ data: { schoolId: school.id, title: 'Python Crash Course', author: 'Eric Matthes', isbn: '978-1593279288', publisher: 'No Starch Press', category: 'Computer Science', totalCopies: 5, availableCopies: 4, shelfLocation: 'C-10', edition: '2nd', price: 1300, status: 'available' } }),
  ])

  console.log(`✅ Created ${libraryBooks.length} library books`)

  // Book Issues (10 issues)
  const bookIssueData = [
    { bookId: libraryBooks[0].id, studentId: students[0].id, issueDate: new Date('2025-01-10'), dueDate: new Date('2025-02-10'), returnDate: new Date('2025-02-08'), fine: 0, status: 'returned' },
    { bookId: libraryBooks[1].id, studentId: students[2].id, issueDate: new Date('2025-01-15'), dueDate: new Date('2025-02-15'), returnDate: null, fine: 0, status: 'issued' },
    { bookId: libraryBooks[3].id, studentId: students[5].id, issueDate: new Date('2025-01-05'), dueDate: new Date('2025-02-05'), returnDate: null, fine: 25, status: 'overdue' },
    { bookId: libraryBooks[4].id, studentId: students[8].id, issueDate: new Date('2025-02-01'), dueDate: new Date('2025-03-01'), returnDate: null, fine: 0, status: 'issued' },
    { bookId: libraryBooks[9].id, studentId: students[10].id, issueDate: new Date('2024-12-15'), dueDate: new Date('2025-01-15'), returnDate: new Date('2025-01-20'), fine: 15, status: 'returned' },
    { bookId: libraryBooks[2].id, studentId: students[15].id, issueDate: new Date('2025-02-10'), dueDate: new Date('2025-03-10'), returnDate: null, fine: 0, status: 'issued' },
    { bookId: libraryBooks[7].id, studentId: students[20].id, issueDate: new Date('2025-01-20'), dueDate: new Date('2025-02-20'), returnDate: null, fine: 30, status: 'overdue' },
    { bookId: libraryBooks[5].id, studentId: students[25].id, issueDate: new Date('2025-02-05'), dueDate: new Date('2025-03-05'), returnDate: new Date('2025-03-01'), fine: 0, status: 'returned' },
    { bookId: libraryBooks[14].id, studentId: students[30].id, issueDate: new Date('2025-02-15'), dueDate: new Date('2025-03-15'), returnDate: null, fine: 0, status: 'issued' },
    { bookId: libraryBooks[12].id, studentId: students[35].id, issueDate: new Date('2024-12-20'), dueDate: new Date('2025-01-20'), returnDate: null, fine: 50, status: 'overdue' },
  ]

  for (const issue of bookIssueData) {
    await prisma.bookIssue.create({ data: { schoolId: school.id, ...issue } })
  }

  console.log('✅ Created 10 book issues')

  // ============================================
  // TRANSPORT MANAGEMENT SEED DATA
  // ============================================

  const transportRoutes = await Promise.all([
    prisma.transportRoute.create({ data: { schoolId: school.id, routeName: 'North Springfield Express', routeNumber: 'R-01', driverName: 'Mike Johnson', driverPhone: '+1-555-1001', vehicleNo: 'BUS-001', capacity: 45, stops: 'Central Park, Oak Avenue, Maple Street, North Terminal', morningTime: '07:00', eveningTime: '15:30', status: 'active' } }),
    prisma.transportRoute.create({ data: { schoolId: school.id, routeName: 'South Springfield Route', routeNumber: 'R-02', driverName: 'Carlos Rivera', driverPhone: '+1-555-1002', vehicleNo: 'BUS-002', capacity: 40, stops: 'River Road, Pine Hills, South Gate, Elm Crossing', morningTime: '06:45', eveningTime: '15:45', status: 'active' } }),
    prisma.transportRoute.create({ data: { schoolId: school.id, routeName: 'East Side Connector', routeNumber: 'R-03', driverName: 'Sarah Williams', driverPhone: '+1-555-1003', vehicleNo: 'BUS-003', capacity: 42, stops: 'East Mall, Cedar Lane, Birch Road, Lake View', morningTime: '07:15', eveningTime: '15:15', status: 'active' } }),
    prisma.transportRoute.create({ data: { schoolId: school.id, routeName: 'West End Shuttle', routeNumber: 'R-04', driverName: 'Tom Anderson', driverPhone: '+1-555-1004', vehicleNo: 'BUS-004', capacity: 38, stops: 'West Park, Sunset Boulevard, Hill Crest, Valley View', morningTime: '07:00', eveningTime: '15:30', status: 'active' } }),
    prisma.transportRoute.create({ data: { schoolId: school.id, routeName: 'Downtown Loop', routeNumber: 'R-05', driverName: 'Raj Patel', driverPhone: '+1-555-1005', vehicleNo: 'BUS-005', capacity: 35, stops: 'City Center, Main Street, Market Square, Town Hall', morningTime: '07:30', eveningTime: '15:00', status: 'inactive' } }),
  ])

  console.log(`✅ Created ${transportRoutes.length} transport routes`)

  // Transport Assignments (20)
  for (let i = 0; i < 20; i++) {
    await prisma.transportAssignment.create({
      data: {
        schoolId: school.id,
        routeId: transportRoutes[i % transportRoutes.length].id,
        studentId: students[i].id,
        pickupPoint: ['Central Park', 'Oak Avenue', 'River Road', 'East Mall', 'West Park', 'City Center', 'Maple Street', 'Pine Hills', 'Cedar Lane', 'Sunset Boulevard'][i % 10],
        dropPoint: ['School Main Gate', 'School Main Gate', 'School Main Gate', 'School East Gate', 'School West Gate', 'School Main Gate', 'School Main Gate', 'School Main Gate', 'School East Gate', 'School West Gate'][i % 10],
        status: i === 19 ? 'inactive' : 'active',
      },
    })
  }

  console.log('✅ Created 20 transport assignments')

  // ============================================
  // HOSTEL & RESIDENCE SEED DATA
  // ============================================

  const boysHostel = await prisma.hostel.create({
    data: {
      schoolId: school.id,
      name: 'Nehru Boys Hostel',
      type: 'boys',
      capacity: 120,
      wardenName: 'Prof. Vikram Singh',
      wardenPhone: '+1-555-2001',
      floors: 3,
      status: 'active',
    },
  })

  const girlsHostel = await prisma.hostel.create({
    data: {
      schoolId: school.id,
      name: 'Indira Girls Hostel',
      type: 'girls',
      capacity: 100,
      wardenName: 'Dr. Meera Sharma',
      wardenPhone: '+1-555-2002',
      floors: 3,
      status: 'active',
    },
  })

  console.log('✅ Created 2 hostels')

  // Hostel Rooms (20 rooms - 10 per hostel)
  const hostelRooms = []
  const roomTypes = ['single', 'shared', 'shared', 'dormitory']
  const roomCapacities = [1, 2, 3, 4]

  for (let h = 0; h < 2; h++) {
    const hostel = h === 0 ? boysHostel : girlsHostel
    for (let f = 1; f <= 3; f++) {
      // 3-4 rooms per floor
      const roomsOnFloor = f === 1 ? 4 : 3
      for (let r = 1; r <= roomsOnFloor && hostelRooms.length < 20; r++) {
        const typeIndex = (h * 5 + f * 3 + r) % roomTypes.length
        const room = await prisma.hostelRoom.create({
          data: {
            hostelId: hostel.id,
            roomNumber: `${hostel.type === 'boys' ? 'B' : 'G'}-${f}${String(r).padStart(2, '0')}`,
            floor: f,
            capacity: roomCapacities[typeIndex],
            occupants: 0,
            roomType: roomTypes[typeIndex],
            status: 'available',
          },
        })
        hostelRooms.push(room)
      }
    }
  }

  console.log(`✅ Created ${hostelRooms.length} hostel rooms`)

  // Hostel Allocations (15)
  for (let i = 0; i < 15; i++) {
    const room = hostelRooms[i % hostelRooms.length]
    const studentIdx = i < 10 ? i : i + 10 // avoid conflict with transport-assigned students
    const student = students[studentIdx % students.length]

    await prisma.hostelAllocation.create({
      data: {
        schoolId: school.id,
        studentId: student.id,
        roomId: room.id,
        checkIn: new Date(2024, 8, 1),
        checkOut: null,
        status: 'active',
      },
    })

    // Update room occupants
    await prisma.hostelRoom.update({
      where: { id: room.id },
      data: { occupants: { increment: 1 } },
    })
  }

  console.log('✅ Created 15 hostel allocations')

  // ============================================
  // ALUMNI NETWORK SEED DATA
  // ============================================

  const alumniData = [
    { name: 'Rahul Mehta', email: 'rahul.mehta@techcorp.com', phone: '+1-555-3001', graduationYear: 2020, degree: 'High School Diploma', department: 'Science', currentCompany: 'Google', currentRole: 'Software Engineer', linkedIn: 'linkedin.com/in/rahulmehta' },
    { name: 'Priya Nair', email: 'priya.nair@medcenter.org', phone: '+1-555-3002', graduationYear: 2019, degree: 'High School Diploma', department: 'Science', currentCompany: 'Mayo Clinic', currentRole: 'Research Scientist', linkedIn: 'linkedin.com/in/priyanair' },
    { name: 'Alex Chen', email: 'alex.chen@finance.com', phone: '+1-555-3003', graduationYear: 2021, degree: 'High School Diploma', department: 'Commerce', currentCompany: 'Goldman Sachs', currentRole: 'Financial Analyst', linkedIn: 'linkedin.com/in/alexchen' },
    { name: 'Sarah Williams', email: 'sarah.w@startup.io', phone: '+1-555-3004', graduationYear: 2022, degree: 'High School Diploma', department: 'Science', currentCompany: 'Stripe', currentRole: 'Product Manager', linkedIn: 'linkedin.com/in/sarahwilliams' },
    { name: 'David Kim', email: 'david.kim@university.edu', phone: '+1-555-3005', graduationYear: 2018, degree: 'High School Diploma', department: 'Arts', currentCompany: 'Harvard University', currentRole: 'PhD Researcher', linkedIn: 'linkedin.com/in/davidkim' },
    { name: 'Emma Rodriguez', email: 'emma.r@design.co', phone: '+1-555-3006', graduationYear: 2023, degree: 'High School Diploma', department: 'Arts', currentCompany: 'Figma', currentRole: 'UX Designer', linkedIn: 'linkedin.com/in/emmarodriguez' },
    { name: 'James Okafor', email: 'james.o@energy.com', phone: '+1-555-3007', graduationYear: 2020, degree: 'High School Diploma', department: 'Science', currentCompany: 'Tesla', currentRole: 'Mechanical Engineer', linkedIn: 'linkedin.com/in/jamesokafor' },
    { name: 'Maria Santos', email: 'maria.s@lawfirm.com', phone: '+1-555-3008', graduationYear: 2017, degree: 'High School Diploma', department: 'Commerce', currentCompany: 'Baker McKenzie', currentRole: 'Associate Lawyer', linkedIn: 'linkedin.com/in/mariasantos' },
    { name: 'Ryan Tanaka', email: 'ryan.t@gaming.com', phone: '+1-555-3009', graduationYear: 2022, degree: 'High School Diploma', department: 'Science', currentCompany: 'Epic Games', currentRole: 'Game Developer', linkedIn: 'linkedin.com/in/ryantanaka' },
    { name: 'Sofia Müller', email: 'sofia.m@pharma.com', phone: '+1-555-3010', graduationYear: 2019, degree: 'High School Diploma', department: 'Science', currentCompany: 'Pfizer', currentRole: 'Biomedical Researcher', linkedIn: 'linkedin.com/in/sofiamuller' },
    { name: 'Wei Zhang', email: 'wei.z@ai-labs.com', phone: '+1-555-3011', graduationYear: 2021, degree: 'High School Diploma', department: 'Science', currentCompany: 'OpenAI', currentRole: 'ML Engineer', linkedIn: 'linkedin.com/in/weizhang' },
    { name: 'Aisha Khan', email: 'aisha.k@ngo.org', phone: '+1-555-3012', graduationYear: 2018, degree: 'High School Diploma', department: 'Arts', currentCompany: 'UNICEF', currentRole: 'Program Coordinator', linkedIn: 'linkedin.com/in/aishakhan' },
    { name: 'Lucas Fischer', email: 'lucas.f@consulting.com', phone: '+1-555-3013', graduationYear: 2023, degree: 'High School Diploma', department: 'Commerce', currentCompany: 'McKinsey', currentRole: 'Business Analyst', linkedIn: 'linkedin.com/in/lucasfischer' },
    { name: 'Nina Johansson', email: 'nina.j@space.org', phone: '+1-555-3014', graduationYear: 2020, degree: 'High School Diploma', department: 'Science', currentCompany: 'SpaceX', currentRole: 'Aerospace Engineer', linkedIn: 'linkedin.com/in/ninajohansson' },
    { name: 'Omar Ali', email: 'omar.a@bank.com', phone: '+1-555-3015', graduationYear: 2017, degree: 'High School Diploma', department: 'Commerce', currentCompany: 'JP Morgan', currentRole: 'Vice President', linkedIn: 'linkedin.com/in/omarali' },
    { name: 'Yuki Nakamura', email: 'yuki.n@robotics.co', phone: '+1-555-3016', graduationYear: 2022, degree: 'High School Diploma', department: 'Science', currentCompany: 'Boston Dynamics', currentRole: 'Robotics Engineer', linkedIn: 'linkedin.com/in/yukinakamura' },
    { name: 'Chen Wei', email: 'chen.w@ecommerce.com', phone: '+1-555-3017', graduationYear: 2021, degree: 'High School Diploma', department: 'Commerce', currentCompany: 'Amazon', currentRole: 'Operations Manager', linkedIn: 'linkedin.com/in/chenwei' },
    { name: 'Isabella Costa', email: 'isabella.c@fashion.com', phone: '+1-555-3018', graduationYear: 2023, degree: 'High School Diploma', department: 'Arts', currentCompany: 'Vogue', currentRole: 'Fashion Editor', linkedIn: 'linkedin.com/in/isabellacosta' },
    { name: 'Arjun Sharma', email: 'arjun.s@edtech.com', phone: '+1-555-3019', graduationYear: 2019, degree: 'High School Diploma', department: 'Science', currentCompany: 'BYJU\'S', currentRole: 'Content Lead', linkedIn: 'linkedin.com/in/arjunsharma' },
    { name: 'Fatima Al-Rashid', email: 'fatima.a@hospital.org', phone: '+1-555-3020', graduationYear: 2018, degree: 'High School Diploma', department: 'Science', currentCompany: 'Johns Hopkins', currentRole: 'Resident Doctor', linkedIn: 'linkedin.com/in/fatimaalrashid' },
  ]

  for (const a of alumniData) {
    await prisma.alumni.create({
      data: {
        schoolId: school.id,
        ...a,
        address: `${Math.floor(Math.random() * 999) + 1} Street, City`,
        status: 'active',
      },
    })
  }

  console.log(`✅ Created ${alumniData.length} alumni`)

  // ============================================
  // HR & PAYROLL SEED DATA
  // ============================================

  const staffMembers = []
  const staffData = [
    { name: 'Robert Clarke', email: 'robert.clarke@greenfieldacademy.edu', phone: '+1-555-4001', department: 'Administration', designation: 'Office Manager', salary: 42000 },
    { name: 'Linda Park', email: 'linda.park@greenfieldacademy.edu', phone: '+1-555-4002', department: 'Maintenance', designation: 'Maintenance Supervisor', salary: 38000 },
    { name: 'Frank Torres', email: 'frank.torres@greenfieldacademy.edu', phone: '+1-555-4003', department: 'Security', designation: 'Security Head', salary: 36000 },
    { name: 'Grace Lee', email: 'grace.lee@greenfieldacademy.edu', phone: '+1-555-4004', department: 'IT', designation: 'IT Administrator', salary: 48000 },
    { name: 'Henry Adams', email: 'henry.adams@greenfieldacademy.edu', phone: '+1-555-4005', department: 'Finance', designation: 'Accountant', salary: 45000 },
    { name: 'Irene Chang', email: 'irene.chang@greenfieldacademy.edu', phone: '+1-555-4006', department: 'Administration', designation: 'Receptionist', salary: 32000 },
    { name: 'George Patel', email: 'george.patel@greenfieldacademy.edu', phone: '+1-555-4007', department: 'Maintenance', designation: 'Electrician', salary: 34000 },
    { name: 'Diana Ross', email: 'diana.ross@greenfieldacademy.edu', phone: '+1-555-4008', department: 'Library', designation: 'Librarian', salary: 40000 },
  ]

  for (let i = 0; i < staffData.length; i++) {
    const s = staffData[i]
    const staff = await prisma.staffMember.create({
      data: {
        schoolId: school.id,
        employeeId: `STF-${String(i + 1).padStart(4, '0')}`,
        name: s.name,
        email: s.email,
        phone: s.phone,
        department: s.department,
        designation: s.designation,
        dateOfJoining: new Date(2019 + Math.floor(i / 3), Math.floor(Math.random() * 12), 1),
        salary: s.salary,
        bankAccount: `XXXX-${String(1000 + i).padStart(4, '0')}`,
        panNumber: `PAN${String(10000 + i)}`,
        status: 'active',
      },
    })
    staffMembers.push(staff)
  }

  console.log(`✅ Created ${staffMembers.length} staff members`)

  // Payroll Records (24 - 3 months x 8 staff)
  const payrollMonths = ['2025-01', '2025-02', '2025-03']
  for (const month of payrollMonths) {
    for (const staff of staffMembers) {
      const basicPay = staff.salary! / 12
      const allowances = basicPay * 0.2
      const deductions = basicPay * 0.1
      const netPay = basicPay + allowances - deductions
      await prisma.payrollRecord.create({
        data: {
          schoolId: school.id,
          staffId: staff.id,
          month,
          basicPay: Math.round(basicPay * 100) / 100,
          allowances: Math.round(allowances * 100) / 100,
          deductions: Math.round(deductions * 100) / 100,
          netPay: Math.round(netPay * 100) / 100,
          status: month === '2025-03' ? 'pending' : 'paid',
          paidDate: month === '2025-03' ? null : new Date(2025, parseInt(month.split('-')[1]) - 1, 28),
        },
      })
    }
  }

  console.log('✅ Created 24 payroll records')

  // Leave Records (10)
  const leaveData = [
    { staffId: staffMembers[0].id, leaveType: 'casual', startDate: new Date('2025-01-20'), endDate: new Date('2025-01-21'), days: 2, reason: 'Personal work', status: 'approved', approvedBy: 'Dr. Sarah Mitchell' },
    { staffId: staffMembers[1].id, leaveType: 'sick', startDate: new Date('2025-02-10'), endDate: new Date('2025-02-12'), days: 3, reason: 'Fever and cold', status: 'approved', approvedBy: 'Dr. Sarah Mitchell' },
    { staffId: staffMembers[2].id, leaveType: 'earned', startDate: new Date('2025-03-01'), endDate: new Date('2025-03-05'), days: 5, reason: 'Family vacation', status: 'approved', approvedBy: 'Dr. Sarah Mitchell' },
    { staffId: staffMembers[3].id, leaveType: 'casual', startDate: new Date('2025-01-15'), endDate: new Date('2025-01-15'), days: 1, reason: 'Medical appointment', status: 'approved', approvedBy: 'Dr. Sarah Mitchell' },
    { staffId: staffMembers[4].id, leaveType: 'sick', startDate: new Date('2025-02-20'), endDate: new Date('2025-02-21'), days: 2, reason: 'Migraine', status: 'pending', approvedBy: null },
    { staffId: staffMembers[5].id, leaveType: 'casual', startDate: new Date('2025-03-10'), endDate: new Date('2025-03-10'), days: 1, reason: 'House moving', status: 'pending', approvedBy: null },
    { staffId: staffMembers[6].id, leaveType: 'earned', startDate: new Date('2025-04-01'), endDate: new Date('2025-04-07'), days: 7, reason: 'Pilgrimage', status: 'pending', approvedBy: null },
    { staffId: staffMembers[7].id, leaveType: 'sick', startDate: new Date('2025-01-28'), endDate: new Date('2025-01-29'), days: 2, reason: 'Dental surgery', status: 'approved', approvedBy: 'Dr. Sarah Mitchell' },
    { staffId: staffMembers[0].id, leaveType: 'casual', startDate: new Date('2025-03-17'), endDate: new Date('2025-03-17'), days: 1, reason: 'Child school event', status: 'rejected', approvedBy: 'Dr. Sarah Mitchell' },
    { staffId: staffMembers[3].id, leaveType: 'earned', startDate: new Date('2025-05-01'), endDate: new Date('2025-05-10'), days: 10, reason: 'International conference', status: 'pending', approvedBy: null },
  ]

  for (const leave of leaveData) {
    await prisma.leaveRecord.create({
      data: {
        schoolId: school.id,
        ...leave,
      },
    })
  }

  console.log('✅ Created 10 leave records')

  // ============================================
  // INVENTORY & ASSET SEED DATA
  // ============================================

  const assetsData = [
    { name: 'Dell OptiPlex Desktop', assetCode: 'AST-PC-001', category: 'Computers', purchaseDate: new Date('2023-06-15'), purchaseCost: 1200, condition: 'good', location: 'Computer Lab 1', assignedTo: 'IT Department', vendor: 'Dell Technologies', warrantyEnd: new Date('2026-06-15'), depreciation: 400, status: 'active' },
    { name: 'HP LaserJet Printer', assetCode: 'AST-PRN-001', category: 'Computers', purchaseDate: new Date('2023-08-20'), purchaseCost: 800, condition: 'good', location: 'Admin Office', assignedTo: 'Administration', vendor: 'HP Inc.', warrantyEnd: new Date('2025-08-20'), depreciation: 267, status: 'active' },
    { name: 'Student Desk Set (40 units)', assetCode: 'AST-FUR-001', category: 'Furniture', purchaseDate: new Date('2022-01-10'), purchaseCost: 8000, condition: 'fair', location: 'Room 101-104', assignedTo: 'Classrooms', vendor: 'School Furniture Co.', warrantyEnd: null, depreciation: 4000, status: 'active' },
    { name: 'Microscope Set (10 units)', assetCode: 'AST-LAB-001', category: 'Lab Equipment', purchaseDate: new Date('2023-03-01'), purchaseCost: 5000, condition: 'good', location: 'Biology Lab', assignedTo: 'Science Department', vendor: 'Scientific Instruments Ltd.', warrantyEnd: new Date('2026-03-01'), depreciation: 1667, status: 'active' },
    { name: 'Basketball Hoop System', assetCode: 'AST-SPT-001', category: 'Sports Equipment', purchaseDate: new Date('2024-01-15'), purchaseCost: 2500, condition: 'excellent', location: 'Sports Ground', assignedTo: 'PE Department', vendor: 'Sports World', warrantyEnd: new Date('2027-01-15'), depreciation: 500, status: 'active' },
    { name: 'School Bus - 45 Seater', assetCode: 'AST-VHC-001', category: 'Vehicles', purchaseDate: new Date('2021-07-01'), purchaseCost: 65000, condition: 'good', location: 'Parking Lot', assignedTo: 'Transport Department', vendor: 'Volvo Buses', warrantyEnd: new Date('2026-07-01'), depreciation: 26000, status: 'active' },
    { name: 'Projector - Epson EB-X51', assetCode: 'AST-PRJ-001', category: 'Computers', purchaseDate: new Date('2024-02-10'), purchaseCost: 950, condition: 'excellent', location: 'Auditorium', assignedTo: 'AV Department', vendor: 'Epson', warrantyEnd: new Date('2027-02-10'), depreciation: 190, status: 'active' },
    { name: 'Chemistry Lab Kit', assetCode: 'AST-LAB-002', category: 'Lab Equipment', purchaseDate: new Date('2023-09-01'), purchaseCost: 3500, condition: 'good', location: 'Chemistry Lab', assignedTo: 'Science Department', vendor: 'ChemLab Supplies', warrantyEnd: new Date('2025-09-01'), depreciation: 1167, status: 'active' },
    { name: 'Library Bookshelf Set', assetCode: 'AST-FUR-002', category: 'Furniture', purchaseDate: new Date('2022-05-20'), purchaseCost: 4500, condition: 'good', location: 'Library', assignedTo: 'Library', vendor: 'WoodCraft Furniture', warrantyEnd: null, depreciation: 2250, status: 'active' },
    { name: 'Cricket Kit (Complete)', assetCode: 'AST-SPT-002', category: 'Sports Equipment', purchaseDate: new Date('2024-04-01'), purchaseCost: 1800, condition: 'good', location: 'Sports Room', assignedTo: 'PE Department', vendor: 'SG Sports', warrantyEnd: new Date('2025-04-01'), depreciation: 600, status: 'active' },
    { name: 'MacBook Pro M2', assetCode: 'AST-PC-002', category: 'Computers', purchaseDate: new Date('2024-06-15'), purchaseCost: 2200, condition: 'excellent', location: 'IT Room', assignedTo: 'IT Administrator', vendor: 'Apple Inc.', warrantyEnd: new Date('2027-06-15'), depreciation: 440, status: 'active' },
    { name: 'Physics Lab Equipment Set', assetCode: 'AST-LAB-003', category: 'Lab Equipment', purchaseDate: new Date('2023-01-10'), purchaseCost: 6000, condition: 'fair', location: 'Physics Lab', assignedTo: 'Science Department', vendor: 'Physics Instruments Co.', warrantyEnd: new Date('2025-01-10'), depreciation: 3000, status: 'active' },
    { name: 'Whiteboard Set (20 units)', assetCode: 'AST-FUR-003', category: 'Furniture', purchaseDate: new Date('2024-01-05'), purchaseCost: 3000, condition: 'excellent', location: 'Classrooms', assignedTo: 'Academic Block', vendor: 'BoardMaster', warrantyEnd: null, depreciation: 600, status: 'active' },
    { name: 'School Van - 18 Seater', assetCode: 'AST-VHC-002', category: 'Vehicles', purchaseDate: new Date('2022-03-15'), purchaseCost: 35000, condition: 'fair', location: 'Parking Lot', assignedTo: 'Transport Department', vendor: 'Toyota', warrantyEnd: new Date('2025-03-15'), depreciation: 17500, status: 'active' },
    { name: 'Table Tennis Table', assetCode: 'AST-SPT-003', category: 'Sports Equipment', purchaseDate: new Date('2023-11-01'), purchaseCost: 1200, condition: 'good', location: 'Indoor Sports Hall', assignedTo: 'PE Department', vendor: 'Stiga', warrantyEnd: new Date('2025-11-01'), depreciation: 400, status: 'active' },
  ]

  for (const asset of assetsData) {
    await prisma.asset.create({ data: { schoolId: school.id, ...asset } })
  }

  console.log(`✅ Created ${assetsData.length} assets`)

  // ============================================
  // LMS / ONLINE LEARNING SEED DATA
  // ============================================

  const courses = []
  const courseData = [
    { title: 'Introduction to Python Programming', code: 'CS-101', description: 'Learn Python from scratch - variables, loops, functions, and OOP concepts', instructor: teachers[4].firstName + ' ' + teachers[4].lastName, classId: classes[8].id, subjectId: subjects[4].id, duration: 40, status: 'published' },
    { title: 'Advanced Mathematics', code: 'MATH-201', description: 'Calculus, Linear Algebra, and Advanced Topics for Grade 11-12', instructor: teachers[0].firstName + ' ' + teachers[0].lastName, classId: classes[10].id, subjectId: subjects[0].id, duration: 60, status: 'published' },
    { title: 'English Literature Mastery', code: 'ENG-301', description: 'Deep dive into Shakespeare, modern poetry, and essay writing', instructor: teachers[1].firstName + ' ' + teachers[1].lastName, classId: classes[9].id, subjectId: subjects[1].id, duration: 35, status: 'published' },
    { title: 'Physics Fundamentals', code: 'PHY-101', description: 'Mechanics, Thermodynamics, and Optics with practical experiments', instructor: teachers[2].firstName + ' ' + teachers[2].lastName, classId: classes[8].id, subjectId: subjects[2].id, duration: 50, status: 'published' },
    { title: 'Web Development Bootcamp', code: 'CS-201', description: 'HTML, CSS, JavaScript, and React basics for building modern websites', instructor: teachers[11].firstName + ' ' + teachers[11].lastName, classId: classes[10].id, subjectId: subjects[4].id, duration: 45, status: 'draft' },
    { title: 'Environmental Science', code: 'EVS-101', description: 'Ecology, Climate Change, and Sustainability for a better future', instructor: teachers[9].firstName + ' ' + teachers[9].lastName, classId: classes[6].id, subjectId: subjects[3].id, duration: 30, status: 'archived' },
  ]

  for (const c of courseData) {
    const course = await prisma.course.create({
      data: {
        schoolId: school.id,
        ...c,
      },
    })
    courses.push(course)
  }

  console.log(`✅ Created ${courses.length} courses`)

  // Course Materials (18)
  const materialData = [
    { courseId: courses[0].id, title: 'Getting Started with Python', type: 'video', url: '/materials/python-intro.mp4', order: 1, duration: 45 },
    { courseId: courses[0].id, title: 'Variables and Data Types', type: 'video', url: '/materials/python-variables.mp4', order: 2, duration: 40 },
    { courseId: courses[0].id, title: 'Python Basics Worksheet', type: 'document', url: '/materials/python-worksheet-1.pdf', order: 3, duration: null },
    { courseId: courses[0].id, title: 'Quiz: Python Fundamentals', type: 'quiz', content: '{"questions":[{"q":"What is Python?","options":["A snake","A language","A framework","A database"],"answer":1}]}', order: 4, duration: 15 },
    { courseId: courses[1].id, title: 'Limits and Continuity', type: 'video', url: '/materials/math-limits.mp4', order: 1, duration: 55 },
    { courseId: courses[1].id, title: 'Derivatives Introduction', type: 'video', url: '/materials/math-derivatives.mp4', order: 2, duration: 50 },
    { courseId: courses[1].id, title: 'Calculus Practice Problems', type: 'document', url: '/materials/calculus-problems.pdf', order: 3, duration: null },
    { courseId: courses[2].id, title: 'Shakespeare: The Tempest Analysis', type: 'video', url: '/materials/tempest-analysis.mp4', order: 1, duration: 60 },
    { courseId: courses[2].id, title: 'Modern Poetry Study Guide', type: 'document', url: '/materials/poetry-guide.pdf', order: 2, duration: null },
    { courseId: courses[2].id, title: 'Essay Writing Techniques', type: 'video', url: '/materials/essay-writing.mp4', order: 3, duration: 35 },
    { courseId: courses[3].id, title: 'Newton\'s Laws of Motion', type: 'video', url: '/materials/newtons-laws.mp4', order: 1, duration: 50 },
    { courseId: courses[3].id, title: 'Thermodynamics Basics', type: 'video', url: '/materials/thermo-basics.mp4', order: 2, duration: 45 },
    { courseId: courses[3].id, title: 'Physics Lab Manual', type: 'document', url: '/materials/physics-lab.pdf', order: 3, duration: null },
    { courseId: courses[3].id, title: 'Quiz: Mechanics', type: 'quiz', content: '{"questions":[{"q":"F = ?","options":["ma","mv","mv²","mgh"],"answer":0}]}', order: 4, duration: 20 },
    { courseId: courses[4].id, title: 'HTML & CSS Foundations', type: 'video', url: '/materials/html-css.mp4', order: 1, duration: 55 },
    { courseId: courses[4].id, title: 'JavaScript Essentials', type: 'video', url: '/materials/js-essentials.mp4', order: 2, duration: 60 },
    { courseId: courses[4].id, title: 'React Introduction', type: 'video', url: '/materials/react-intro.mp4', order: 3, duration: 50 },
    { courseId: courses[5].id, title: 'Ecosystem Dynamics', type: 'video', url: '/materials/ecosystem.mp4', order: 1, duration: 40 },
  ]

  for (const m of materialData) {
    await prisma.courseMaterial.create({ data: m })
  }

  console.log('✅ Created 18 course materials')

  // Course Enrollments (20)
  for (let i = 0; i < 20; i++) {
    const courseIdx = i % courses.length
    const studentIdx = i % students.length
    try {
      await prisma.courseEnrollment.create({
        data: {
          courseId: courses[courseIdx].id,
          studentId: students[studentIdx].id,
          progress: Math.round(Math.random() * 100),
          enrolledAt: new Date(2025, 0, 10 + i),
          completedAt: Math.random() > 0.8 ? new Date(2025, 2, 1) : null,
          status: Math.random() > 0.9 ? 'completed' : 'active',
        },
      })
    } catch {
      // Skip duplicate enrollments
    }
  }

  console.log('✅ Created 20 course enrollments')

  // ============================================
  // ADMISSION PORTAL SEED DATA
  // ============================================

  const admissionsData = [
    { applicantName: 'Aarav Gupta', email: 'aarav.gupta@email.com', phone: '+1-555-5001', appliedClass: 'Grade 9', previousSchool: 'Delhi Public School', gpa: 3.8, status: 'applied', applicationDate: new Date('2025-01-15'), remarks: 'Strong academic record' },
    { applicantName: 'Zara Ahmed', email: 'zara.ahmed@email.com', phone: '+1-555-5002', appliedClass: 'Grade 10', previousSchool: 'Springfield Middle', gpa: 3.5, status: 'reviewed', applicationDate: new Date('2025-01-18'), reviewedBy: 'Dr. Sarah Mitchell', reviewDate: new Date('2025-01-22'), remarks: 'Good extracurriculars' },
    { applicantName: 'Ethan Brooks', email: 'ethan.brooks@email.com', phone: '+1-555-5003', appliedClass: 'Grade 11', previousSchool: 'Westfield Academy', gpa: 3.9, status: 'interviewed', applicationDate: new Date('2025-01-20'), reviewedBy: 'Prof. James Anderson', reviewDate: new Date('2025-01-25'), remarks: 'Excellent in sports and academics' },
    { applicantName: 'Maya Torres', email: 'maya.torres@email.com', phone: '+1-555-5004', appliedClass: 'Grade 8', previousSchool: 'Lincoln School', gpa: 3.2, status: 'offered', applicationDate: new Date('2025-01-10'), reviewedBy: 'Dr. Sarah Mitchell', reviewDate: new Date('2025-01-18'), remarks: 'Admission offer sent' },
    { applicantName: 'Noah Williams', email: 'noah.w@email.com', phone: '+1-555-5005', appliedClass: 'Grade 9', previousSchool: 'Riverside School', gpa: 3.6, status: 'enrolled', applicationDate: new Date('2025-01-05'), reviewedBy: 'Dr. Sarah Mitchell', reviewDate: new Date('2025-01-10'), remarks: 'Enrollment completed' },
    { applicantName: 'Isla Nakamura', email: 'isla.n@email.com', phone: '+1-555-5006', appliedClass: 'Grade 7', previousSchool: 'Sakura International', gpa: 3.7, status: 'applied', applicationDate: new Date('2025-02-01'), remarks: 'International transfer student' },
    { applicantName: 'Liam Patel', email: 'liam.patel@email.com', phone: '+1-555-5007', appliedClass: 'Grade 10', previousSchool: 'Sunrise Academy', gpa: 2.9, status: 'rejected', applicationDate: new Date('2025-01-12'), reviewedBy: 'Prof. James Anderson', reviewDate: new Date('2025-01-20'), remarks: 'Does not meet minimum GPA requirement' },
    { applicantName: 'Sophia Chen', email: 'sophia.c@email.com', phone: '+1-555-5008', appliedClass: 'Grade 11', previousSchool: 'Beijing International', gpa: 3.95, status: 'offered', applicationDate: new Date('2025-01-22'), reviewedBy: 'Dr. Sarah Mitchell', reviewDate: new Date('2025-01-28'), remarks: 'Merit scholarship candidate' },
    { applicantName: 'Oliver Schmidt', email: 'oliver.s@email.com', phone: '+1-555-5009', appliedClass: 'Grade 8', previousSchool: 'Berlin School', gpa: 3.4, status: 'waitlisted', applicationDate: new Date('2025-01-25'), reviewedBy: 'Prof. James Anderson', reviewDate: new Date('2025-02-01'), remarks: 'Waitlisted - limited seats' },
    { applicantName: 'Emma Rodriguez', email: 'emma.r2@email.com', phone: '+1-555-5010', appliedClass: 'Grade 9', previousSchool: 'Madrid High', gpa: 3.3, status: 'applied', applicationDate: new Date('2025-02-05'), remarks: 'Transfer from abroad' },
  ]

  for (const adm of admissionsData) {
    await prisma.admission.create({
      data: { schoolId: school.id, ...adm },
    })
  }

  console.log(`✅ Created ${admissionsData.length} admissions`)

  // ============================================
  // PLACEMENT & CAREER SEED DATA
  // ============================================

  const placementsData = [
    { studentId: students[0].id, companyName: 'Google', position: 'Software Engineering Intern', package: 85000, placementDate: new Date('2025-01-15'), type: 'internship', status: 'accepted' },
    { studentId: students[2].id, companyName: 'Microsoft', position: 'Cloud Engineering Intern', package: 78000, placementDate: new Date('2025-01-20'), type: 'internship', status: 'accepted' },
    { studentId: students[5].id, companyName: 'Amazon', position: 'Operations Intern', package: 72000, placementDate: new Date('2025-02-01'), type: 'internship', status: 'offered' },
    { studentId: students[8].id, companyName: 'Deloitte', position: 'Consulting Analyst', package: 65000, placementDate: new Date('2025-02-10'), type: 'job', status: 'accepted' },
    { studentId: students[10].id, companyName: 'Tesla', position: 'Engineering Intern', package: 80000, placementDate: new Date('2025-01-25'), type: 'internship', status: 'accepted' },
    { studentId: students[15].id, companyName: 'Goldman Sachs', position: 'Summer Analyst', package: 90000, placementDate: new Date('2025-02-15'), type: 'internship', status: 'offered' },
    { studentId: students[20].id, companyName: 'IBM', position: 'Data Scientist', package: 70000, placementDate: new Date('2025-03-01'), type: 'job', status: 'accepted' },
    { studentId: students[25].id, companyName: 'Accenture', position: 'Technology Analyst', package: 60000, placementDate: new Date('2025-02-20'), type: 'job', status: 'interviewed' },
  ]

  for (const p of placementsData) {
    await prisma.placement.create({
      data: { schoolId: school.id, ...p },
    })
  }

  console.log(`✅ Created ${placementsData.length} placements`)

  // ============================================
  // SCHOLARSHIP SEED DATA
  // ============================================

  const scholarshipsData = [
    { name: 'Academic Excellence Scholarship', description: 'Awarded to students with GPA above 3.8 and outstanding academic achievements', amount: 5000, eligibility: 'GPA >= 3.8, Top 5% in class', deadline: new Date('2025-04-30'), type: 'merit', status: 'active', applicationCount: 35 },
    { name: 'STEM Innovation Award', description: 'For students demonstrating exceptional talent in Science, Technology, Engineering, or Mathematics', amount: 3000, eligibility: 'Science stream, GPA >= 3.5, Project portfolio', deadline: new Date('2025-05-15'), type: 'merit', status: 'active', applicationCount: 22 },
    { name: 'Need-Based Financial Aid', description: 'Supporting families with annual income below $40,000 to ensure quality education access', amount: 4000, eligibility: 'Family income < $40,000, GPA >= 2.5', deadline: new Date('2025-03-31'), type: 'need', status: 'active', applicationCount: 48 },
    { name: 'Sports Achievement Scholarship', description: 'Recognizing outstanding athletes who represent the school at state or national level', amount: 2500, eligibility: 'State/National level participation, GPA >= 2.8', deadline: new Date('2025-06-01'), type: 'merit', status: 'active', applicationCount: 15 },
    { name: 'Community Service Award', description: 'For students who have made significant contributions to community service and social causes', amount: 2000, eligibility: '100+ hours community service, GPA >= 3.0', deadline: new Date('2025-05-30'), type: 'need', status: 'inactive', applicationCount: 12 },
  ]

  for (const s of scholarshipsData) {
    await prisma.scholarship.create({
      data: { schoolId: school.id, ...s },
    })
  }

  console.log(`✅ Created ${scholarshipsData.length} scholarships`)

  // ============================================
  // HEALTH & MEDICAL SEED DATA
  // ============================================

  for (let i = 0; i < 20; i++) {
    const student = students[i]
    await prisma.healthRecord.create({
      data: {
        schoolId: school.id,
        studentId: student.id,
        height: 150 + Math.floor(Math.random() * 30),
        weight: 40 + Math.floor(Math.random() * 30),
        bloodGroup: student.bloodGroup || 'O+',
        vision: i % 5 === 0 ? 'Needs correction' : 'Normal',
        allergies: i % 4 === 0 ? ['Peanuts', 'Dust', 'Pollen', 'Penicillin', 'Shellfish'][i % 5] : null,
        conditions: i % 6 === 0 ? ['Asthma', 'Diabetes Type 1', 'ADHD', 'Eczema'][i % 4] : null,
        medications: i % 6 === 0 ? ['Inhaler', 'Insulin', 'Ritalin', 'Antihistamine'][i % 4] : null,
        lastCheckup: new Date(2025, Math.floor(Math.random() * 3), 1 + Math.floor(Math.random() * 28)),
        doctorName: ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown'][i % 4],
        notes: i % 7 === 0 ? 'Requires regular monitoring' : null,
      },
    })
  }

  console.log('✅ Created 20 health records')

  // ============================================
  // LAB MANAGEMENT SEED DATA
  // ============================================

  const labs = []
  const labsData = [
    { name: 'Physics Lab', department: 'Science', capacity: 30, equipment: 'Oscilloscopes, Spectrometers, Pendulums, Lenses, Optical Benches, Multimeters', incharge: teachers[2].firstName + ' ' + teachers[2].lastName, status: 'active' },
    { name: 'Chemistry Lab', department: 'Science', capacity: 28, equipment: 'Fume Hoods, Bunsen Burners, Distillation Units, pH Meters, Analytical Balances', incharge: teachers[9].firstName + ' ' + teachers[9].lastName, status: 'active' },
    { name: 'Biology Lab', department: 'Science', capacity: 25, equipment: 'Microscopes, Specimens, Slides, Dissection Kits, Incubators', incharge: teachers[2].firstName + ' ' + teachers[2].lastName, status: 'active' },
    { name: 'Computer Lab', department: 'Computer Science', capacity: 40, equipment: 'Desktops (40), Projector, Interactive Board, 3D Printer, Server Rack', incharge: teachers[4].firstName + ' ' + teachers[4].lastName, status: 'active' },
  ]

  for (const l of labsData) {
    const lab = await prisma.lab.create({
      data: { schoolId: school.id, ...l },
    })
    labs.push(lab)
  }

  console.log(`✅ Created ${labs.length} labs`)

  // Lab Schedules (12)
  const labDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const labTimeSlots = [
    { start: '09:00', end: '10:30' },
    { start: '11:00', end: '12:30' },
    { start: '14:00', end: '15:30' },
  ]

  for (let i = 0; i < 12; i++) {
    await prisma.labSchedule.create({
      data: {
        labId: labs[i % labs.length].id,
        classId: classes[i % classes.length].id,
        subjectId: subjects[i % subjects.length].id,
        day: labDays[i % labDays.length],
        startTime: labTimeSlots[i % labTimeSlots.length].start,
        endTime: labTimeSlots[i % labTimeSlots.length].end,
      },
    })
  }

  console.log('✅ Created 12 lab schedules')

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
