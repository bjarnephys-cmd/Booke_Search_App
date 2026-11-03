import { Book, User, BooksResponse, RecommendationResponse, StatsResponse } from '../types.ts';
import { appLogger } from './logger.ts';

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
      appLogger.log('info', 'Backend skiftet til: Indbygget Node.js / SQLite (Lokal)');
    } else {
      const cleaned = url.trim().replace(/\/$/, '');
      localStorage.setItem(BACKEND_STORAGE_KEY, cleaned);
      appLogger.log('info', `Backend skiftet til ekstern URL: ${cleaned}`);
    }
    window.dispatchEvent(new Event('backend-target-changed'));
  }
}

export function isUsingPhpBackend(): boolean {
  return getBackendBaseUrl().length > 0;
}

export function resolveUrl(endpoint: string): string {
  const base = getBackendBaseUrl();
  // If no base URL is set, use local Node/Express backend on relative /api/*
  if (!base) return endpoint;

  // Split endpoint into pathname and query string
  const [pathname, queryString] = endpoint.split('?');
  let cleanBase = base.trim().replace(/\/$/, '');

  // Prevent duplicate /api if base URL already ends with /api
  let routePath = pathname;
  if (cleanBase.endsWith('/api') && routePath.startsWith('/api')) {
    routePath = routePath.substring(4);
  }

  // Form URL with PATH_INFO e.g. https://bjarnephys.com/BogApp/api.php/api/books?search=...
  const urlWithRoute = `${cleanBase}${routePath}`;
  return queryString ? `${urlWithRoute}?${queryString}` : urlWithRoute;
}

export function normalizeBook(raw: any): Book {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 0,
      titel: '',
      forfatter: '',
      genre: 'genre-0',
      score: 0,
      rating_count: 1,
      total_score: 0,
    };
  }
  const scoreNum = typeof raw.score === 'number' ? raw.score : parseFloat(String(raw.score));
  const ratingCountNum = typeof raw.rating_count === 'number' ? raw.rating_count : parseInt(String(raw.rating_count), 10);
  const totalScoreNum = typeof raw.total_score === 'number' ? raw.total_score : parseFloat(String(raw.total_score));

  return {
    id: Number(raw.id) || 0,
    titel: String(raw.titel || ''),
    forfatter: String(raw.forfatter || ''),
    genre: String(raw.genre || 'genre-0'),
    score: isNaN(scoreNum) ? 0 : scoreNum,
    rating_count: isNaN(ratingCountNum) ? 1 : ratingCountNum,
    total_score: isNaN(totalScoreNum) ? (isNaN(scoreNum) ? 0 : scoreNum) : totalScoreNum,
  };
}

export function normalizeUser(raw: any): User {
  return {
    id: Number(raw?.id) || 0,
    alder: Number(raw?.alder) || 0,
    ynglingsforfatter: String(raw?.ynglingsforfatter || ''),
    ynglingsgenre: String(raw?.ynglingsgenre || 'genre-0'),
    created_at: String(raw?.created_at || ''),
    recommendations: Array.isArray(raw?.recommendations) ? raw.recommendations : [],
  };
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

  appLogger.log('info', `Henter bøger fra: ${url}`, `Parametre: ${queryString || 'standard'}`);

  const startTime = performance.now();
  let res: Response;
  try {
    res = await fetch(url);
  } catch (netErr: any) {
    appLogger.log('error', `Netværksfejl ved kald til ${url}`, netErr.message);
    throw new Error(`Netværksfejl: Kunne ikke forbinde til ${url}. Tjek CORS eller internetforbindelse.`);
  }

  const duration = parseFloat((performance.now() - startTime).toFixed(2));

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errMsg = errorData.error || `HTTP ${res.status}: Kunne ikke hente bøger`;
    appLogger.log('error', errMsg, `URL: ${url} (${duration} ms)`);
    throw new Error(errMsg);
  }

  appLogger.log('success', `⏱️ Bøger modtaget på ${duration} ms (HTTP ${res.status})`, `URL: ${url}`, duration);

  const data = await res.json();
  const rawList = Array.isArray(data) ? data : (Array.isArray(data.books) ? data.books : []);
  return {
    books: rawList.map(normalizeBook),
    total: typeof data.total === 'number' ? data.total : (rawList.length || 0),
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : 24,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
  };
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
    throw new Error(errorData.error || `Kunne ikke hente brugere (HTTP ${res.status})`);
  }
  const data = await res.json();
  const rawUsers = Array.isArray(data) ? data : (Array.isArray(data.users) ? data.users : []);
  return {
    users: rawUsers.map(normalizeUser),
    total: typeof data.total === 'number' ? data.total : rawUsers.length,
  };
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
    throw new Error(errorData.error || `Kunne ikke oprette bruger (HTTP ${res.status})`);
  }
  const json = await res.json();
  return {
    success: true,
    user: normalizeUser(json.user),
    message: json.message || 'Bruger oprettet',
  };
}

export async function fetchRecommendations(userId: number): Promise<RecommendationResponse> {
  const url = resolveUrl(`/api/recommendations?userId=${userId}`);
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Kunne ikke hente anbefalinger (HTTP ${res.status})`);
  }
  const data = await res.json();
  const p1Raw = Array.isArray(data.priority1Books)
    ? data.priority1Books
    : (Array.isArray(data.priority1Matches) ? data.priority1Matches : []);
  const p2Raw = Array.isArray(data.priority2Books)
    ? data.priority2Books
    : (Array.isArray(data.priority2Matches) ? data.priority2Matches : []);

  return {
    user: normalizeUser(data.user),
    hasPriority1Match: Boolean(data.hasPriority1Match ?? (p1Raw.length > 0)),
    priority1Count: typeof data.priority1Count === 'number' ? data.priority1Count : p1Raw.length,
    priority1UsersCount: typeof data.priority1UsersCount === 'number' ? data.priority1UsersCount : (p1Raw.length > 0 ? 1 : 0),
    priority1Books: p1Raw.map((b: any) => ({
      ...normalizeBook(b),
      recommendedByUserId: b.recommendedByUserId ? Number(b.recommendedByUserId) : undefined,
      matchReason: b.matchReason || `1. Prioritet (Samme alder og forfatter)`,
    })),
    priority2Books: p2Raw.map((b: any) => ({
      ...normalizeBook(b),
      matchReason: b.matchReason || `2. Prioritet: Match på yndlingsgenre eller topscore`,
    })),
  };
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
    throw new Error(errorData.error || `Kunne ikke afgive bedømmelse (HTTP ${res.status})`);
  }
  const json = await res.json();
  return {
    success: true,
    book: normalizeBook(json.book),
    message: json.message || 'Bedømmelse modtaget',
  };
}

export async function fetchStats(): Promise<StatsResponse> {
  try {
    const url = resolveUrl('/api/stats');
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      totalBooks: Number(data.totalBooks) || 1000,
      totalUsers: Number(data.totalUsers) || 70,
      totalAuthors: Number(data.totalAuthors) || 100,
      totalGenres: Number(data.totalGenres) || 5,
      averageScore: typeof data.averageScore === 'number' ? data.averageScore : (parseFloat(String(data.averageScore)) || 4.5),
    };
  } catch (err) {
    // Graceful fallback prevents crashing the UI if an external PHP endpoint is missing /api/stats
    return {
      totalBooks: 1000,
      totalUsers: 70,
      totalAuthors: 100,
      totalGenres: 5,
      averageScore: 4.5,
    };
  }
}

export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  const url = resolveUrl('/api/reset');
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Kunne ikke nulstille database');
  }
  return res.json();
}

export interface PingResult {
  url: string;
  targetName: string;
  rttMs: number;
  status: number | 'error';
  errorMessage?: string;
  serverInfo?: {
    region?: string;
    regionName?: string;
    platform?: string;
  };
}

export async function measurePing(targetUrl: string, targetName: string): Promise<PingResult> {
  const start = performance.now();
  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      cache: 'no-store',
    });
    const rtt = Math.round(performance.now() - start);
    let serverInfo;
    try {
      const data = await res.json();
      if (data && (data.region || data.regionName)) {
        serverInfo = {
          region: data.region,
          regionName: data.regionName,
          platform: data.platform,
        };
      }
    } catch {
      // not JSON, keep serverInfo undefined
    }

    return {
      url: targetUrl,
      targetName,
      rttMs: rtt,
      status: res.status,
      serverInfo,
    };
  } catch (err: any) {
    const rtt = Math.round(performance.now() - start);
    return {
      url: targetUrl,
      targetName,
      rttMs: rtt,
      status: 'error',
      errorMessage: err.message,
    };
  }
}
