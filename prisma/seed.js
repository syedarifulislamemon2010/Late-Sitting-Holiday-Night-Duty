const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding starting...');

  // 1. Delete all existing duties and employees to start fresh
  await prisma.duty.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.cell.deleteMany({});

  console.log('Cleared old data.');

  // 2. Seed cells
  const r9 = await prisma.cell.create({
    data: { name: 'R9', description: 'আর৯ সেল (প্রশাসনিক দায়িত্ব)' }
  });
  const r22 = await prisma.cell.create({
    data: { name: 'R22', description: 'আর২২ সেল (অপারেশনাল উইং)' }
  });
  const jbns = await prisma.cell.create({
    data: { name: 'JBNS', description: 'জেবিএনএস সেল (আইটি কোর টিম)' }
  });

  console.log('Cells seeded successfully.');

  // 3. Seed Officers
  const officers = [
    {
      name: 'জনাব মোঃ আশরাফুল ইসলাম',
      designation: 'সিনিয়র প্রিন্সিপাল অফিসার (এসপিও)',
      bankId: 'SPO-101',
      fileNo: 'F/902',
      cellId: r9.id
    },
    {
      name: 'জনাবা মোসাঃ ফাতেমা খাতুন',
      designation: 'প্রিন্সিপাল অফিসার (পিও)',
      bankId: 'PO-202',
      fileNo: 'F/881',
      cellId: r22.id
    },
    {
      name: 'জনাব তানভীর রহমান',
      designation: 'সিনিয়র অফিসার-আইটি (এসও-আইটি)',
      bankId: 'SOIT-303',
      fileNo: 'F/721',
      cellId: jbns.id
    },
    {
      name: 'জনাব সামিউল হক',
      designation: 'অফিসার-আইটি (ও-আইটি)',
      bankId: 'OIT-404',
      fileNo: 'F/605',
      cellId: jbns.id
    }
  ];

  for (const o of officers) {
    const created = await prisma.employee.create({
      data: o
    });
    console.log(`Seeded officer: ${created.name} (${created.designation})`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
