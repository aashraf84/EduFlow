import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'schoolId is required' },
        { status: 400 }
      );
    }

    // Fetch school profile
    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // Fetch academic sessions with terms
    const academicSessions = await db.academicSession.findMany({
      where: { schoolId },
      include: {
        terms: {
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Fetch users
    const users = await db.user.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get total student count
    const totalStudents = await db.student.count({
      where: { schoolId, status: 'active' },
    });

    return NextResponse.json({
      success: true,
      data: {
        school,
        academicSessions,
        users,
        totalStudents,
      },
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolId,
      name,
      code,
      address,
      city,
      state,
      country,
      phone,
      email,
      website,
    } = body;

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'schoolId is required' },
        { status: 400 }
      );
    }

    // Check if school exists
    const existingSchool = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!existingSchool) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // Update school
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(country !== undefined && { country }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSchool,
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
