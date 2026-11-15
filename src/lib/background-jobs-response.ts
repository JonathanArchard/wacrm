import { NextResponse } from 'next/server';
export function backgroundJobsUnavailable() {
  return NextResponse.json({ error: 'Background jobs are disabled in this environment.', code: 'BACKGROUND_JOBS_DISABLED' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
