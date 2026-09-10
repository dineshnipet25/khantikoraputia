import { cookies } from 'next/headers';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
export function hashPassword(password: string) { const salt = randomBytes(16).toString('hex'); return salt + ':' + scryptSync(password, salt, 64).toString('hex'); }
export function checkPassword(password: string, hash: string) { const [salt, key] = hash.split(':'); return timingSafeEqual(Buffer.from(key, 'hex'), scryptSync(password, salt, 64)); }
export async function currentUser() {
 const token = (await cookies()).get('kk_session')?.value; if (!token) return null;
 const [result] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, suspended: users.suspended }).from(sessions).innerJoin(users, eq(users.id, sessions.userId)).where(and(eq(sessions.token, createHash('sha256').update(token).digest('hex')), gt(sessions.expiresAt, new Date())));
 return result && !result.suspended ? result : null;
}
export async function createSession(userId: number) { const token = randomBytes(32).toString('hex'); const expiresAt = new Date(Date.now() + 604800000); await db.insert(sessions).values({ token: createHash('sha256').update(token).digest('hex'), userId, expiresAt }); (await cookies()).set('kk_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true', expires: expiresAt, path: '/' }); }
export async function logout() { const jar = await cookies(); const token = jar.get('kk_session')?.value; if (token) await db.delete(sessions).where(eq(sessions.token, createHash('sha256').update(token).digest('hex'))); jar.delete('kk_session'); }
