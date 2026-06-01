import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Clear auth cookies
  response.cookies.set('eduflow_token', '', { maxAge: 0, path: '/' });
  response.cookies.set('eduflow_tenant', '', { maxAge: 0, path: '/' });
  return response;
}
