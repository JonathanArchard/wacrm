import { NextResponse } from 'next/server';
import { externalEmailDisabled } from '@/lib/auth/email-policy';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ enabled: !externalEmailDisabled() }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
