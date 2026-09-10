import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/db';
import { content } from '@/db/schema';
import { currentUser } from '@/lib/auth';

const MAX_BYTES = 5 * 1024 * 1024;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_UPLOADS_PER_HOUR = 20;
const uploadAttempts = new Map<number, { count: number; resetAt: number }>();
function detectMime(bytes: Buffer) {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Please sign in to upload photos.' }, { status: 401 });
    const now = Date.now(); const prior = uploadAttempts.get(user.id);
    if (prior && prior.resetAt > now && prior.count >= MAX_UPLOADS_PER_HOUR) return NextResponse.json({ error: 'Upload limit reached. Please try again later.' }, { status: 429 });
    uploadAttempts.set(user.id, prior && prior.resetAt > now ? { count: prior.count + 1, resetAt: prior.resetAt } : { count: 1, resetAt: now + WINDOW_MS });
    const form = await req.formData(); const file = form.get('file');
    if (!(file instanceof File) || file.size > MAX_BYTES || file.size < 12) return NextResponse.json({ error: 'Choose a JPG, PNG or WebP image up to 5 MB.' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer()); const mime = detectMime(bytes);
    if (!mime) return NextResponse.json({ error: 'Only valid JPG, PNG and WebP images are supported.' }, { status: 400 });
    const id = randomUUID();
    await db.insert(content).values({ key: `upload_${id}`, value: `data:${mime};base64,${bytes.toString('base64')}` });
    return NextResponse.json({ url: `/api/uploads/${id}` });
  } catch (error) { console.error('POST /api/uploads failed', error); return NextResponse.json({ error: 'Could not upload your image. Please try again.' }, { status: 500 }); }
}
