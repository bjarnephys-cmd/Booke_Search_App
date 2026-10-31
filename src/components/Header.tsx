import React from 'react';
import { BookOpen, User as UserIcon, RefreshCw } from 'lucide-react';
import { User } from '../types.ts';

interface HeaderProps {
  activeTab: 'search' | 'recommendations' | 'users' | 'php-api';
  onSelectTab: (tab: 'search' | 'recommendations' | 'users' | 'php-api') => void;
  currentUser: User | null;
  onOpenUserModal: () => void;
  onResetDb: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenUserModal,
  onResetDb,
  isResetting,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <button
              onClick={() => onSelectTab('search')}
              className="font-display text-xl font-bold tracking-tight text-stone-900 hover:text-stone-700 transition-colors whitespace-nowrap text-left"
            >
              BogAnbefaling
            </button>
          </div>

          {/* Zone 2: 4 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <button
              onClick={() => onSelectTab('search')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap pb-1 border-b-2 ${
                activeTab === 'search'
                  ? 'border-stone-900 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-600'
              }`}
            >
              Bogsøgning
            </button>
            <button
              onClick={() => onSelectTab('recommendations')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap pb-1 border-b-2 ${
                activeTab === 'recommendations'
                  ? 'border-stone-900 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-600'
              }`}
            >
              Anbefalingsmotor
            </button>
            <button
              onClick={() => onSelectTab('users')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap pb-1 border-b-2 ${
                activeTab === 'users'
                  ? 'border-stone-900 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-600'
              }`}
            >
              Brugerstyring
            </button>
            <button
              onClick={() => onSelectTab('php-api')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap pb-1 border-b-2 ${
                activeTab === 'php-api'
                  ? 'border-stone-900 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-600'
              }`}
            >
              PHP/MySQL REST API
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onResetDb}
              disabled={isResetting}
              title="Gendan standard PRD datasæt (100 forfattere, 1000 bøger, 70 brugere)"
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-300 shadow-xs whitespace-nowrap shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5 text-stone-700" />
              <span>
                {currentUser ? `Bruger #${currentUser.id} (ff-${currentUser.alder})` : 'Vælg bruger'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="flex md:hidden overflow-x-auto gap-4 py-2 border-t border-stone-100 text-xs">
          <button
            onClick={() => onSelectTab('search')}
            className={`whitespace-nowrap px-2 py-1 rounded ${activeTab === 'search' ? 'font-semibold text-stone-900 bg-stone-100' : 'text-stone-600'}`}
          >
            Bogsøgning
          </button>
          <button
            onClick={() => onSelectTab('recommendations')}
            className={`whitespace-nowrap px-2 py-1 rounded ${activeTab === 'recommendations' ? 'font-semibold text-stone-900 bg-stone-100' : 'text-stone-600'}`}
          >
            Anbefalinger
          </button>
          <button
            onClick={() => onSelectTab('users')}
            className={`whitespace-nowrap px-2 py-1 rounded ${activeTab === 'users' ? 'font-semibold text-stone-900 bg-stone-100' : 'text-stone-600'}`}
          >
            Brugere
          </button>
          <button
            onClick={() => onSelectTab('php-api')}
            className={`whitespace-nowrap px-2 py-1 rounded ${activeTab === 'php-api' ? 'font-semibold text-stone-900 bg-stone-100' : 'text-stone-600'}`}
          >
            PHP/MySQL
          </button>
        </div>
      </div>
    </header>
  );
};
