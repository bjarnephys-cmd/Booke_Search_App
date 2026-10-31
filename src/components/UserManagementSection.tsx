import React, { useState } from 'react';
import { User, GENRE_METADATA } from '../types.ts';
import { UserPlus, Search, UserCheck, Filter, Users, BookOpen } from 'lucide-react';

interface UserManagementSectionProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  onCreateUser: (data: {
    alder: number;
    ynglingsforfatter: string;
    ynglingsgenre: string;
    recommendedBooks?: string[];
  }) => Promise<void>;
  onRefreshUsers: () => Promise<void>;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  users,
  currentUser,
  onSelectUser,
  onCreateUser,
}) => {
  // Filter by author ff-k as specified in PRD
  const [authorFilter, setAuthorFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState<string>('');
  
  // New user form state
  const [alder, setAlder] = useState<number>(30);
  const [ynglingsforfatter, setYnglingsforfatter] = useState<string>('ff-15');
  const [ynglingsgenre, setYnglingsgenre] = useState<string>('genre-0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    if (authorFilter.trim()) {
      const q = authorFilter.trim().toLowerCase();
      if (!u.ynglingsforfatter.toLowerCase().includes(q)) return false;
    }
    if (ageFilter.trim()) {
      if (u.alder.toString() !== ageFilter.trim()) return false;
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await onCreateUser({
        alder: Number(alder),
        ynglingsforfatter: ynglingsforfatter.trim(),
        ynglingsgenre: ynglingsgenre.trim(),
      });
      setFormSuccess(`Bruger oprettet! Alder: ${alder}, Forfatter: ${ynglingsforfatter}, Genre: ${ynglingsgenre}`);
    } catch (err: any) {
      setFormError(err.message || 'Fejl ved oprettelse af bruger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro box */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">
              Milestone 3 Bruger-administration
            </span>
            <h1 className="font-display text-3xl font-bold text-stone-900 leading-tight">
              BrugerTabel & Profilstyring ({users.length} brugere)
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500 font-mono-data">
            <Users className="w-4 h-4 text-stone-700" />
            <span>70 standard initialiserede brugere (i = 0..69)</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-stone-600 leading-relaxed max-w-3xl">
          Hver bruger i startdatasættet har tre systemudledte parametre:
          <span className="font-semibold text-stone-900"> x₁ (alder = i)</span>,
          <span className="font-semibold text-stone-900"> x₂ (yndlingsforfatter = ff-i)</span>, og
          <span className="font-semibold text-stone-900"> x₃ (yndlingsgenre = genre-(i % 5))</span>.
          Hver bruger har desuden anbefalet 2 specifikke bogtitler af sin yndlingsforfatter med sin yndlingsgenre.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form: Opret ny bruger i BrugerTabel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-stone-100">
            <UserPlus className="w-5 h-5 text-amber-600" />
            <h2 className="font-display text-lg font-bold text-stone-900">
              Opret ny bruger i BrugerTabel
            </h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Alder (Parameter x₁)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                required
                value={alder}
                onChange={(e) => setAlder(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-500 font-mono-data"
              />
              <span className="text-[11px] text-stone-500 block mt-0.5">
                Angiv alder (f.eks. match en eksisterende bruger som 12 eller 25 for at teste 1. prioritet)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Yndlingsforfatter (Parameter x₂, angives ff-k)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="ff-k, f.eks. ff-15"
                  value={ynglingsforfatter}
                  onChange={(e) => setYnglingsforfatter(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-500 font-mono-data"
                />
                <select
                  value={ynglingsforfatter}
                  onChange={(e) => setYnglingsforfatter(e.target.value)}
                  className="px-2 py-2 text-xs border border-stone-300 rounded-lg bg-stone-50 font-mono-data"
                >
                  <option value="" disabled>ff-0..99</option>
                  {[0, 1, 5, 10, 12, 15, 20, 25, 30, 42, 50, 60, 69, 70, 85, 99].map((n) => (
                    <option key={n} value={`ff-${n}`}>ff-{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Yndlingsgenre (Parameter x₃)
              </label>
              <select
                value={ynglingsgenre}
                onChange={(e) => setYnglingsgenre(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-500"
              >
                {Object.entries(GENRE_METADATA).map(([key, val]) => (
                  <option key={key} value={key}>
                    {key} — {val.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-600">
              <span className="font-semibold text-stone-800 block mb-1">
                Udledte anbefalinger for denne bruger:
              </span>
              Systemet udvælger automatisk 2 bogtitler fra forfatter <strong>{ynglingsforfatter}</strong> med genren <strong>{ynglingsgenre}</strong> og gemmer dem i <code>AnbefalingTabel</code>.
            </div>

            {formError && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {formError}
              </p>
            )}

            {formSuccess && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                {formSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? 'Opretter...' : 'Opret Bruger i BrugerTabel'}
            </button>
          </form>
        </div>

        {/* User Table & Filtering */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-100">
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">
                BrugerTabel Oversigt
              </h2>
              <p className="text-xs text-stone-500">
                Viser {filteredUsers.length} af {users.length} registrerede brugere
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Forfatter ff-k..."
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className="pl-8 pr-2 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400 w-36 font-mono-data"
                />
              </div>
              <input
                type="number"
                placeholder="Alder"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="px-2 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400 w-20 font-mono-data"
              />
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredUsers.map((u) => {
              const isActive = currentUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-data font-bold text-xs text-stone-900">
                        Bruger #{u.id}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-xs text-stone-600 font-mono-data">
                        x₁ (alder): <strong>{u.alder} år</strong>
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-xs text-amber-800 font-mono-data font-semibold">
                        x₂: {u.ynglingsforfatter}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-xs text-cyan-800 font-mono-data">
                        x₃: {u.ynglingsgenre}
                      </span>
                    </div>

                    {u.recommendations && u.recommendations.length > 0 && (
                      <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">
                          Anbefaler 2 titler: <strong>{u.recommendations.join(', ')}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isActive ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
                        <UserCheck className="w-3.5 h-3.5" />
                        Aktiv
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectUser(u)}
                        className="px-3 py-1 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-100 rounded-md transition-colors"
                      >
                        Vælg som aktiv
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <p className="text-xs text-stone-500 text-center py-8">
                Ingen brugere matcher forfatterfilteret "{authorFilter}".
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
