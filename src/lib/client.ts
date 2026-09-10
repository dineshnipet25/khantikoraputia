export async function api(action: string, data: Record<string, unknown> = {}) {
 const response = await fetch('/api/platform', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, action }) });
 const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.'); return result;
}
export async function getData(section = '') { const response = await fetch(`/api/platform${section ? `?${section}` : ''}`); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Unable to load data.'); return result; }
