import { parseStories } from '@/lib/stories';
export const contentKeys = ['announcement', 'heroTitle', 'heroSubtitle', 'categories', 'locations', 'articles'];
export function publicSettings(entries: { key: string; value: string }[]) {
 const result = Object.fromEntries(entries.map(e => [e.key, e.value]));
 if (result.articles) result.articles = JSON.stringify(parseStories(result.articles).filter(a => a.published !== false));
 return result;
}
