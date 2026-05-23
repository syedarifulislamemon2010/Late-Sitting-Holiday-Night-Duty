const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const holidays = [
  { date: '2026-02-04', name: 'Shab-e-Barat' },
  { date: '2026-02-21', name: 'Shaheed Day & International Mother Language Day' },
  { date: '2026-03-17', name: 'Shab-e-Qadr' },
  { date: '2026-03-19', name: 'Eid-ul-Fitr Block Day 1' },
  { date: '2026-03-20', name: 'Eid-ul-Fitr Block Day 2' },
  { date: '2026-03-21', name: 'Eid-ul-Fitr Block Day 3' },
  { date: '2026-03-22', name: 'Eid-ul-Fitr Block Day 4' },
  { date: '2026-03-23', name: 'Eid-ul-Fitr Block Day 5' },
  { date: '2026-03-26', name: 'Independence Day' },
  { date: '2026-04-14', name: 'Bengali New Year' },
  { date: '2026-05-01', name: 'May Day & Buddha Purnima' },
  { date: '2026-05-25', name: 'Eid-ul-Azha Block Day 1' },
  { date: '2026-05-26', name: 'Eid-ul-Azha Block Day 2' },
  { date: '2026-05-27', name: 'Eid-ul-Azha Block Day 3' },
  { date: '2026-05-28', name: 'Eid-ul-Azha Block Day 4' },
  { date: '2026-05-29', name: 'Eid-ul-Azha Block Day 5' },
  { date: '2026-05-30', name: 'Eid-ul-Azha Block Day 6' },
  { date: '2026-05-31', name: 'Eid-ul-Azha Block Day 7' },
  { date: '2026-06-26', name: 'Ashura' },
  { date: '2026-07-01', name: 'Mid-Year Bank Holiday' },
  { date: '2026-08-05', name: 'July Mass Uprising Day' },
  { date: '2026-08-26', name: 'Eid-e-Milad-un-Nabi' },
  { date: '2026-09-04', name: 'Janmashtami' },
  { date: '2026-10-20', name: 'Durga Puja (Mahanabami)' },
  { date: '2026-10-21', name: 'Durga Puja (Bijoya Dashami)' },
  { date: '2026-12-16', name: 'Victory Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-12-31', name: 'Year-End Bank Holiday' }
];

async function main() {
  console.log('Seeding 2026 holidays...');
  
  for (const h of holidays) {
    const upserted = await prisma.holiday.upsert({
      where: { date: h.date },
      update: {
        name: h.name,
        isWorkingDay: false
      },
      create: {
        date: h.date,
        name: h.name,
        isWorkingDay: false
      }
    });
    console.log(`Upserted holiday: ${upserted.date} - ${upserted.name}`);
  }
  
  console.log('Holidays seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding holidays:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
