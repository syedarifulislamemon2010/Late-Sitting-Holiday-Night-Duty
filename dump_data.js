const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all tables from PostgreSQL Neon Cloud...');
  
  const cells = await prisma.cell.findMany();
  const users = await prisma.user.findMany({
    include: {
      cells: true
    }
  });
  const employees = await prisma.employee.findMany();
  const duties = await prisma.duty.findMany();
  const documents = await prisma.document.findMany();
  const holidays = await prisma.holiday.findMany();
  const executives = await prisma.executive.findMany();
  const trash = await prisma.trash.findMany();

  // Create links mapping for user cell relationships
  const userCellLinks = [];
  for (const u of users) {
    if (u.cells) {
      for (const c of u.cells) {
        userCellLinks.append ? userCellLinks.push({ userId: u.id, cellId: c.id }) : userCellLinks.push({ userId: u.id, cellId: c.id });
      }
    }
  }

  const dump = {
    cells,
    users: users.map(u => ({ id: u.id, username: u.username, password: u.password, name: u.name, role: u.role })),
    userCellLinks,
    employees,
    duties,
    documents,
    holidays,
    executives,
    trash
  };

  fs.writeFileSync('postgres_dump.json', JSON.stringify(dump, null, 2));
  console.log('PostgreSQL Neon data successfully dumped to postgres_dump.json!');
}

main()
  .catch(e => {
    console.error('Migration Dump failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
