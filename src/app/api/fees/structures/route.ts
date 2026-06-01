import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbByCode } from '@/lib/tenant-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get('schoolCode');
    const schoolId = searchParams.get('schoolId');

    if (!schoolCode) {
      return NextResponse.json(
        { success: false, error: 'schoolCode is required' },
        { status: 400 }
      );
    }

    const tenantDb = await getTenantDbByCode(schoolCode);
    if (!tenantDb) {
      return NextResponse.json({ success: true, data: { structures: [] } });
    }

    const where: { schoolId?: string } = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }

    const structures = await tenantDb.feeStructure.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { structures },
    });
  } catch (error) {
    console.error('Fee structures GET error:', error);
    return NextResponse.json({ success: true, data: { structures: [] } });
  }
}
