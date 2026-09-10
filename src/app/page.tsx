import Platform from '@/components/platform';
import { db } from '@/db';
import { listings, saves, content } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { currentUser } from '@/lib/auth';
import { seedDirectory } from '@/lib/seed';
import { contentKeys, publicSettings } from '@/lib/content';
export const dynamic = 'force-dynamic';
export default async function HomePage() {
 await seedDirectory();
 const user = await currentUser();
 const directory = await db.select().from(listings).where(eq(listings.status, 'approved')).orderBy(desc(listings.featured), listings.id);
 const saved = user ? await db.select().from(saves).where(eq(saves.userId, user.id)) : [];
 const settings = await db.select().from(content).where(inArray(content.key, contentKeys));
 return <Platform initialListings={JSON.parse(JSON.stringify(directory))} initialUser={user} initialSaved={saved.map(s => s.listingId)} settings={publicSettings(settings)} />;
}
