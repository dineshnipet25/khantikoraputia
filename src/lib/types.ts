import type { listings, enquiries } from '@/db/schema';
export type Listing = Omit<typeof listings.$inferSelect, 'createdAt'> & { createdAt: string | Date };
export type User = { id: number; name: string; email: string; role: string };
export type Enquiry = Omit<typeof enquiries.$inferSelect, 'createdAt'> & { createdAt: string | Date };
export const categories = ['Stays & Hotels', 'Food & Cafés', 'Tours & Guides', 'Shops & Handicrafts', 'Local Creators', 'Nature & Attractions'];
export const locations = ['Koraput', 'Jeypore', 'Deomali', 'Kotpad', 'Machkund', 'Semiliguda', 'Sunabeda'];
