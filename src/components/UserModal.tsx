import React, { useState } from 'react';
import { User, GENRE_METADATA } from '../types.ts';
import { X, UserPlus, Check, Search, Sparkles } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  users: User[];
  onSelectUser: (user: User) => void;
  onCreateUser: (data: { alder: number; ynglingsforfatter: string; ynglingsgenre: string }) => Promise<void>;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onSelectUser,
  onCreateUser,
}) => {
  const [tab, setTab] = useState<'select' | 'create'>('select');
  const [searchAuthor, setSearchAuthor] = useState('');
  
  // New user form state
  const [alder, setAlder] = useState<number>(28);
  const [ynglingsforfatter, setYnglingsforfatter] = useState<string>('ff-12');
  const [ynglingsgenre, setYnglingsgenre] = useState<string>('genre-2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    if (!searchAuthor.trim()) return true;
    const q = searchAuthor.toLowerCase();
    return (
      u.ynglingsforfatter.toLowerCase().includes(q) ||
      u.alder.toString().includes(q) ||
      u.id.toString().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateUser({
        alder: Number(alder),
        ynglingsforfatter: ynglingsforfatter.trim(),
        ynglingsgenre: ynglingsgenre.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fejl ved oprettelse af bruger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-stone-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Brugerstyring (Milestone 3)
            </span>
            <h3 className="font-display text-xl font-bold text-stone-900 leading-tight">
              Vælg eller opret aktiv bruger
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-stone-100 rounded-lg mt-4 shrink-0">
          <button
            onClick={() => setTab('select')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === 'select'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Vælg blandt de {users.length} oprettede brugere
          </button>
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === 'create'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Opret ny bruger (alder, forfatter, genre)
          </button>
        </div>

        {/* Tab 1: Select User */}
        {tab === 'select' && (
          <div className="mt-4 flex-1 flex flex-col min-h-0">
            <div className="relative mb-3 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Filtrer på forfatter (f.eks. ff-12), alder eller ID..."
                value={searchAuthor}
                onChange={(e) => setSearchAuthor(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {filteredUsers.map((u) => {
                const isSelected = currentUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-xs font-bold text-stone-900">
                          Bruger #{u.id}
                        </strong>
                        <span className="text-xs text-stone-500 font-mono-data">
                          x₁ (alder): {u.alder} år
                        </span>
                        <span className="text-stone-300">·</span>
                        <span className="text-xs text-amber-700 font-mono-data font-semibold">
                          x₂ (forfatter): {u.ynglingsforfatter}
                        </span>
                        <span className="text-stone-300">·</span>
                        <span className="text-xs text-cyan-700 font-mono-data">
                          x₃ (genre): {u.ynglingsgenre}
                        </span>
                      </div>
                      {u.recommendations && u.recommendations.length > 0 && (
                        <p className="text-[11px] text-stone-500 truncate">
                          Anbefaler: {u.recommendations.join(', ')}
                        </p>
                      )}
                    </div>
                    {isSelected ? (
                      <span className="shrink-0 p-1.5 bg-stone-900 text-white rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-stone-500 px-2 py-1 bg-stone-100 rounded-md">
                        Vælg
                      </span>
                    )}
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="text-xs text-stone-500 text-center py-6">
                  Ingen brugere matcher søgningen.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Create User */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} className="mt-4 space-y-4 overflow-y-auto pr-1">
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>PRD Milestone 3 krav:</strong> Brugeren angiver sin alder, yndlingsforfatter og yndlingsgenre. Systemet opretter brugeren i <code>BrugerTabel</code> og tilknytter automatisk 2 anbefalede bøger fra den valgte forfatter.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Alder (x₁)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={alder}
                onChange={(e) => setAlder(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400 font-mono-data"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Tip: Prøv en alder der matcher en eksisterende bruger (f.eks. 15 eller 25) for at teste Milestone 4 anbefalinger.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Yndlingsforfatter (x₂)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="f.eks. ff-12"
                  value={ynglingsforfatter}
                  onChange={(e) => setYnglingsforfatter(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400 font-mono-data"
                />
                <select
                  onChange={(e) => setYnglingsforfatter(e.target.value)}
                  value={ynglingsforfatter}
                  className="px-2 py-2 text-xs border border-stone-200 rounded-lg bg-stone-50"
                >
                  <option value="" disabled>Hurtigvælg ff-0 .. ff-99</option>
                  {[0, 1, 5, 10, 12, 15, 20, 25, 30, 42, 50, 70, 99].map((num) => (
                    <option key={num} value={`ff-${num}`}>
                      ff-{num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Yndlingsgenre (x₃)
              </label>
              <select
                value={ynglingsgenre}
                onChange={(e) => setYnglingsgenre(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400"
              >
                {Object.entries(GENRE_METADATA).map(([key, val]) => (
                  <option key={key} value={key}>
                    {key} — {val.label} ({val.desc})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <div className="pt-2 flex justify-end gap-3 border-t border-stone-100">
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
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Opretter...' : 'Opret & Vælg Bruger'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
