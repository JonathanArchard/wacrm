import { NextResponse } from 'next/server';

export function externalDeliveryUnavailable() {
  return NextResponse.json({ error: 'External delivery is disabled in this environment.', code: 'EXTERNAL_DELIVERY_DISABLED' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
