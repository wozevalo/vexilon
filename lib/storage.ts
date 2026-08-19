import { Article } from './types';

/** Fetch all articles from the server-side API (sorted by date, newest first) */
export async function getArticles(): Promise<Article[]> {
  const res = await fetch('/api/articles', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Upload a new article with image file via multipart form */
export async function addArticle(
  title: string,
  content: string | undefined,
  image: File
): Promise<Article | null> {
  const form = new FormData();
  form.append('title', title);
  if (content) form.append('content', content);
  form.append('image', image);

  const res = await fetch('/api/articles', { method: 'POST', body: form });
  if (!res.ok) return null;
  return res.json();
}

/** Delete an article by id */
export async function deleteArticle(id: string): Promise<boolean> {
  const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
  return res.ok;
}
