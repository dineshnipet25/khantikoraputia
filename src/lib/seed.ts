import { db } from '@/db';
import { content, listings } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

const photo = (id: string) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1000`;

export async function seedDirectory() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(487219)`);
    const [seeded] = await tx.select().from(content).where(eq(content.key, 'seeded'));

    if (seeded) {
      // Never publish illustrative business profiles as if they were real operators.
      await tx.delete(listings).where(eq(listings.sample, true));
      if (seeded.value !== '3') {
        const announcement = 'Rooted in Koraput. Discover places, people and local stories.';
        await tx.insert(content).values({ key: 'announcement', value: announcement })
          .onConflictDoUpdate({ target: content.key, set: { value: announcement } });
        await tx.update(content).set({ value: '3' }).where(eq(content.key, 'seeded'));
      }
      return;
    }

    await tx.insert(listings).values([
      { name: 'Deomali Hills', kind: 'place', category: 'Nature & Attractions', location: 'Deomali', image: photo('4324492'), description: 'Wide open skies, rolling green hills and a quieter kind of adventure. Deomali, in the Koraput district, is known as Odisha’s highest peak. Check local road and weather conditions before travelling, carry your litter back and respect the landscape. Photography is illustrative.', price: 'Check locally for access fees', hours: 'Daylight visits recommended', address: 'Deomali, Koraput, Odisha', featured: true, status: 'approved' },
      { name: 'Duduma Waterfalls', kind: 'place', category: 'Nature & Attractions', location: 'Machkund', image: photo('2789026'), description: 'A dramatic waterfall near the Odisha–Andhra Pradesh border and a memorable stop on a Koraput journey. Stay behind safety barriers and avoid slippery rocks, especially during the monsoon. Confirm access locally. Photography is illustrative.', price: 'Confirm locally', hours: 'Daylight visits recommended', address: 'Duduma Waterfalls, Machkund, Odisha', featured: true, status: 'approved' },
      { name: 'Kolab Reservoir', kind: 'place', category: 'Nature & Attractions', location: 'Koraput', image: photo('29623095'), description: 'Unhurried afternoons, a broad expanse of water and green surroundings. The Upper Kolab area is a popular nature escape near Koraput. Ask locally about current access, and do not enter restricted areas or swim in unmarked waters. Photography is illustrative.', price: 'Confirm locally', hours: 'Daylight visits recommended', address: 'Upper Kolab Reservoir, Koraput, Odisha', featured: true, status: 'approved' },
      { name: 'Khanti Koraputia', kind: 'creator', category: 'Local Creators', location: 'Koraput', image: photo('12958053'), description: 'The digital voice and discovery platform of Koraput. Explore local stories, people, culture and places through the Khanti Koraputia YouTube channel. Get in touch for a conversation about local storytelling or collaboration.', website: 'https://www.youtube.com/c/KhantiKoraputia', price: 'Open to collaborations', featured: true, status: 'approved' },
    ]);
    await tx.insert(content).values([
      { key: 'seeded', value: '3' },
      { key: 'announcement', value: 'Rooted in Koraput. Discover places, people and local stories.' },
    ]);
  });
}
