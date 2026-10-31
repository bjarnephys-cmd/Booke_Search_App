import { Book, User, BooksResponse, RecommendationResponse, StatsResponse } from '../types.ts';

const BACKEND_STORAGE_KEY = 'boganbefaling_backend_url';

export function getBackendBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(BACKEND_STORAGE_KEY) || '';
  }
  return '';
}

export function setBackendBaseUrl(url: string) {
  if (typeof window !== 'undefined') {
    if (url.trim() === '') {
      localStorage.removeItem(BACKEND_STORAGE_KEY);
    } else {
      localStorage.setItem(BACKEND_STORAGE_KEY, url.trim().replace(/\/$/, ''));
    }
  }
}

function resolveUrl(endpoint: string): string {
  const base = getBackendBaseUrl();
  if (!base) return endpoint;
  // If base points directly to a single api.php script or a folder
  if (base.endsWith('.php')) {
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}route=${encodeURIComponent(endpoint)}`;
  }
  return `${base}${endpoint}`;
}

export async function fetchBooks(params: {
  search?: string;
  genre?: string;
  author?: string;
  minScore?: number;
  sortBy?: 'score' | 'title' | 'author';
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<BooksResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.genre && params.genre !== 'all') query.set('genre', params.genre);
  if (params.author) query.set('author', params.author);
  if (params.minScore !== undefined) query.set('minScore', params.minScore.toString());
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const url = resolveUrl(`/api/books${queryString}`);
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Kunne ikke hente bøger');
  }
  return res.json();
}

export async function fetchUsers(author?: string, limit = 100): Promise<{ users: User[]; total: number }> {
  const query = new URLSearchParams();
  if (author) query.set('author', author);
  if (limit) query.set('limit', limit.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const url = resolveUrl(`/api/users${queryString}`);
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Kunne ikke hente brugere');
  }
  return res.json();
}

export async function createUser(data: {
  alder: number;
  ynglingsforfatter: string;
  ynglingsgenre: string;
  recommendedBooks?: string[];
}): Promise<{ success: boolean; user: User; message: string }> {
  const url = resolveUrl('/api/users');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Kunne ikke oprette bruger');
  }
  return res.json();
}

export async function fetchRecommendations(userId: number): Promise<RecommendationResponse> {
  const url = resolveUrl(`/api/recommendations?userId=${userId}`);
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Kunne ikke hente anbefalinger');
  }
  return res.json();
}

export async function rateBook(bookId: number, score: number): Promise<{ success: boolean; book: Book; message: string }> {
  const url = resolveUrl(`/api/books/${bookId}/rate`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Kunne ikke afgive bedømmelse');
  }
  return res.json();
}

export async function fetchStats(): Promise<StatsResponse> {
  const url = resolveUrl('/api/stats');
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Kunne ikke hente statistikker');
  }
  return res.json();
}

export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  const url = resolveUrl('/api/reset');
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Kunne ikke nulstille database');
  }
  return res.json();
}
