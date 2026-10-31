import React from 'react';
import { Book, GENRE_METADATA } from '../types.ts';
import { Star, BookOpen, PenLine } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onRate: (book: Book) => void;
  highlightReason?: string;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onRate, highlightReason }) => {
  const genreMeta = GENRE_METADATA[book.genre] || {
    label: book.genre,
    color: 'from-stone-700/20 to-stone-900/30 text-stone-300',
    desc: 'Litteratur',
  };

  // Score display helper
  const scorePercent = Math.min(100, Math.max(0, (book.score / 9) * 100));

  return (
    <article className="group relative flex flex-col bg-white rounded-xl border border-stone-200/90 hover:border-stone-400 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Book Cover simulation */}
      <div className={`relative h-44 w-full bg-gradient-to-br ${genreMeta.color} bg-stone-900 p-4 flex flex-col justify-between overflow-hidden border-b border-stone-200`}>
        {/* Book Spine optical accent */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-white/10 border-r border-white/5 pointer-events-none" />

        {/* Top cover metadata */}
        <div className="flex items-start justify-between gap-2 pl-3">
          <span className="text-[11px] uppercase tracking-wider text-white/70 font-medium">
            {book.genre}
          </span>
          <div className="flex items-center gap-1 bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-amber-300 text-xs font-mono-data font-semibold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{book.score.toFixed(1)}</span>
            <span className="text-white/40 text-[10px]">/ 9</span>
          </div>
        </div>

        {/* Center cover title & graphic */}
        <div className="pl-3 pr-1 py-1">
          <div className="text-xs text-white/60 mb-0.5 flex items-center gap-1 font-mono-data">
            <BookOpen className="w-3 h-3" />
            {book.forfatter}
          </div>
          <h3 className="font-display text-lg font-bold text-white tracking-tight leading-tight line-clamp-2">
            {book.titel}
          </h3>
        </div>

        {/* Bottom cover genre descriptor */}
        <div className="pl-3 text-[11px] text-white/60 truncate">
          {genreMeta.label}
        </div>
      </div>

      {/* Book Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {highlightReason && (
            <p className="text-xs font-medium text-amber-800 bg-amber-50 rounded-md p-2 mb-3 border border-amber-200/60 leading-relaxed">
              {highlightReason}
            </p>
          )}

          {/* Clean unboxed metadata with typographic separators */}
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <span className="font-mono-data font-semibold text-stone-800">{book.forfatter}</span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span>{genreMeta.label}</span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span className="font-mono-data">{book.rating_count} {book.rating_count === 1 ? 'vurdering' : 'vurderinger'}</span>
          </div>

          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            Bogtitel i kataloget for forfatter {book.forfatter}. Genren {book.genre} dækker {genreMeta.desc.toLowerCase()}.
          </p>
        </div>

        {/* Score progress bar + Rate Button */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex justify-between items-center text-[11px] text-stone-500 mb-1 font-mono-data">
              <span>Score</span>
              <span className="font-semibold text-stone-800">{book.score.toFixed(1)} / 9.0</span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onRate(book)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Giv karakter (0-9)"
          >
            <PenLine className="w-3.5 h-3.5 text-stone-500" />
            <span>Bedøm</span>
          </button>
        </div>
      </div>
    </article>
  );
};
