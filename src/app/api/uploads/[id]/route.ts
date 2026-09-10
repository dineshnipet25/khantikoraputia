import { db } from '@/db';
import { content } from '@/db/schema';
import { eq } from 'drizzle-orm';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Not found', { status: 404 });
 const [image] = await db.select().from(content).where(eq(content.key, `upload_${id}`)); if (!image) return new Response('Not found', { status: 404 });
 const [meta, base64] = image.value.split(','); const mime = meta.slice(5).split(';')[0];
 return new Response(Buffer.from(base64, 'base64'), { headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
}
