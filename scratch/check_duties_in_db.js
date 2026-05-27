const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const duties = await prisma.duty.findMany({
    include: {
      employee: {
        include: {
          cell: true
        }
      }
    }
  });
  console.log('--- ALL DUTIES IN DATABASE ---');
  duties.forEach(d => {
    console.log(`ID: ${d.id} | Employee: ${d.employee.name} | Type: ${d.type} | Date: ${d.date} | OrderRef: ${d.orderRef}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
