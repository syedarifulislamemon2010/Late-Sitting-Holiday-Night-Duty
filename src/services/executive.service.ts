import { db } from '@/lib/db';
import { executives, trash } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logActivity } from '@/lib/audit';
import { AuthError, AppError } from '@/lib/errors';

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER' | 'EMPLOYEE';
}

interface ExecutiveInput {
  name: string;
  designation: string;
  phone?: string | null;
  email?: string | null;
  bankId?: string | null;
  fileNo?: string | null;
}

export class ExecutiveService {
  static async listExecutives(currentUser: UserSession | null) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 401, 'unauthorized');
    }
    return db.select().from(executives).orderBy(executives.createdAt);
  }

  static async createExecutive(currentUser: UserSession | null, body: ExecutiveInput, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 401, 'unauthorized');
    }
    if (currentUser.role !== 'ADMIN') {
      throw new AuthError('অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন নির্বাহী যোগ করতে পারবেন।', 403, 'forbidden');
    }

    const { name, designation, phone, email, bankId, fileNo } = body;
    if (!name || !designation) {
      throw new AppError('নাম এবং পদবী আবশ্যক।', 400, 'name_and_designation_required');
    }

    const createdList = await db.insert(executives).values({
      name: name.trim(),
      designation: designation.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      bankId: bankId?.trim() || null,
      fileNo: fileNo?.trim() || null
    }).returning();
    const created = createdList[0];

    await logActivity({
      username: currentUser.username,
      action: 'CREATE',
      entityType: 'EXECUTIVE',
      entityId: String(created.id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) নতুন নির্বাহী "${created.name}" (${created.designation}) কে যোগ করেছেন।`
    });

    return created;
  }

  static async updateExecutive(currentUser: UserSession | null, id: number, body: ExecutiveInput, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 401, 'unauthorized');
    }
    if (currentUser.role !== 'ADMIN') {
      throw new AuthError('অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন নির্বাহী সংশোধন করতে পারবেন।', 403, 'forbidden');
    }

    const { name, designation, phone, email, bankId, fileNo } = body;
    if (!name || !designation) {
      throw new AppError('নাম এবং পদবী আবশ্যক।', 400, 'name_and_designation_required');
    }

    const updatedList = await db.update(executives)
      .set({
        name: name.trim(),
        designation: designation.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        bankId: bankId?.trim() || null,
        fileNo: fileNo?.trim() || null
      })
      .where(eq(executives.id, id))
      .returning();
    const updated = updatedList[0];

    if (!updated) {
      throw new AppError('নির্বাহী কর্মকর্তা পাওয়া যায়নি।', 404, 'not_found');
    }

    await logActivity({
      username: currentUser.username,
      action: 'UPDATE',
      entityType: 'EXECUTIVE',
      entityId: String(updated.id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) নির্বাহী কর্মকর্তা "${updated.name}" (${updated.designation}) এর তথ্য সংশোধন করেছেন।`
    });

    return updated;
  }

  static async deleteExecutive(currentUser: UserSession | null, id: number, headersInfo: { ipAddress: string, userAgent: string }) {
    if (!currentUser) {
      throw new AuthError('অনুমতি নেই।', 401, 'unauthorized');
    }
    if (currentUser.role !== 'ADMIN') {
      throw new AuthError('অনুমতি নেই। শুধুমাত্র সিস্টেম এডমিন নির্বাহী মুছে ফেলতে পারবেন।', 403, 'forbidden');
    }

    const execList = await db.select().from(executives).where(eq(executives.id, id));
    const executive = execList[0];

    if (!executive) {
      throw new AppError('নির্বাহী কর্মকর্তা পাওয়া যায়নি।', 404, 'not_found');
    }

    await db.insert(trash).values({
      entityType: 'EXECUTIVE',
      entityId: id,
      name: `নির্বাহী: ${executive.name} (${executive.designation})`,
      data: JSON.stringify(executive),
      deletedBy: currentUser.username
    });

    await db.delete(executives).where(eq(executives.id, id));

    await logActivity({
      username: currentUser.username,
      action: 'DELETE',
      entityType: 'EXECUTIVE',
      entityId: String(id),
      ipAddress: headersInfo.ipAddress,
      userAgent: headersInfo.userAgent,
      details: `${currentUser.name} (@${currentUser.username}) নির্বাহী কর্মকর্তা "${executive.name}" (${executive.designation}) কে মুছে ফেলেছেন।`
    });

    return { success: true };
  }
}
