import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users, listings, enquiries, reviews, saves, content } from '@/db/schema';
import { currentUser, hashPassword, checkPassword, createSession, logout } from '@/lib/auth';
import { seedDirectory } from '@/lib/seed';
import { contentKeys, publicSettings } from '@/lib/content';
import { timingSafeEqual } from 'node:crypto';
const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const clean = (v: unknown, max = 300) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const validUrl = (s: string) => { try { return ['http:', 'https:'].includes(new URL(s).protocol); } catch { return false; } };
const attempts = new Map<string, { count: number; until: number }>();
export async function GET(req: NextRequest) {
 try {
  await seedDirectory(); const user = await currentUser(); const section = req.nextUrl.searchParams.get('section');
  if (section === 'detail') {
   const id = Number(req.nextUrl.searchParams.get('id')); const [listing] = await db.select().from(listings).where(eq(listings.id, id));
   if (!listing || (listing.status !== 'approved' && user?.role !== 'superadmin' && user?.role !== 'staff' && user?.id !== listing.ownerId)) return fail('Listing not found', 404);
   await db.update(listings).set({ views: sql`${listings.views} + 1` }).where(eq(listings.id, id));
   const feedback = await db.select({ id: reviews.id, name: users.name, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt }).from(reviews).innerJoin(users, eq(reviews.userId, users.id)).where(eq(reviews.listingId, id)).orderBy(desc(reviews.createdAt));
   return NextResponse.json({ listing, reviews: feedback });
  }
  if (section === 'dashboard') {
   if (!user) return fail('Please sign in', 401); const admin = ['superadmin', 'staff'].includes(user.role);
   const mine = await db.select().from(listings).where(admin ? undefined : eq(listings.ownerId, user.id)).orderBy(desc(listings.createdAt));
   const leads = await db.select().from(enquiries).where(admin ? undefined : mine.length ? inArray(enquiries.listingId, mine.map(l => l.id)) : eq(enquiries.userId, user.id)).orderBy(desc(enquiries.createdAt));
   const members = user.role === 'superadmin' ? await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, suspended: users.suspended }).from(users) : [];
   return NextResponse.json({ listings: mine, enquiries: leads, users: members, content: admin ? await db.select().from(content).where(inArray(content.key, contentKeys)) : [] });
  }
  const publicListings = await db.select().from(listings).where(eq(listings.status, 'approved')).orderBy(desc(listings.featured), listings.id);
  const saved = user ? await db.select({ listingId: saves.listingId }).from(saves).where(eq(saves.userId, user.id)) : [];
  const settings = publicSettings(await db.select().from(content).where(inArray(content.key, contentKeys)));
  return NextResponse.json({ listings: publicListings, user, saved: saved.map(s => s.listingId), settings });
 } catch (error) { console.error(error); return fail('Unable to load data. Please try again.', 500); }
}
export async function POST(req: NextRequest) {
 try {
  const origin = req.headers.get('origin'); if (origin && origin !== req.nextUrl.origin && new URL(origin).host !== req.headers.get('host') && new URL(origin).host !== req.headers.get('x-forwarded-host')) return fail('Invalid request origin', 403);
  const b = await req.json(); const action = clean(b.action); const user = await currentUser(); const admin = user && ['superadmin', 'staff'].includes(user.role);
  if (action === 'register' || action === 'login') {
   const ip = req.headers.get('x-forwarded-for') || 'local'; const now = Date.now(); const attempt = attempts.get(ip); if (attempt && attempt.until > now && attempt.count >= 20) return fail('Too many attempts. Try again in 15 minutes.', 429); attempts.set(ip, { count: attempt && attempt.until > now ? attempt.count + 1 : 1, until: attempt && attempt.until > now ? attempt.until : now + 900000 });
   const email = clean(b.email).toLowerCase(); const password = clean(b.password, 128); if (!validEmail(email) || password.length < 8) return fail('Use a valid email and a password of at least 8 characters.');
   const [existing] = await db.select().from(users).where(eq(users.email, email));
   if (action === 'login') { if (!existing || !checkPassword(password, existing.passwordHash) || existing.suspended) return fail('Email or password is incorrect, or account is unavailable.', 401); await createSession(existing.id); return NextResponse.json({ success: true }); }
   if (existing) return fail('An account already exists with this email. Please sign in.'); const name = clean(b.name, 100); if (!name) return fail('Please enter your name.');
   let role = b.role === 'creator' ? 'creator' : 'business';
   if (b.adminKey) { const configured = process.env.ADMIN_SETUP_KEY; const supplied = clean(b.adminKey, 256); if (!configured || Buffer.byteLength(configured) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(configured), Buffer.from(supplied))) return fail('Invalid administrator setup key.', 403); role = 'superadmin'; }
   const [created] = await db.insert(users).values({ name, email, passwordHash: hashPassword(password), role }).returning(); await createSession(created.id); return NextResponse.json({ success: true });
  }
  if (action === 'logout') { await logout(); return NextResponse.json({ success: true }); }
  if (action === 'enquiry') {
   const name = clean(b.name, 100), email = clean(b.email), message = clean(b.message, 3000); if (!name || !validEmail(email) || message.length < 10) return fail('Enter your name, a valid email and a message of at least 10 characters.');
   const type = ['enquiry', 'report', 'promotion', 'collaboration', 'event'].includes(b.type) ? b.type : 'enquiry';
   const listingId = Number(b.listingId) || null;
   if (listingId) { const [target] = await db.select().from(listings).where(and(eq(listings.id, listingId), eq(listings.status, 'approved'))); if (!target) return fail('Listing not found.', 404); }
   await db.insert(enquiries).values({ listingId, userId: user?.id, name, email, message, type }); return NextResponse.json({ success: true });
  }
  if (!user) return fail('Please sign in to continue.', 401);
  if (action === 'submit' || action === 'edit') {
   const data = { name: clean(b.name, 120), kind: ['business', 'creator', 'place'].includes(b.kind) ? b.kind : 'business', category: clean(b.category, 80), location: clean(b.location, 80), description: clean(b.description, 5000), image: clean(b.image, 1500) || 'https://images.pexels.com/photos/4324492/pexels-photo-4324492.jpeg?auto=compress&cs=tinysrgb&w=1000', phone: clean(b.phone, 30), website: clean(b.website, 1000), address: clean(b.address, 500), hours: clean(b.hours, 150), price: clean(b.price, 150) };
   if (!data.name || !data.category || !data.location || data.description.length < 20) return fail('Complete the required fields and add a description of at least 20 characters.'); if ((!validUrl(data.image) && !/^\/api\/uploads\/[0-9a-f-]{36}$/.test(data.image)) || (data.website && !validUrl(data.website))) return fail('Image and website URLs must start with https:// or http://.');
   if (action === 'edit') { const [l] = await db.select().from(listings).where(eq(listings.id, Number(b.id))); if (!l || (!admin && l.ownerId !== user.id)) return fail('Access denied.', 403); await db.update(listings).set({ ...data, status: admin ? l.status : 'pending' }).where(eq(listings.id, l.id)); }
   else await db.insert(listings).values({ ...data, ownerId: user.id }); return NextResponse.json({ success: true });
  }
  if (action === 'save') { const id = Number(b.id); const [target] = await db.select().from(listings).where(and(eq(listings.id, id), eq(listings.status, 'approved'))); if (!target) return fail('Listing not found.', 404); const where = and(eq(saves.userId, user.id), eq(saves.listingId, id)); const found = await db.select().from(saves).where(where); if (found.length) await db.delete(saves).where(where); else await db.insert(saves).values({ userId: user.id, listingId: id }).onConflictDoNothing(); return NextResponse.json({ success: true, saved: !found.length }); }
  if (action === 'review') { const id = Number(b.listingId), rating = Number(b.rating), comment = clean(b.comment, 2000); if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 5) return fail('Choose a rating and write a short review.'); const [l] = await db.select().from(listings).where(and(eq(listings.id, id), eq(listings.status, 'approved'))); if (!l) return fail('Listing not found.', 404); await db.insert(reviews).values({ listingId: id, userId: user.id, rating, comment }); return NextResponse.json({ success: true }); }
  if (!admin) return fail('Administrator access required.', 403);
  if (action === 'moderate') { if (!['approved', 'rejected', 'pending'].includes(b.status)) return fail('Invalid status.'); await db.update(listings).set({ status: b.status }).where(eq(listings.id, Number(b.id))); }
  else if (action === 'feature') await db.update(listings).set({ featured: Boolean(b.featured) }).where(eq(listings.id, Number(b.id)));
  else if (action === 'content') {
   const key = clean(b.key, 80); if (!contentKeys.includes(key)) return fail('Invalid content key.');
   const value = clean(b.value, key === 'articles' ? 150000 : key === 'categories' || key === 'locations' ? 3000 : 1000);
   if (!value) return fail('Content cannot be empty.');
   if (key === 'articles') {
    let items; try { items = JSON.parse(value); } catch { return fail('Invalid article content.'); }
    if (!Array.isArray(items) || items.length > 30 || items.some(a => !a || typeof a.title !== 'string' || !a.title.trim() || a.title.length > 160 || typeof a.category !== 'string' || a.category.length > 80 || typeof a.image !== 'string' || !validUrl(a.image) || typeof a.read !== 'string' || a.read.length > 30 || !Array.isArray(a.body) || !a.body.length || a.body.some((p: unknown) => typeof p !== 'string' || p.length > 20000))) return fail('Complete every article field and use a valid image URL. Maximum 30 stories.');
   }
   if ((key === 'categories' || key === 'locations') && (value.split('\n').filter(Boolean).length > 40 || value.split('\n').some(s => s.length > 80))) return fail('Use up to 40 entries, each under 80 characters.');
   await db.insert(content).values({ key, value }).onConflictDoUpdate({ target: content.key, set: { value } });
  }
  else if (action === 'user') { if (user.role !== 'superadmin' || Number(b.id) === user.id) return fail('This account cannot be changed.', 403); if (!['business', 'creator', 'staff'].includes(b.role)) return fail('Invalid role.'); const [target] = await db.select().from(users).where(eq(users.id, Number(b.id))); if (!target || target.role === 'superadmin') return fail('Super administrator accounts are protected.', 403); await db.update(users).set({ role: b.role, suspended: Boolean(b.suspended) }).where(eq(users.id, Number(b.id))); }
  else return fail('Unknown action.');
  return NextResponse.json({ success: true });
 } catch (error) { console.error(error); return fail('Could not complete your request. Please try again.', 500); }
}
