const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const executives = [
  { name: 'মোহাম্মদ সোহরাব হোসেন', designation: 'উপ-মহাব্যবস্থাপক' },
  { name: 'মীর জাহিদুল ইসলাম', designation: 'উপ-মহাব্যবস্থাপক' }
];

async function main() {
  console.log('Seeding executives...');
  
  for (const exec of executives) {
    const created = await prisma.executive.create({
      data: {
        name: exec.name,
        designation: exec.designation,
        phone: '০২-৯৫৫৫৬৬৬',
        email: 'dgm.online@janatabank-bd.com'
      }
    });
    console.log(`Seeded executive: ${created.name} (${created.designation})`);
  }
  
  console.log('Executives seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding executives:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
