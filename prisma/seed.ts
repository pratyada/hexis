import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding HEXIS database...')

  // Create owner/admin user
  const hashedPassword = await bcrypt.hash('hexis@2024', 12)

  const owner = await prisma.user.upsert({
    where: { email: 'owner@hexis.law' },
    update: {},
    create: {
      email: 'owner@hexis.law',
      name: 'Firm Owner',
      password: hashedPassword,
      role: 'OWNER',
      designation: 'Senior Advocate',
      barCouncilNo: 'D/1234/2001',
      phone: '+91-9999999999',
    },
  })

  const associate = await prisma.user.upsert({
    where: { email: 'associate@hexis.law' },
    update: {},
    create: {
      email: 'associate@hexis.law',
      name: 'Priya Sharma',
      password: hashedPassword,
      role: 'ASSOCIATE',
      designation: 'Associate Advocate',
      phone: '+91-9888888888',
    },
  })

  const clerk = await prisma.user.upsert({
    where: { email: 'clerk@hexis.law' },
    update: {},
    create: {
      email: 'clerk@hexis.law',
      name: 'Ramesh Kumar',
      password: hashedPassword,
      role: 'CLERK',
      designation: 'Office Clerk',
      phone: '+91-9777777777',
    },
  })

  // Sample clients
  const client1 = await prisma.client.upsert({
    where: { clientCode: 'HX-CLI-001' },
    update: {},
    create: {
      clientCode: 'HX-CLI-001',
      name: 'Rajesh Gupta',
      nameHindi: 'राजेश गुप्ता',
      email: 'rajesh.gupta@email.com',
      phone: '+91-9811111111',
      address: 'B-47, Lajpat Nagar II',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110024',
      clientType: 'INDIVIDUAL',
      occupation: 'Businessman',
    },
  })

  const client2 = await prisma.client.upsert({
    where: { clientCode: 'HX-CLI-002' },
    update: {},
    create: {
      clientCode: 'HX-CLI-002',
      name: 'Sunrise Technologies Pvt. Ltd.',
      email: 'legal@sunrise.tech',
      phone: '+91-1140000000',
      address: 'Tower A, Cyber City, DLF Phase 2',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      clientType: 'CORPORATE',
      companyName: 'Sunrise Technologies Pvt. Ltd.',
      gstin: '06AABCS1234A1Z5',
    },
  })

  const client3 = await prisma.client.upsert({
    where: { clientCode: 'HX-CLI-003' },
    update: {},
    create: {
      clientCode: 'HX-CLI-003',
      name: 'Meena Devi',
      nameHindi: 'मीना देवी',
      phone: '+91-9711111111',
      address: 'Village Mundka, West Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110041',
      clientType: 'INDIVIDUAL',
    },
  })

  // Sample cases
  const case1 = await prisma.case.upsert({
    where: { caseCode: 'HX-CASE-001' },
    update: {},
    create: {
      caseCode: 'HX-CASE-001',
      caseTitle: 'Rajesh Gupta vs Union of India',
      cnrNumber: 'DLHC010012345672024',
      caseNumber: 'W.P.(C) 12345/2024',
      caseType: 'WRIT',
      courtName: 'Delhi High Court',
      courtState: 'Delhi',
      courtDistrict: 'Delhi',
      benchType: 'HC',
      filingDate: new Date('2024-03-15'),
      status: 'ACTIVE',
      stage: 'HEARING',
      petitioner: 'Rajesh Gupta',
      respondent: 'Union of India & Ors.',
      clientId: client1.id,
      lawyerId: owner.id,
      retainerAmount: 150000,
      isPaid: true,
      priority: 'HIGH',
      description: 'Writ petition challenging arbitrary cancellation of import license under Foreign Trade Policy 2023.',
    },
  })

  const case2 = await prisma.case.upsert({
    where: { caseCode: 'HX-CASE-002' },
    update: {},
    create: {
      caseCode: 'HX-CASE-002',
      caseTitle: 'Sunrise Technologies vs ABC Corp - Arbitration',
      caseNumber: 'ARB/2024/0456',
      caseType: 'ARBITRATION',
      courtName: 'Delhi International Arbitration Centre',
      courtState: 'Delhi',
      benchType: 'TRIBUNAL',
      filingDate: new Date('2024-01-20'),
      status: 'ACTIVE',
      stage: 'EVIDENCE',
      petitioner: 'Sunrise Technologies Pvt. Ltd.',
      respondent: 'ABC Corporation Ltd.',
      clientId: client2.id,
      lawyerId: associate.id,
      retainerAmount: 500000,
      isPaid: false,
      priority: 'HIGH',
      description: 'Commercial arbitration for breach of software development contract worth ₹2.5 crores.',
    },
  })

  const case3 = await prisma.case.upsert({
    where: { caseCode: 'HX-CASE-003' },
    update: {},
    create: {
      caseCode: 'HX-CASE-003',
      caseTitle: 'Meena Devi vs Suresh Lal - Matrimonial',
      caseNumber: 'CS(OS) 789/2023',
      caseType: 'CIVIL',
      courtName: 'Saket District Court',
      courtState: 'Delhi',
      courtDistrict: 'South Delhi',
      benchType: 'DC',
      filingDate: new Date('2023-11-10'),
      status: 'ACTIVE',
      stage: 'ARGUMENTS',
      petitioner: 'Meena Devi',
      respondent: 'Suresh Lal',
      clientId: client3.id,
      lawyerId: owner.id,
      retainerAmount: 50000,
      isPaid: true,
      priority: 'MEDIUM',
      description: 'Divorce petition under Section 13 HMA with child custody dispute.',
    },
  })

  // Sample hearings
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextMonth = new Date(today)
  nextMonth.setDate(nextMonth.getDate() + 15)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 3)

  for (const hearingData of [
    {
      caseId: case1.id,
      lawyerId: owner.id,
      hearingDate: tomorrow,
      hearingTime: '10:30',
      courtRoom: 'Court No. 7',
      purpose: 'ARGUMENTS',
      status: 'SCHEDULED',
      notes: 'Arguments on maintainability. Prepare reply to preliminary objections.',
      complianceItems: JSON.stringify([
        'File written submissions on maintainability',
        'Compile case law on locus standi',
        'Serve copy to respondent counsel'
      ]),
    },
    {
      caseId: case2.id,
      lawyerId: associate.id,
      hearingDate: nextWeek,
      hearingTime: '14:00',
      purpose: 'EVIDENCE',
      status: 'SCHEDULED',
      notes: 'Cross-examination of Respondent witness No. 2 - Finance Director.',
      complianceItems: JSON.stringify([
        'Prepare cross-examination questions',
        'File list of documents for cross',
        'Brief client on evidence stage'
      ]),
    },
    {
      caseId: case3.id,
      lawyerId: owner.id,
      hearingDate: nextMonth,
      hearingTime: '11:00',
      courtRoom: 'Family Court 3',
      purpose: 'ARGUMENTS',
      status: 'SCHEDULED',
      notes: 'Final arguments on child custody. Review child welfare committee report.',
      complianceItems: JSON.stringify([
        'Collect child welfare committee report',
        'File consolidated written arguments',
        'Prepare financial affidavit update'
      ]),
    },
    {
      caseId: case1.id,
      lawyerId: owner.id,
      hearingDate: yesterday,
      hearingTime: '10:30',
      courtRoom: 'Court No. 7',
      purpose: 'ADMISSION',
      status: 'COMPLETED',
      outcome: 'Notice issued to respondents. Next date for compliance.',
      nextDate: tomorrow,
      notes: 'Case admitted. Counter affidavit to be filed within 4 weeks.',
    },
  ]) {
    await prisma.hearing.create({ data: hearingData })
  }

  // Sample tasks
  for (const taskData of [
    {
      title: 'File written submissions on maintainability',
      taskType: 'FILING',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: tomorrow,
      caseId: case1.id,
      assignedTo: owner.id,
    },
    {
      title: 'Collect court fee for new petition',
      taskType: 'COURT_FEE',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: nextWeek,
      caseId: case2.id,
      assignedTo: clerk.id,
    },
    {
      title: 'Research landmark judgments on import license cancellation',
      taskType: 'RESEARCH',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      caseId: case1.id,
      assignedTo: associate.id,
    },
    {
      title: 'Client meeting - Meena Devi for case update',
      taskType: 'CLIENT_CALL',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: nextMonth,
      caseId: case3.id,
      assignedTo: owner.id,
    },
  ]) {
    await prisma.task.create({ data: taskData })
  }

  // Sample legal precedents
  for (const precedentData of [
      {
        caseTitle: 'Maneka Gandhi v. Union of India',
        citation: 'AIR 1978 SC 597',
        court: 'Supreme Court of India',
        year: 1978,
        judgmentDate: new Date('1978-01-25'),
        bench: 'Constitution Bench (7 Judges)',
        holdingsSummary: 'Article 21 cannot be read in isolation. The procedure established by law must be fair, just and reasonable. Personal liberty has an expansive meaning.',
        legalPoints: JSON.stringify([
          'Article 21 interpretation - expanded scope',
          'Procedure must be fair, just and reasonable',
          'Mutual exclusivity of Fundamental Rights rejected',
          'Golden triangle - Articles 14, 19, 21'
        ]),
        actsReferred: JSON.stringify(['Constitution of India - Article 21', 'Passports Act 1967']),
        source: 'SCC',
        practiceArea: 'CONSTITUTIONAL',
        keywords: 'fundamental rights, personal liberty, passport, due process, Article 21',
      },
      {
        caseTitle: 'Arnesh Kumar v. State of Bihar',
        citation: '(2014) 8 SCC 273',
        court: 'Supreme Court of India',
        year: 2014,
        judgmentDate: new Date('2014-07-02'),
        holdingsSummary: 'Police officers must not arrest accused mechanically under Section 498A IPC. Magistrates must apply judicial mind before authorizing detention.',
        legalPoints: JSON.stringify([
          'Section 41 CrPC - conditions for arrest without warrant',
          'Section 41A CrPC - notice of appearance mandatory',
          'Magistrate duty to scrutinize arrest necessity',
          'Guidelines for 498A arrests'
        ]),
        actsReferred: JSON.stringify(['CrPC - Section 41', 'CrPC - Section 41A', 'IPC - Section 498A']),
        source: 'SCC',
        practiceArea: 'CRIMINAL',
        keywords: 'arrest, 498A, matrimonial, police, Section 41, anticipatory bail',
      },
      {
        caseTitle: 'Laltu Mandal v. Union of India',
        citation: '(2021) 3 SCC 45',
        court: 'Supreme Court of India',
        year: 2021,
        holdingsSummary: 'Cancellation of import/export license must follow principles of natural justice. Opportunity of hearing is mandatory before adverse action.',
        legalPoints: JSON.stringify([
          'Natural justice in DGFT orders',
          'Opportunity of hearing before license cancellation',
          'Foreign Trade Policy - DGFT powers and limitations'
        ]),
        actsReferred: JSON.stringify(['Foreign Trade (Development & Regulation) Act 1992', 'Foreign Trade Policy 2015-2020']),
        source: 'MANUPATRA',
        practiceArea: 'CIVIL',
        keywords: 'import license, DGFT, natural justice, foreign trade, cancellation, writ',
      },
  ]) {
    try {
      await prisma.legalPrecedent.create({ data: precedentData })
    } catch {
      // Skip duplicates
    }
  }

  console.log('✅ Database seeded successfully!')
  console.log('\n📧 Login credentials:')
  console.log('   Owner:     owner@hexis.law / hexis@2024')
  console.log('   Associate: associate@hexis.law / hexis@2024')
  console.log('   Clerk:     clerk@hexis.law / hexis@2024')
  console.log('\n🚀 Run: npm run dev')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
