import { db } from '../src/lib/db'

async function seed() {
  console.log('🌱 Seeding new modules data...')

  const school = await db.school.findFirst()
  const schoolId = school?.id || 'clschool001greenfield'
  console.log(`Using schoolId: ${schoolId}`)

  const students = await db.student.findMany({ where: { schoolId }, take: 30 })
  const teachers = await db.teacher.findMany({ where: { schoolId }, take: 10 })

  // ── LMS: Courses ──
  console.log('Creating courses...')
  const courseData = [
    { title: 'Introduction to Computer Science', code: 'CS101', description: 'Fundamentals of programming and computational thinking', instructor: teachers[0] ? `${teachers[0].firstName} ${teachers[0].lastName}` : 'Dr. Smith', status: 'published', duration: 40 },
    { title: 'Advanced Mathematics', code: 'MATH201', description: 'Calculus, linear algebra, and differential equations', instructor: teachers[1] ? `${teachers[1].firstName} ${teachers[1].lastName}` : 'Prof. Johnson', status: 'published', duration: 60 },
    { title: 'Digital Marketing Fundamentals', code: 'MKT101', description: 'SEO, social media, and content marketing strategies', instructor: teachers[2] ? `${teachers[2].firstName} ${teachers[2].lastName}` : 'Ms. Davis', status: 'published', duration: 30 },
    { title: 'Physics Laboratory Techniques', code: 'PHY301', description: 'Experimental physics methods and data analysis', instructor: teachers[3] ? `${teachers[3].firstName} ${teachers[3].lastName}` : 'Dr. Wilson', status: 'published', duration: 45 },
    { title: 'English Literature Survey', code: 'ENG101', description: 'Survey of major English literary works and movements', instructor: teachers[4] ? `${teachers[4].firstName} ${teachers[4].lastName}` : 'Mrs. Brown', status: 'draft', duration: 35 },
    { title: 'Data Science with Python', code: 'DS201', description: 'Data analysis, visualization, and machine learning basics', instructor: teachers[0] ? `${teachers[0].firstName} ${teachers[0].lastName}` : 'Dr. Smith', status: 'published', duration: 50 },
  ]

  const courses = []
  for (const c of courseData) {
    const course = await db.course.create({ data: { schoolId, ...c } })
    courses.push(course)
  }

  // ── LMS: Materials ──
  console.log('Creating course materials...')
  const materialTypes = ['video', 'document', 'quiz']
  for (const course of courses) {
    for (let i = 0; i < 3; i++) {
      await db.courseMaterial.create({
        data: {
          courseId: course.id,
          title: `${course.title} - ${materialTypes[i].charAt(0).toUpperCase() + materialTypes[i].slice(1)} ${i + 1}`,
          type: materialTypes[i],
          order: i + 1,
          duration: materialTypes[i] === 'video' ? 45 : null,
        },
      })
    }
  }

  // ── LMS: Enrollments ──
  console.log('Creating enrollments...')
  const enrollmentStatuses = ['active', 'active', 'active', 'completed', 'active', 'dropped']
  for (const course of courses) {
    const enrolledStudents = [...students].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 8) + 5)
    for (let i = 0; i < enrolledStudents.length; i++) {
      const status = enrollmentStatuses[Math.floor(Math.random() * enrollmentStatuses.length)]
      const progress = status === 'completed' ? 100 : status === 'dropped' ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 80) + 10
      try {
        await db.courseEnrollment.create({
          data: {
            courseId: course.id,
            studentId: enrolledStudents[i].id,
            progress,
            status,
            enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            completedAt: status === 'completed' ? new Date() : null,
          },
        })
      } catch {
        // Skip duplicate enrollments
      }
    }
  }

  // ── Admissions ──
  console.log('Creating admission applications...')
  const admissionNames = [
    'Aarav Patel', 'Priya Sharma', 'Rohan Gupta', 'Ananya Singh', 'Vikram Reddy',
    'Sneha Iyer', 'Arjun Kumar', 'Meera Nair', 'Karan Joshi', 'Divya Menon',
    'Rahul Verma', 'Pooja Das', 'Aditya Rao', 'Kavitha Ram', 'Suresh Babu',
    'Lakshmi Devi', 'Harish Chandra', 'Sunita Kumari', 'Deepak Mehta', 'Nisha Agarwal',
  ]
  const admissionStatuses = ['applied', 'under review', 'accepted', 'rejected', 'waitlisted']
  const classes = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

  for (const name of admissionNames) {
    const firstName = name.split(' ')[0]
    const lastName = name.split(' ')[1]
    await db.admission.create({
      data: {
        schoolId,
        applicantName: name,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        phone: `+91 ${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        appliedClass: classes[Math.floor(Math.random() * classes.length)],
        previousSchool: `${['Delhi Public', "St. Mary's", 'Kendriya Vidyalaya', 'Army Public', 'DPS'][Math.floor(Math.random() * 5)]} School`,
        gpa: parseFloat((Math.random() * 2 + 2).toFixed(1)),
        status: admissionStatuses[Math.floor(Math.random() * admissionStatuses.length)],
        applicationDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        reviewDate: Math.random() > 0.4 ? new Date() : null,
      },
    })
  }

  // ── Placements ──
  console.log('Creating placements...')
  const companies = ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro', 'Flipkart', 'Adobe', 'Deloitte', 'Accenture']
  const positions = ['Software Engineer', 'Data Analyst', 'Product Manager', 'UX Designer', 'Business Analyst', 'DevOps Engineer', 'ML Engineer', 'Consultant']
  const placementStatuses = ['offered', 'accepted', 'accepted', 'accepted', 'rejected']

  for (let i = 0; i < 20; i++) {
    const student = students[Math.floor(Math.random() * students.length)]
    if (!student) continue
    await db.placement.create({
      data: {
        schoolId,
        studentId: student.id,
        companyName: companies[Math.floor(Math.random() * companies.length)],
        position: positions[Math.floor(Math.random() * positions.length)],
        package: parseFloat((Math.random() * 15 + 3).toFixed(1)),
        placementDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        type: Math.random() > 0.3 ? 'job' : 'internship',
        status: placementStatuses[Math.floor(Math.random() * placementStatuses.length)],
      },
    })
  }

  // ── Scholarships ──
  console.log('Creating scholarships...')
  const scholarshipData = [
    { name: 'Merit Excellence Award', amount: 50000, type: 'merit', eligibility: 'GPA > 3.8', status: 'active', applicationCount: 25 },
    { name: 'Need-Based Financial Aid', amount: 75000, type: 'need', eligibility: 'Family income < 5LPA', status: 'active', applicationCount: 40 },
    { name: 'Sports Achievement Scholarship', amount: 30000, type: 'sports', eligibility: 'State/National level sports', status: 'active', applicationCount: 15 },
    { name: 'Research Innovation Grant', amount: 100000, type: 'research', eligibility: 'Published research paper', status: 'active', applicationCount: 8 },
    { name: 'Community Service Award', amount: 25000, type: 'merit', eligibility: '100+ hours community service', status: 'active', applicationCount: 12 },
    { name: 'STEM Excellence Scholarship', amount: 60000, type: 'merit', eligibility: 'STEM GPA > 3.9', status: 'closed', applicationCount: 30 },
    { name: 'Women in Tech Scholarship', amount: 45000, type: 'merit', eligibility: 'Female students in CS/IT', status: 'active', applicationCount: 18 },
    { name: 'Rural Students Support', amount: 40000, type: 'need', eligibility: 'Rural background, GPA > 3.0', status: 'upcoming', applicationCount: 0 },
  ]

  for (const s of scholarshipData) {
    await db.scholarship.create({
      data: {
        schoolId,
        name: s.name,
        amount: s.amount,
        type: s.type,
        eligibility: s.eligibility,
        status: s.status,
        applicationCount: s.applicationCount,
        deadline: s.status === 'closed' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : s.status === 'upcoming' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        description: `${s.name} provides financial support of ₹${s.amount.toLocaleString()} to eligible students.`,
      },
    })
  }

  // ── Health Records ──
  console.log('Creating health records...')
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const allergies = ['None', 'Penicillin', 'Dust', 'Pollen', 'None', 'None', 'Peanuts', 'None', 'Latex', 'None']
  const conditions = ['None', 'None', 'Asthma', 'None', 'None', 'Diabetes', 'None', 'None', 'None', 'Eczema']

  for (const student of students.slice(0, 25)) {
    const height = Math.floor(Math.random() * 40) + 150
    const weight = Math.floor(Math.random() * 30) + 45
    await db.healthRecord.create({
      data: {
        schoolId,
        studentId: student.id,
        height,
        weight,
        bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
        vision: Math.random() > 0.7 ? '6/9' : '6/6',
        allergies: allergies[Math.floor(Math.random() * allergies.length)],
        conditions: conditions[Math.floor(Math.random() * conditions.length)],
        medications: Math.random() > 0.8 ? 'Inhaler' : null,
        lastCheckup: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        doctorName: `Dr. ${['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy'][Math.floor(Math.random() * 5)]}`,
      },
    })
  }

  // ── Labs ──
  console.log('Creating labs...')
  const labData = [
    { name: 'Physics Lab', department: 'Science', capacity: 35, equipment: 'Oscilloscopes, Spectrometers, Lenses, Pendulums', incharge: 'Dr. R.K. Sharma' },
    { name: 'Chemistry Lab', department: 'Science', capacity: 30, equipment: 'Fume Hoods, Bunsen Burners, pH Meters, Glassware', incharge: 'Dr. Anita Verma' },
    { name: 'Biology Lab', department: 'Science', capacity: 30, equipment: 'Microscopes, Specimens, Slides, Dissection Kits', incharge: 'Mrs. Sunita Devi' },
    { name: 'Computer Lab A', department: 'Computer Science', capacity: 40, equipment: 'Desktops (40), Projector, Printer', incharge: 'Mr. Rajesh Kumar' },
    { name: 'Computer Lab B', department: 'Computer Science', capacity: 35, equipment: 'Desktops (35), Server, Network Switch', incharge: 'Ms. Priya Nair' },
    { name: 'Electronics Lab', department: 'Electronics', capacity: 25, equipment: 'Oscilloscopes, Signal Generators, Breadboards, ICs', incharge: 'Dr. Manish Gupta' },
    { name: 'Language Lab', department: 'Languages', capacity: 30, equipment: 'Headsets (30), Audio Systems, Recording Equipment', incharge: 'Mrs. Kavitha Rao' },
  ]

  const labs = []
  for (const l of labData) {
    const lab = await db.lab.create({ data: { schoolId, ...l, status: 'active' } })
    labs.push(lab)
  }

  // ── Lab Schedules ──
  console.log('Creating lab schedules...')
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00']
  const subjects = await db.subject.findMany({ where: { schoolId } })
  const dbClasses = await db.class.findMany({ where: { schoolId } })

  for (const lab of labs) {
    const numSchedules = Math.floor(Math.random() * 5) + 3
    for (let i = 0; i < numSchedules; i++) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)]
      const cls = dbClasses[Math.floor(Math.random() * dbClasses.length)]
      if (!subject || !cls) continue
      const day = days[Math.floor(Math.random() * days.length)]
      const startTime = timeSlots[Math.floor(Math.random() * timeSlots.length)]
      const startHour = parseInt(startTime.split(':')[0])
      await db.labSchedule.create({
        data: {
          labId: lab.id,
          classId: cls.id,
          subjectId: subject.id,
          day,
          startTime,
          endTime: `${String(startHour + 1).padStart(2, '0')}:00`,
        },
      })
    }
  }

  console.log('✅ Seeding complete!')
  console.log(`  Courses: ${courses.length}`)
  console.log(`  Admissions: ${admissionNames.length}`)
  console.log(`  Placements: 20`)
  console.log(`  Scholarships: ${scholarshipData.length}`)
  console.log(`  Health Records: 25`)
  console.log(`  Labs: ${labs.length}`)
}

seed()
  .catch((e) => { console.error('Seed error:', e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
