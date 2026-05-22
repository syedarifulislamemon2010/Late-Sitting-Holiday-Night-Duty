import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
      include: {
        cell: true
      }
    });
    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'failed_to_fetch_employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, designation, bankId, fileNo, cellId } = body;
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'name_required' }, { status: 400 });
    }
    if (!designation || designation.trim() === '') {
      return NextResponse.json({ error: 'designation_required' }, { status: 400 });
    }
    if (!cellId) {
      return NextResponse.json({ error: 'cell_required' }, { status: 400 });
    }
    
    const parsedCellId = parseInt(cellId, 10);
    if (isNaN(parsedCellId)) {
      return NextResponse.json({ error: 'invalid_cell_id' }, { status: 400 });
    }
    
    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        designation: designation.trim(),
        bankId: bankId?.trim() || null,
        fileNo: fileNo?.trim() || null,
        cellId: parsedCellId
      },
      include: {
        cell: true
      }
    });
    
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'failed_to_create_employee' }, { status: 500 });
  }
}
