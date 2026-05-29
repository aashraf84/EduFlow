import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    const where: { schoolId?: string } = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }

    const structures = await db.feeStructure.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { structures },
    });
  } catch (error) {
    console.error('Fee structures GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
