import { pgTable, serial, text, timestamp, integer, boolean, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(), role: text('role').notNull().default('business'),
  suspended: boolean('suspended').notNull().default(false), createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const sessions = pgTable('sessions', { token: text('token').primaryKey(), userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), expiresAt: timestamp('expires_at').notNull() });
export const listings = pgTable('listings', {
  id: serial('id').primaryKey(), ownerId: integer('owner_id').references(() => users.id), name: text('name').notNull(),
  kind: text('kind').notNull().default('business'), category: text('category').notNull(), location: text('location').notNull(),
  description: text('description').notNull(), image: text('image').notNull(), phone: text('phone').default(''),
  website: text('website').default(''), address: text('address').default(''), hours: text('hours').default('Contact for opening hours'),
  price: text('price').default('Enquire for pricing'), status: text('status').notNull().default('pending'),
  featured: boolean('featured').notNull().default(false), sample: boolean('sample').notNull().default(false),
  views: integer('views').notNull().default(0), createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const enquiries = pgTable('enquiries', {
  id: serial('id').primaryKey(), listingId: integer('listing_id').references(() => listings.id), userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(), email: text('email').notNull(), message: text('message').notNull(), type: text('type').notNull().default('enquiry'), createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const reviews = pgTable('reviews', { id: serial('id').primaryKey(), listingId: integer('listing_id').references(() => listings.id).notNull(), userId: integer('user_id').references(() => users.id).notNull(), rating: integer('rating').notNull(), comment: text('comment').notNull(), createdAt: timestamp('created_at').defaultNow().notNull() });
export const saves = pgTable('saves', { id: serial('id').primaryKey(), userId: integer('user_id').references(() => users.id).notNull(), listingId: integer('listing_id').references(() => listings.id).notNull() }, (t) => [uniqueIndex('user_listing_save').on(t.userId, t.listingId)]);
export const content = pgTable('content', { key: text('key').primaryKey(), value: text('value').notNull() });
