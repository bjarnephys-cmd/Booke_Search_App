export interface Book {
  id: number;
  titel: string;
  forfatter: string;
  genre: string;
  score: number;
  rating_count: number;
  total_score: number;
}

export interface User {
  id: number;
  alder: number;
  ynglingsforfatter: string;
  ynglingsgenre: string;
  created_at: string;
  recommendations?: string[];
}

export interface BooksResponse {
  books: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecommendationResponse {
  user: User;
  hasPriority1Match: boolean;
  priority1Count: number;
  priority1UsersCount: number;
  priority1Books: (Book & { recommendedByUserId?: number; matchReason: string })[];
  priority2Books: (Book & { matchReason: string })[];
}

export interface StatsResponse {
  totalBooks: number;
  totalUsers: number;
  totalAuthors: number;
  totalGenres: number;
  averageScore: number;
}

export const GENRE_METADATA: Record<string, { label: string; color: string; desc: string }> = {
  'genre-0': { label: 'Krimi & Spænding', color: 'from-amber-700/20 to-red-900/30 text-amber-300', desc: 'Mysterier, detektiver og psykologisk drama' },
  'genre-1': { label: 'Sci-Fi & Fantasy', color: 'from-cyan-700/20 to-blue-900/30 text-cyan-300', desc: 'Fremtidsvisioner, rumrejser og magiske verdener' },
  'genre-2': { label: 'Historie & Biografi', color: 'from-emerald-700/20 to-teal-900/30 text-emerald-300', desc: 'Virkelige hændelser, krøniker og livsfortællinger' },
  'genre-3': { label: 'Romantik & Drama', color: 'from-rose-700/20 to-pink-900/30 text-rose-300', desc: 'Kærlighed, relationer og menneskelige skæbner' },
  'genre-4': { label: 'Fagbog & Filosofi', color: 'from-indigo-700/20 to-purple-900/30 text-indigo-300', desc: 'Videnskab, tanker og samfundsforståelse' },
};
