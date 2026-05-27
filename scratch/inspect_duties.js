const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("=== Active Office Orders ===");
    const orders = await prisma.officeOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });
    orders.forEach(o => {
      console.log(`- Ref: ${o.orderRef}, Date: ${o.orderDate}, Payee: ${o.employeeName}, Category: ${o.category}`);
    });

    console.log("\n=== Active Duties count ===");
    const dutiesCount = await prisma.duty.count();
    console.log(`Total duties in DB: ${dutiesCount}`);

    console.log("\n=== Sample Duties ===");
    const duties = await prisma.duty.findMany({
      take: 10,
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
    duties.forEach(d => {
      console.log(`- Employee: ${d.employee.name}, Type: ${d.type}, Date: ${d.date}, Ref: ${d.orderRef}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
