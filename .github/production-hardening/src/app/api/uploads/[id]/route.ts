import { db } from '@/db';
import { content } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Not found', { status: 404 });
  const [image] = await db.select().from(content).where(eq(content.key, `upload_${id}`));
  if (!image) return new Response('Not found', { status: 404 });
  const comma = image.value.indexOf(',');
  if (comma < 0 || !image.value.startsWith('data:image/')) return new Response('Not found', { status: 404 });
  const meta = image.value.slice(5, comma).split(';')[0];
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(meta)) return new Response('Not found', { status: 404 });
  const base64 = image.value.slice(comma + 1);
  try {
    return new Response(Buffer.from(base64, 'base64'), { headers: { 'Content-Type': meta, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Not found', { status: 404 }); }
}
