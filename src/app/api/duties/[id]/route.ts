import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dutyId = parseInt(id, 10);
    
    if (isNaN(dutyId)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }
    
    await prisma.duty.delete({
      where: { id: dutyId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting duty:', error);
    return NextResponse.json({ error: 'failed_to_delete_duty' }, { status: 500 });
  }
}
