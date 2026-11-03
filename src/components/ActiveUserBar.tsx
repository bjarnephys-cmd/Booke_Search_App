import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { UserCheck, Sparkles, BookMarked, ArrowRightLeft, Database } from 'lucide-react';
import { isUsingPhpBackend, getBackendBaseUrl } from '../services/api.ts';

interface ActiveUserBarProps {
  user: User | null;
  onOpenSwitchModal: () => void;
  onViewRecommendations: () => void;
  onNavigateToBackend: () => void;
}

export const ActiveUserBar: React.FC<ActiveUserBarProps> = ({
  user,
  onOpenSwitchModal,
  onViewRecommendations,
  onNavigateToBackend,
}) => {
  const [usingPhp, setUsingPhp] = useState(isUsingPhpBackend());

  useEffect(() => {
    const handleBackendChange = () => {
      setUsingPhp(isUsingPhpBackend());
    };
    window.addEventListener('backend-target-changed', handleBackendChange);
    return () => window.removeEventListener('backend-target-changed', handleBackendChange);
  }, []);
  if (!user) return null;

  return (
    <div className="bg-stone-900 text-stone-100 border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Active user details */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 font-medium text-stone-300">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              Aktiv Profil: <strong className="text-white">Bruger #{user.id}</strong>
            </span>
            <span className="text-stone-600 hidden sm:inline">|</span>
            <span className="text-stone-300">
              Alder (x₁): <strong className="text-stone-100 font-mono-data">{user.alder} år</strong>
            </span>
            <span className="text-stone-600 hidden sm:inline">·</span>
            <span className="text-stone-300">
              Yndlingsforfatter (x₂): <strong className="text-amber-300 font-mono-data">{user.ynglingsforfatter}</strong>
            </span>
            <span className="text-stone-600 hidden sm:inline">·</span>
            <span className="text-stone-300">
              Yndlingsgenre (x₃): <strong className="text-cyan-300 font-mono-data">{user.ynglingsgenre}</strong>
            </span>
            {user.recommendations && user.recommendations.length > 0 && (
              <>
                <span className="text-stone-600 hidden md:inline">·</span>
                <span className="text-stone-400 hidden lg:flex items-center gap-1">
                  <BookMarked className="w-3 h-3 text-stone-500" />
                  Egne anbefalinger: {user.recommendations.join(', ')}
                </span>
              </>
            )}
          </div>

          {/* Quick actions & Backend indicator */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Backend toggle indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-stone-800/90 border border-stone-700 text-[11px]">
              <Database className="w-3 h-3 text-stone-400" />
              <span className="text-stone-400">Backend:</span>
              <span className={usingPhp ? 'text-cyan-300 font-semibold' : 'text-amber-400 font-semibold'}>
                {usingPhp ? 'PHP / MySQL' : 'SQLite (Lokal)'}
              </span>
              <button
                onClick={onNavigateToBackend}
                className="ml-1 text-stone-300 hover:text-white underline"
                title="Klik for at skifte mellem SQLite og PHP backend"
              >
                Skift
              </button>
            </div>

            <button
              onClick={onViewRecommendations}
              className="flex items-center gap-1 px-2.5 py-1 text-amber-300 hover:text-amber-200 hover:bg-stone-800/80 rounded transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Se anbefalinger</span>
            </button>
            <button
              onClick={onOpenSwitchModal}
              className="flex items-center gap-1 px-2.5 py-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition-colors"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Skift bruger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
