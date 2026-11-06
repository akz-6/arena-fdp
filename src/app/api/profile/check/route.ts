import { NextRequest, NextResponse } from 'next/server';
import { getProfileRepository } from '@/lib/server/profile-repo';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');

  if (!name || name.trim().length < 2 || name.trim().length > 16) {
    return NextResponse.json({ available: false });
  }

  try {
    const repo = getProfileRepository();
    const available = await repo.isNameAvailable(name.trim());
    return NextResponse.json({ available });
  } catch (err) {
    console.error('Erro em GET /api/profile/check:', err);
    return NextResponse.json({ available: false });
  }
}
