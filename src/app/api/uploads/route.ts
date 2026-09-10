import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db } from '@/db';
import { content } from '@/db/schema';
import { currentUser } from '@/lib/auth';
export async function POST(req: NextRequest) {
 try {
  if (!await currentUser()) return NextResponse.json({ error: 'Please sign in to upload photos.' }, { status: 401 });
  const form = await req.formData(); const file = form.get('file');
  if (!(file instanceof File) || file.size > 5 * 1024 * 1024 || file.size < 12) return NextResponse.json({ error: 'Choose a JPG, PNG or WebP image up to 5 MB.' }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? 'image/jpeg' : bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP' ? 'image/webp' : null;
  if (!mime) return NextResponse.json({ error: 'Only JPG, PNG and WebP images are supported.' }, { status: 400 });
  const id = randomUUID(); await db.insert(content).values({ key: `upload_${id}`, value: `data:${mime};base64,${bytes.toString('base64')}` });
  return NextResponse.json({ url: `/api/uploads/${id}` });
 } catch { return NextResponse.json({ error: 'Could not upload your image. Please try again.' }, { status: 500 }); }
}
