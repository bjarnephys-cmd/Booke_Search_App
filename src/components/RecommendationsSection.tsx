import React, { useState, useEffect } from 'react';
import { User, RecommendationResponse, Book, GENRE_METADATA } from '../types.ts';
import { fetchRecommendations, createUser } from '../services/api.ts';
import { BookCard } from './BookCard.tsx';
import { Sparkles, ShieldCheck, HelpCircle, UserPlus, Info, CheckCircle2 } from 'lucide-react';

interface RecommendationsSectionProps {
  currentUser: User | null;
  onRateBook: (book: Book) => void;
  onRefreshUsers: () => Promise<void>;
  onOpenSwitchUser: () => void;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  currentUser,
  onRateBook,
  onRefreshUsers,
  onOpenSwitchUser,
}) => {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingPeer, setCreatingPeer] = useState(false);
  const [peerSuccess, setPeerSuccess] = useState<string | null>(null);

  const loadRecs = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRecommendations(currentUser.id);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Kunne ikke hente anbefalinger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecs();
  }, [currentUser?.id]);

  // Handler to create an identical age + author peer user to demonstrate Milestone 4 Priority 1
  const handleCreateMatchingPeer = async () => {
    if (!currentUser) return;
    setCreatingPeer(true);
    setPeerSuccess(null);
    try {
      const res = await createUser({
        alder: currentUser.alder,
        ynglingsforfatter: currentUser.ynglingsforfatter,
        ynglingsgenre: currentUser.ynglingsgenre,
      });
      await onRefreshUsers();
      setPeerSuccess(
        `Ny bruger #${res.user.id} oprettet med alder ${currentUser.alder} år og forfatter ${currentUser.ynglingsforfatter}! 1. Prioritet er nu aktiv!`
      );
      await loadRecs();
    } catch (err: any) {
      setError(err.message || 'Kunne ikke oprette test-bruger');
    } finally {
      setCreatingPeer(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-stone-200">
        <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">
          Vælg en bruger for at se personlige anbefalinger
        </h2>
        <p className="text-xs text-stone-500 max-w-md mx-auto mb-6">
          PRD Milestone 4 anbefalingsmotoren kræver en aktiv brugerprofil med parametrene alder, yndlingsforfatter og yndlingsgenre.
        </p>
        <button
          onClick={onOpenSwitchUser}
          className="px-5 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
        >
          Vælg eller opret en bruger nu
        </button>
      </div>
    );
  }

  const genreMeta = GENRE_METADATA[currentUser.ynglingsgenre];

  return (
    <div className="space-y-8">
      {/* Header overview */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Milestone 4 Anbefalingsmotor
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs text-stone-500 font-mono-data">Bruger #{currentUser.id}</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-stone-900 leading-tight">
              Personlige anbefalinger for Bruger #{currentUser.id}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadRecs}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Opdater anbefalinger
            </button>
            <button
              onClick={onOpenSwitchUser}
              className="px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors"
            >
              Skift aktiv profil
            </button>
          </div>
        </div>

        {/* Algorithm parameters explainer */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Parameter x₁: Alder
            </span>
            <div className="text-xl font-bold text-stone-900 font-mono-data mb-1">
              {currentUser.alder} år
            </div>
            <p className="text-xs text-stone-500">
              Matcher andre brugere i <code>BrugerTabel</code> med præcis samme alder.
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">
              Parameter x₂: Yndlingsforfatter
            </span>
            <div className="text-xl font-bold text-amber-900 font-mono-data mb-1">
              {currentUser.ynglingsforfatter}
            </div>
            <p className="text-xs text-stone-500">
              Første prioritet søger efter andre brugere med samme forfatterfavorit.
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80">
            <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider block mb-1">
              Parameter x₃: Yndlingsgenre
            </span>
            <div className="text-xl font-bold text-cyan-900 font-mono-data mb-1">
              {currentUser.ynglingsgenre}
            </div>
            <p className="text-xs text-stone-500">
              {genreMeta?.label || currentUser.ynglingsgenre}. Anden prioritet hvis ingen match på x₁ + x₂.
            </p>
          </div>
        </div>

        {/* Test Priority 1 helper box */}
        {!data?.hasPriority1Match && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-950 font-semibold mb-0.5">
                  I startdatasættet har hver af de 70 brugere en unik alder (0..69) og forfatter (ff-0..ff-69)
                </strong>
                <span>
                  For at se <strong>1. Prioritet (Match på alder + forfatter)</strong> i funktion, kan du med ét klik oprette en anden bruger med alder <code>{currentUser.alder}</code> og forfatter <code>{currentUser.ynglingsforfatter}</code>.
                </span>
              </div>
            </div>

            <button
              onClick={handleCreateMatchingPeer}
              disabled={creatingPeer}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold shrink-0 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{creatingPeer ? 'Opretter test...' : 'Opret matchende bruger'}</span>
            </button>
          </div>
        )}

        {peerSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{peerSuccess}</span>
          </div>
        )}
      </div>

      {/* SECTION: 1. PRIORITET */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900">
                1. Prioritet: Match på Alder + Yndlingsforfatter
              </h2>
              <p className="text-xs text-stone-500">
                Boganbefalinger fra andre brugere med alder = {currentUser.alder} år og forfatter = {currentUser.ynglingsforfatter}
              </p>
            </div>
          </div>

          <div className="text-xs font-mono-data text-stone-600">
            {data?.priority1Books.length ?? 0} {data?.priority1Books.length === 1 ? 'bog fundet' : 'bøger fundet'}
          </div>
        </div>

        {data?.hasPriority1Match ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.priority1Books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onRate={onRateBook}
                highlightReason={book.matchReason}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-center">
            <HelpCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-800 mb-1">
              Ingen 1. prioritet match fundet endnu
            </p>
            <p className="text-xs text-stone-500 max-w-lg mx-auto mb-3">
              Der er endnu ingen andre brugere i <code>BrugerTabel</code> med både alder = {currentUser.alder} og yndlingsforfatter = {currentUser.ynglingsforfatter}.
            </p>
            <span className="text-xs font-medium text-amber-700 bg-amber-100/70 px-3 py-1 rounded-md inline-block">
              Systemet skifter til 2. prioritet nedenfor!
            </span>
          </div>
        )}
      </div>

      {/* SECTION: 2. PRIORITET */}
      <div className="space-y-4 pt-4 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900">
                2. Prioritet: Match på Yndlingsgenre ({currentUser.ynglingsgenre}) eller Højeste Score
              </h2>
              <p className="text-xs text-stone-500">
                Forslås baseret på din yndlingsgenre <strong>{genreMeta?.label || currentUser.ynglingsgenre}</strong> og topbedømte bøger
              </p>
            </div>
          </div>

          <div className="text-xs font-mono-data text-stone-600">
            {data?.priority2Books.length ?? 0} bøger
          </div>
        </div>

        {data && data.priority2Books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.priority2Books.map((book) => (
              <BookCard
                key={`p2-${book.id}`}
                book={book}
                onRate={onRateBook}
                highlightReason={book.matchReason}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
