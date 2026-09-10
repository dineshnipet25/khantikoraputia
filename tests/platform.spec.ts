import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { db } from '../src/db';
import { users, listings, saves, reviews, enquiries, content } from '../src/db/schema';
import { eq, inArray } from 'drizzle-orm';

test('community account, saved places, image upload, moderation and enquiries', async ({ page, request }) => {
 test.setTimeout(45000);
 page.setDefaultTimeout(10000);
 const email = `workflow-${Date.now()}@example.test`; let userId = 0; let uploadedKey = '';
 const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
 const [originalArticles] = await db.select().from(content).where(eq(content.key, 'articles'));
 try {
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.getByRole('button', { name: 'Create an account', exact: true }).click();
  await page.getByLabel('Your name', { exact: true }).fill('Workflow Tester');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Test-only-strong-password-97');
  await page.getByRole('button', { name: 'Create your account', exact: true }).click();
  await expect(page.getByRole('button', { name: 'My dashboard', exact: true })).toBeVisible();
  const [account] = await db.select().from(users).where(eq(users.email, email)); userId = account.id;
  expect(account.role).toBe('business');
  await page.getByRole('button', { name: 'Save Desia Eco Tourism', exact: true }).click();
  await page.getByRole('button', { name: 'My saved discoveries' }).first().click();
  await expect(page.getByRole('button', { name: 'Desia Eco Tourism', exact: true })).toBeVisible();
  expect(await page.locator('.listing-card').count()).toBe(1);
  await page.getByRole('button', { name: 'Add a listing', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add a listing' });
  await dialog.getByLabel('Listing name').fill('Workflow Test Homestay');
  await dialog.getByLabel('Category', { exact: false }).selectOption('Stays & Hotels');
  await dialog.locator('input[name="location"]').fill('Koraput');
  await dialog.getByLabel('Tell your story').fill('An automated test listing used to verify the submission and review workflow.');
  const uploadResponse = page.waitForResponse(r => r.url().endsWith('/api/uploads') && r.request().method() === 'POST');
  await dialog.locator('input[type=file]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCYsAAAAASUVORK5CYII=', 'base64') });
  const uploaded = await (await uploadResponse).json(); expect(uploaded.url).toContain('/api/uploads/'); uploadedKey = 'upload_' + uploaded.url.split('/').pop();
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Submit for review' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Workflow.' })).toBeVisible();
  await expect(page.locator('tbody').getByText('Pending review')).toBeVisible();
  const [listing] = await db.select().from(listings).where(eq(listings.ownerId, userId)); expect(listing.status).toBe('pending'); expect(listing.image).toBe(uploaded.url);
  const denied = await page.request.post('http://localhost:3000/api/platform', { data: { action: 'moderate', id: listing.id, status: 'approved' } }); expect(denied.status()).toBe(403);
  const noPublicPending = await request.get(`http://localhost:3000/api/platform?section=detail&id=${listing.id}`); expect(noPublicPending.status()).toBe(404);
  await db.update(users).set({ role: 'superadmin' }).where(eq(users.id, userId));
  await page.reload();
  await page.getByTitle('Approve listing').click();
  await expect(page.locator('tr').filter({ hasText: 'Workflow Test Homestay' }).getByText('Published', { exact: true })).toBeVisible();
  const postedReview = await page.request.post('http://localhost:3000/api/platform', { data: { action: 'review', listingId: listing.id, rating: 5, comment: 'A test review verifying the community feedback workflow.' } }); expect(postedReview.ok()).toBeTruthy();
  const publicDetail = await (await request.get(`http://localhost:3000/api/platform?section=detail&id=${listing.id}`)).json(); expect(publicDetail.reviews[0].rating).toBe(5);
  const lead = await request.post('http://localhost:3000/api/platform', { data: { action: 'enquiry', listingId: listing.id, name: 'Visitor Test', email: 'visitor@example.test', message: 'I would like to enquire about availability for a family visit.' } }); expect(lead.ok()).toBeTruthy();
  await page.getByRole('button', { name: 'Refresh dashboard' }).click();
  await page.getByRole('button', { name: /^Enquiries/ }).click();
  await expect(page.getByText('I would like to enquire about availability for a family visit.')).toBeVisible();
  await page.getByRole('button', { name: 'Content & directory' }).click();
  await expect(page.getByRole('heading', { name: 'Make the platform your own.' })).toBeVisible();
  await page.getByRole('button', { name: 'New story', exact: true }).click();
  await page.getByLabel('Story title', { exact: true }).fill('Workflow Test Article');
  await page.getByLabel('Cover image URL', { exact: true }).fill('https://images.pexels.com/photos/4324492/pexels-photo-4324492.jpeg');
  await page.getByLabel('Article body', { exact: true }).fill('This is a test article used to verify that editorial drafts remain private and published stories reach the community.');
  await page.getByRole('checkbox', { name: /Publish this story/ }).uncheck();
  const draftResponse = page.waitForResponse(r => r.url().endsWith('/api/platform') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save story', exact: true }).click();
  expect((await draftResponse).ok()).toBeTruthy();
  await expect(page.locator('.cms-story-list').getByText('LOCAL STORIES · Draft', { exact: true })).toBeVisible();
  const draftPublic = await (await request.get('http://localhost:3000/api/platform')).json(); expect(JSON.parse(draftPublic.settings.articles).some((a: { title: string }) => a.title === 'Workflow Test Article')).toBeFalsy();
  await page.getByRole('checkbox', { name: /Publish this story/ }).check();
  const publishResponse = page.waitForResponse(r => r.url().endsWith('/api/platform') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save story', exact: true }).click();
  expect((await publishResponse).ok()).toBeTruthy();
  await expect(page.locator('.cms-story-list').getByText('LOCAL STORIES · Published', { exact: true })).toBeVisible();
  const publishedPublic = await (await request.get('http://localhost:3000/api/platform')).json(); expect(JSON.parse(publishedPublic.settings.articles).some((a: { title: string }) => a.title === 'Workflow Test Article')).toBeTruthy();
  await page.getByTitle('Sign out').click();
  await expect(page.getByRole('button', { name: 'Sign in to your dashboard' })).toBeVisible();
  const protectedDashboard = await page.request.get('http://localhost:3000/api/platform?section=dashboard'); expect(protectedDashboard.status()).toBe(401);
  expect(errors).toEqual([]);
 } finally {
  if (userId) {
   const own = await db.select({ id: listings.id }).from(listings).where(eq(listings.ownerId, userId));
   if (own.length) { const ids = own.map(l => l.id); await db.delete(enquiries).where(inArray(enquiries.listingId, ids)); await db.delete(reviews).where(inArray(reviews.listingId, ids)); await db.delete(saves).where(inArray(saves.listingId, ids)); }
   await db.delete(saves).where(eq(saves.userId, userId)); await db.delete(listings).where(eq(listings.ownerId, userId)); await db.delete(users).where(eq(users.id, userId));
  }
  if (uploadedKey) await db.delete(content).where(eq(content.key, uploadedKey));
  if (originalArticles) await db.insert(content).values(originalArticles).onConflictDoUpdate({ target: content.key, set: { value: originalArticles.value } });
  else await db.delete(content).where(eq(content.key, 'articles'));
 }
});

test('search and mobile navigation', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 });
 await page.goto('http://localhost:3000');
 await page.getByRole('textbox', { name: 'Search Koraput' }).fill('Deomali');
 await page.locator('.hero-search').getByRole('button', { name: 'Explore Koraput' }).click();
 await expect(page.locator('.listing-card')).toHaveCount(1);
 await page.getByRole('button', { name: 'Deomali Hills', exact: true }).click();
 await expect(page.getByRole('link', { name: 'Get directions' })).toHaveAttribute('href', /google.com\/maps/);
 await page.getByRole('button', { name: 'Close dialog' }).click();
 await page.getByRole('button', { name: 'Toggle menu' }).click();
 await page.getByRole('button', { name: 'Creators', exact: true }).click();
 await expect(page.getByRole('heading', { name: 'Meet our creative voices.' })).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
