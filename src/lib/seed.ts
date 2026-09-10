import { db } from '@/db';
import { content, listings } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
const photo = (id: string) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1000`;
export async function seedDirectory() {
 await db.transaction(async (tx) => {
  await tx.execute(sql`select pg_advisory_xact_lock(487219)`);
  const [seeded] = await tx.select().from(content).where(eq(content.key, 'seeded'));
  if (seeded) {
   if (seeded.value === '1') {
    await tx.update(listings).set({ image: photo('24738158') }).where(eq(listings.name, 'Kotpad Handloom House'));
    await tx.update(listings).set({ image: photo('29623095') }).where(eq(listings.name, 'Kolab Reservoir'));
    await tx.update(content).set({ value: '2' }).where(eq(content.key, 'seeded'));
   }
   return;
  }
  await tx.insert(listings).values([
   { name: 'Desia Eco Tourism', kind: 'business', category: 'Stays & Hotels', location: 'Koraput', image: photo('14699951'), description: 'A slower way to stay. Discover the idea of a nature-led retreat with cosy cottages, regional meals and time to connect with the landscape. This is a sample listing demonstrating the platform, not a verified offer from a business.', price: 'Request a quote', hours: 'Check-in from 12:00 PM', sample: true, featured: true, status: 'approved' },
   { name: 'The Koraput Kitchen', kind: 'business', category: 'Food & Cafés', location: 'Jeypore', image: photo('958545'), description: 'A taste of home, from comforting regional thalis to seasonal local favourites. This sample restaurant profile showcases how local food businesses can connect with visitors.', price: 'Enquire for menu', hours: '10:00 AM – 9:00 PM', sample: true, featured: true, status: 'approved' },
   { name: 'Tribal Trails Koraput', kind: 'business', category: 'Tours & Guides', location: 'Koraput', image: photo('13691356'), description: 'Explore beyond the usual route with a locally led journey through hills, villages and viewpoints. An illustrative tour operator profile; no tours or bookings are currently offered.', price: 'Custom itineraries', hours: 'By appointment', sample: true, featured: true, status: 'approved' },
   { name: 'Kotpad Handloom House', kind: 'business', category: 'Shops & Handicrafts', location: 'Kotpad', image: photo('24738158'), description: 'Celebrating the heritage of naturally dyed textiles and the people who weave them. This is an example artisan shop profile, not a verified business listing.', price: 'Enquire for pricing', hours: '9:00 AM – 7:00 PM', sample: true, featured: true, status: 'approved' },
   { name: 'Deomali Hills', kind: 'place', category: 'Nature & Attractions', location: 'Deomali', image: photo('4324492'), description: 'Wide open skies, rolling green hills and a quieter kind of adventure. Deomali, in the Koraput district, is known as Odisha’s highest peak. Check local road and weather conditions before travelling, carry your litter back and respect the landscape. Photography is illustrative.', price: 'Check locally for access fees', hours: 'Daylight visits recommended', address: 'Deomali, Koraput, Odisha', featured: true, status: 'approved' },
   { name: 'Duduma Waterfalls', kind: 'place', category: 'Nature & Attractions', location: 'Machkund', image: photo('2789026'), description: 'A dramatic waterfall near the Odisha–Andhra Pradesh border and a memorable stop on a Koraput journey. Stay behind safety barriers and avoid slippery rocks, especially during the monsoon. Confirm access locally. Photography is illustrative.', price: 'Confirm locally', hours: 'Daylight visits recommended', address: 'Duduma Waterfalls, Machkund, Odisha', featured: true, status: 'approved' },
   { name: 'Kolab Reservoir', kind: 'place', category: 'Nature & Attractions', location: 'Koraput', image: photo('29623095'), description: 'Unhurried afternoons, a broad expanse of water and green surroundings. The Upper Kolab area is a popular nature escape near Koraput. Ask locally about current access, and do not enter restricted areas or swim in unmarked waters. Photography is illustrative.', price: 'Confirm locally', hours: 'Daylight visits recommended', address: 'Upper Kolab Reservoir, Koraput, Odisha', featured: true, status: 'approved' },
   { name: 'Khanti Koraputia', kind: 'creator', category: 'Local Creators', location: 'Koraput', image: photo('12958053'), description: 'The digital voice and discovery platform of Koraput. Explore local stories, people, culture and places through the Khanti Koraputia YouTube channel. Get in touch for a conversation about local storytelling or collaboration.', website: 'https://www.youtube.com/c/KhantiKoraputia', price: 'Open to collaborations', featured: true, status: 'approved' },
  ]);
  await tx.insert(content).values([{ key: 'seeded', value: '1' }, { key: 'announcement', value: 'Rooted in Koraput. Connecting our community.' }]);
 });
}
