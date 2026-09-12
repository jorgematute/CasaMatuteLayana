import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'unknown',
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
    uptime: process.uptime(),
  });
}
