import { cookies } from 'next/headers';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';

const SESSION_COOKIE = 'kk_session';
const SESSION_DAYS = 7;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function checkPassword(password: string, stored: string) {
  try {
    const [saltHex, keyHex] = stored.split(':');
    if (!saltHex || !keyHex || !/^[0-9a-f]+$/.test(saltHex) || !/^[0-9a-f]+$/.test(keyHex)) return false;
    const expected = Buffer.from(keyHex, 'hex');
    const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length < 32) return null;
  const [result] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, suspended: users.suspended })
    .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, digest(token)), gt(sessions.expiresAt, new Date())));
  return result && !result.suspended ? result : null;
}

export async function createSession(userId: number) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(sessions).values({ token: digest(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', expires: expiresAt, path: '/' });
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, digest(token)));
  jar.delete(SESSION_COOKIE);
}
