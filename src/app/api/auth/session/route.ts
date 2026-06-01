import { NextResponse } from 'next/server';

export async function GET() {
  // Session-based auth not yet implemented
  // Frontend handles auth state via login flow
  return NextResponse.json({ authenticated: false });
}
