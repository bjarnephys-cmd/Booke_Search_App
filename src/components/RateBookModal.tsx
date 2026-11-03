import React, { useState } from 'react';
import { Book } from '../types.ts';
import { Star, X } from 'lucide-react';

interface RateBookModalProps {
  book: Book | null;
  onClose: () => void;
  onSubmitRate: (bookId: number, score: number) => Promise<void>;
}

export const RateBookModal: React.FC<RateBookModalProps> = ({
  book,
  onClose,
  onSubmitRate,
}) => {
  const initialScore = book ? Math.round(Number(book.score) || 0) : 7;
  const [score, setScore] = useState<number>(initialScore);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!book) return null;

  const currentAvgScore = (Number(book.score) || 0).toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmitRate(book.id, score);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fejl ved gemning af bedømmelse');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Anbefalingsscore (0-9)
            </span>
            <h3 className="font-display text-lg font-bold text-stone-900 leading-tight">
              Bedøm {book.titel}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span>Nuværende gennemsnit</span>
              <span className="font-mono-data font-semibold text-stone-900">
                {currentAvgScore} / 9.0 ({book.rating_count} bedømmelser)
              </span>
            </div>
            <div className="text-xs text-stone-500">
              Forfatter: <strong className="font-mono-data text-stone-800">{book.forfatter}</strong> · Genre: <strong className="font-mono-data text-stone-800">{book.genre}</strong>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900 mb-2">
              Din karakter: <span className="font-mono-data font-bold text-amber-600 text-lg ml-1">{score}</span>
            </label>

            {/* Star buttons 0 to 9 */}
            <div className="grid grid-cols-10 gap-1 my-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setScore(val)}
                  className={`py-2 flex flex-col items-center justify-center rounded-lg text-xs font-mono-data transition-all ${
                    score === val
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : score > val
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Star className={`w-3 h-3 mb-0.5 ${score >= val ? 'fill-current' : 'text-stone-400'}`} />
                  <span>{val}</span>
                </button>
              ))}
            </div>

            {/* Range slider for smooth adjustment */}
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              value={score}
              onChange={(e) => setScore(parseFloat(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[11px] text-stone-400 mt-1 font-mono-data">
              <span>0 (Dårligst)</span>
              <span>4.5 (Middel)</span>
              <span>9 (Fremragende)</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Gemmer...' : 'Gem bedømmelse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
