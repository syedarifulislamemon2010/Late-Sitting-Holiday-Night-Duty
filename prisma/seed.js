const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding process starting...');

  const dumpPath = path.join(__dirname, '../postgres_dump.json');
  const hasDump = fs.existsSync(dumpPath);

  if (hasDump) {
    console.log('Universal Seeding Engine: postgres_dump.json found. Restoring original database records...');
    
    // Read and parse dump
    const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

    // 1. Clear database tables in dependency order to prevent constraint violations
    console.log('Clearing database tables...');
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.lunchBill.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.chatParticipant.deleteMany({});
    await prisma.chat.deleteMany({});
    await prisma.leaveApplication.deleteMany({});
    await prisma.feedbackMessage.deleteMany({});
    await prisma.feedback.deleteMany({});
    await prisma.officeOrder.deleteMany({});
    await prisma.trash.deleteMany({});
    await prisma.executive.deleteMany({});
    await prisma.holiday.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.duty.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.cell.deleteMany({});
    console.log('Cleared all tables successfully.');

    // 2. Import Cells
    console.log(`Importing ${dump.cells.length} Cells...`);
    for (const c of dump.cells) {
      await prisma.cell.create({
        data: {
          id: c.id,
          name: c.name,
          description: c.description,
          createdAt: c.createdAt ? new Date(c.createdAt) : undefined
        }
      });
    }

    // 3. Import Users and restore many-to-many relationship with Cells
    console.log(`Importing ${dump.users.length} Users...`);
    for (const u of dump.users) {
      const userCellLinks = dump.userCellLinks || [];
      const userLinks = userCellLinks.filter(link => link.userId === u.id);
      
      await prisma.user.create({
        data: {
          id: u.id,
          username: u.username,
          password: u.password,
          name: u.name,
          role: u.role,
          mobile: u.mobile,
          createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
          cells: {
            connect: userLinks.map(l => ({ id: l.cellId }))
          }
        }
      });
    }

    // 4. Import Employees
    console.log(`Importing ${dump.employees.length} Employees...`);
    for (const e of dump.employees) {
      await prisma.employee.create({
        data: {
          id: e.id,
          name: e.name,
          designation: e.designation,
          bankId: e.bankId,
          fileNo: e.fileNo,
          mobile: e.mobile,
          cellId: e.cellId,
          createdAt: e.createdAt ? new Date(e.createdAt) : undefined
        }
      });
    }

    // 5. Import Duties
    console.log(`Importing ${dump.duties.length} Duties...`);
    for (const d of dump.duties) {
      await prisma.duty.create({
        data: {
          id: d.id,
          employeeId: d.employeeId,
          type: d.type,
          date: d.date,
          description: d.description,
          allowance1: d.allowance1,
          allowance2: d.allowance2,
          totalBill: d.totalBill,
          orderRef: d.orderRef,
          createdAt: d.createdAt ? new Date(d.createdAt) : undefined
        }
      });
    }

    // 6. Import Documents
    if (dump.documents) {
      console.log(`Importing ${dump.documents.length} Documents...`);
      for (const doc of dump.documents) {
        await prisma.document.create({
          data: {
            id: doc.id,
            name: doc.name,
            filePath: doc.filePath,
            fileSize: doc.fileSize,
            uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : undefined
          }
        });
      }
    }

    // 7. Import Holidays
    if (dump.holidays) {
      console.log(`Importing ${dump.holidays.length} Holidays...`);
      for (const h of dump.holidays) {
        await prisma.holiday.create({
          data: {
            id: h.id,
            date: h.date,
            name: h.name,
            isWorkingDay: h.isWorkingDay === true || h.isWorkingDay === 'true',
            createdAt: h.createdAt ? new Date(h.createdAt) : undefined
          }
        });
      }
    }

    // 8. Import Executives
    if (dump.executives) {
      console.log(`Importing ${dump.executives.length} Executives...`);
      for (const ex of dump.executives) {
        await prisma.executive.create({
          data: {
            id: ex.id,
            name: ex.name,
            designation: ex.designation,
            phone: ex.phone,
            email: ex.email,
            bankId: ex.bankId,
            fileNo: ex.fileNo,
            createdAt: ex.createdAt ? new Date(ex.createdAt) : undefined
          }
        });
      }
    }

    // 9. Import Trash
    if (dump.trash) {
      console.log(`Importing ${dump.trash.length} Trash items...`);
      for (const t of dump.trash) {
        await prisma.trash.create({
          data: {
            id: t.id,
            entityType: t.entityType,
            entityId: t.entityId,
            name: t.name,
            data: t.data,
            deletedBy: t.deletedBy,
            deletedAt: t.deletedAt ? new Date(t.deletedAt) : undefined
          }
        });
      }
    }

    // 10. Reset PostgreSQL serial autoincrement counters for clone consistency
    console.log('Resetting PostgreSQL database sequences...');
    const tables = ['Cell', 'User', 'Employee', 'Duty', 'Document', 'Holiday', 'Executive', 'Trash'];
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`
          SELECT setval(
            pg_get_serial_sequence('"${table}"', 'id'),
            COALESCE((SELECT MAX(id) FROM "${table}"), 1),
            true
          );
        `);
        console.log(`Successfully reset serial sequence for table: ${table}`);
      } catch (err) {
        console.log(`Skipped sequence reset for table: ${table} (sqlite/non-postgres environment)`);
      }
    }

    console.log('Database restore from postgres_dump.json completed successfully!');

  } else {
    console.log('Universal Seeding Engine: postgres_dump.json not found in project root.');
    console.log('Falling back to default mock seeding...');

    // Clear old tables
    await prisma.duty.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.cell.deleteMany({});
    console.log('Cleared old default data.');

    // Seed cells
    const r9 = await prisma.cell.create({
      data: { name: 'R9', description: 'আর৯ সেল (প্রশাসনিক দায়িত্ব)' }
    });
    const r22 = await prisma.cell.create({
      data: { name: 'R22', description: 'আর২২ সেল (অপারেশনাল উইং)' }
    });
    const jbns = await prisma.cell.create({
      data: { name: 'JBNS', description: 'জেবিএনএস সেল (আইটি কোর টিম)' }
    });

    // Seed Admin User
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: '123456',
        name: 'System Admin',
        role: 'ADMIN'
      }
    });
    console.log('Seeded admin user:', admin.username);

    // Seed Officers
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
        designation: 'সিনিয়র অফিসার-আইটি (এসো-আইটি)',
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

    console.log('Default mock seeding completed successfully!');
  }
}

main()
  .catch((e) => {
    console.error('Seeding process failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
