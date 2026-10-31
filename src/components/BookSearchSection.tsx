import React, { useState, useEffect } from 'react';
import { Book, BooksResponse, GENRE_METADATA } from '../types.ts';
import { fetchBooks } from '../services/api.ts';
import { BookCard } from './BookCard.tsx';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface BookSearchSectionProps {
  onRateBook: (book: Book) => void;
  onSelectAuthorForFilter?: (author: string) => void;
}

export const BookSearchSection: React.FC<BookSearchSectionProps> = ({
  onRateBook,
}) => {
  const [booksData, setBooksData] = useState<BooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'score' | 'title' | 'author'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(16);

  const loadBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBooks({
        search: search.trim() || undefined,
        author: author.trim() || undefined,
        genre: genre !== 'all' ? genre : undefined,
        minScore: minScore > 0 ? minScore : undefined,
        sortBy,
        sortDir,
        page,
        limit,
      });
      setBooksData(data);
    } catch (err: any) {
      setError(err.message || 'Kunne ikke hente bøger fra SQLite databasen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [page, limit, genre, minScore, sortBy, sortDir]);

  // Debounced search on enter or button click
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadBooks();
  };

  const handleResetFilters = () => {
    setSearch('');
    setAuthor('');
    setGenre('all');
    setMinScore(0);
    setSortBy('score');
    setSortDir('desc');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 shadow-sm">
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <img
            src="/src/assets/images/hero_scandinavian_library_1793372929319.jpg"
            alt="Skandinavisk minimalistisk bibliotek med bøger og dagslys"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />
          
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end max-w-3xl">
            <span className="text-amber-400 font-mono-data text-xs tracking-wider uppercase font-semibold mb-2">
              Milestone 1 & 2 · 1000 Bøger · 100 Forfattere · SQLite & REST
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-3">
              Find og vurder Danmarks næste store læseoplevelse
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed line-clamp-2">
              Søg på tværs af 100 forfattere (<code>ff-0</code> til <code>ff-99</code>), 5 genrer og gennemsnitlige anbefalingsscorer fra 0.0 til 9.0.
            </p>
          </div>
        </div>

        {/* Integrated Search Console */}
        <div className="p-4 sm:p-6 bg-stone-900/90 border-t border-stone-800 text-stone-200">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Free text search */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Søg i titel eller forfatter (f.eks. ff-12, tit-ff-5)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono-data"
                />
              </div>

              {/* Exact author filter */}
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Forfatter (ff-0..99)"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono-data"
                />
              </div>

              {/* Genre selector */}
              <div className="sm:col-span-2">
                <select
                  value={genre}
                  onChange={(e) => {
                    setGenre(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">Alle genrer (5)</option>
                  {Object.entries(GENRE_METADATA).map(([key, val]) => (
                    <option key={key} value={key}>
                      {key} ({val.label})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit CTA */}
              <div className="sm:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded-lg text-xs transition-colors shadow-xs"
                >
                  Søg i SQLite
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Nulstil filtre"
                  className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-bar: Genre quick segmented controls & score filter */}
            <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              {/* Segmented genre buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-stone-400 font-medium mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" /> Genrer:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setGenre('all');
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    genre === 'all'
                      ? 'bg-amber-500 text-stone-950 font-semibold'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  Alle
                </button>
                {Object.entries(GENRE_METADATA).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setGenre(key);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md font-mono-data transition-colors ${
                      genre === key
                        ? 'bg-amber-500 text-stone-950 font-semibold'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Score filter slider & Sortering */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">Min. Score:</span>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    step="0.5"
                    value={minScore}
                    onChange={(e) => {
                      setMinScore(parseFloat(e.target.value));
                      setPage(1);
                    }}
                    className="w-24 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="font-mono-data font-bold text-amber-400 w-8 text-right">
                    {minScore > 0 ? `${minScore.toFixed(1)}+` : 'Alle'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                  <select
                    value={`${sortBy}_${sortDir}`}
                    onChange={(e) => {
                      const [sb, sd] = e.target.value.split('_');
                      setSortBy(sb as any);
                      setSortDir(sd as any);
                      setPage(1);
                    }}
                    className="bg-stone-800 border border-stone-700 rounded-md px-2 py-1 text-stone-200 text-xs focus:outline-hidden"
                  >
                    <option value="score_desc">Højeste score først</option>
                    <option value="score_asc">Laveste score først</option>
                    <option value="title_asc">Titel (A-Å)</option>
                    <option value="author_asc">Forfatter (A-Å)</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-stone-900">
            Katalog ({booksData?.total ?? 0} bøger fundet)
          </h2>
          {loading && (
            <span className="text-xs text-stone-500 font-mono-data">Henter data...</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span>Vis pr. side:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
            className="border border-stone-300 rounded px-2 py-1 bg-white text-stone-900"
          >
            <option value="12">12</option>
            <option value="16">16</option>
            <option value="24">24</option>
            <option value="48">48</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Book Grid */}
      {booksData && booksData.books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {booksData.books.map((book) => (
            <BookCard key={book.id} book={book} onRate={onRateBook} />
          ))}
        </div>
      ) : !loading ? (
        <div className="py-16 text-center bg-stone-50 rounded-2xl border border-stone-200/80">
          <p className="text-base font-medium text-stone-800 mb-1">
            Ingen bøger matcher dine søgekriterier
          </p>
          <p className="text-xs text-stone-500 mb-4">
            Prøv at nulstille forfatterfilteret eller sænk minimumsscoren.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Nulstil alle filtre
          </button>
        </div>
      ) : null}

      {/* Pagination Controls */}
      {booksData && booksData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-stone-200">
          <div className="text-xs text-stone-500 font-mono-data">
            Viser side {booksData.page} af {booksData.totalPages} ({booksData.total} bøger i alt)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Quick page numbers */}
            <div className="flex items-center gap-1 text-xs font-mono-data">
              {Array.from({ length: Math.min(5, booksData.totalPages) }, (_, i) => {
                let p = page;
                if (page <= 3) {
                  p = i + 1;
                } else if (page >= booksData.totalPages - 2) {
                  p = booksData.totalPages - 4 + i;
                } else {
                  p = page - 2 + i;
                }
                if (p < 1 || p > booksData.totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                      page === p
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(booksData.totalPages, p + 1))}
              disabled={page >= booksData.totalPages}
              className="p-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
