const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.document.findMany({
    orderBy: { uploadedAt: 'desc' }
  });
  console.log('--- ALL DOCUMENTS IN DATABASE ---');
  docs.forEach(doc => {
    console.log(`ID: ${doc.id} | Name: ${doc.name} | Path: ${doc.filePath} | UploadedAt: ${doc.uploadedAt}`);
  });
  
  const orders = await prisma.officeOrder.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log('\n--- ALL OFFICE ORDERS / BILLS IN DATABASE ---');
  orders.forEach(order => {
    console.log(`ID: ${order.id} | Ref: ${order.orderRef} | Category: ${order.category} | CreatedAt: ${order.createdAt}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
