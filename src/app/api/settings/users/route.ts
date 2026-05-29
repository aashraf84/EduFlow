import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolId, name, email, role, phone } = body;

    if (!schoolId || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: schoolId, name, email' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = await db.user.create({
      data: {
        schoolId,
        email,
        password: 'hashed_default123',
        name,
        role: role || 'teacher',
        phone: phone || null,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        lastLogin: true,
      },
    });

    return NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Settings users POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
