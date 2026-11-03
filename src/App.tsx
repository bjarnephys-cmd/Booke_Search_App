/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Book, StatsResponse } from './types.ts';
import { fetchUsers, createUser, rateBook, resetDatabase, fetchStats } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { ActiveUserBar } from './components/ActiveUserBar.tsx';
import { BookSearchSection } from './components/BookSearchSection.tsx';
import { RecommendationsSection } from './components/RecommendationsSection.tsx';
import { UserManagementSection } from './components/UserManagementSection.tsx';
import { PhpBackendSection } from './components/PhpBackendSection.tsx';
import { RateBookModal } from './components/RateBookModal.tsx';
import { UserModal } from './components/UserModal.tsx';
import { LiveLogDrawer } from './components/LiveLogDrawer.tsx';
import { BookOpen, Layers, Users, Star } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'recommendations' | 'users' | 'php-api'>('search');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  // Modals state
  const [bookToRate, setBookToRate] = useState<Book | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadInitialData = async () => {
    try {
      const [usersResult, statsResult] = await Promise.allSettled([
        fetchUsers(undefined, 100),
        fetchStats(),
      ]);

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value.users);
        if (!currentUser && usersResult.value.users.length > 0) {
          const defaultUser = usersResult.value.users.find((u) => u.id === 12) || usersResult.value.users[0];
          setCurrentUser(defaultUser);
        }
      } else {
        console.warn('Fejl ved hentning af brugere:', usersResult.reason);
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      }
    } catch (err) {
      console.error('Fejl ved indlæsning af startdata:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCreateUser = async (data: {
    alder: number;
    ynglingsforfatter: string;
    ynglingsgenre: string;
    recommendedBooks?: string[];
  }) => {
    const res = await createUser(data);
    await loadInitialData();
    setCurrentUser(res.user);
    showToast(`Ny bruger #${res.user.id} oprettet og sat som aktiv profil!`);
  };

  const handleRateBook = async (bookId: number, score: number) => {
    const res = await rateBook(bookId, score);
    const updatedStats = await fetchStats();
    setStats(updatedStats);
    showToast(res.message);
  };

  const handleResetDb = async () => {
    if (!window.confirm('Er du sikker på, at du vil genoprette standard PRD-datasæt (1000 bøger og 70 brugere)?')) {
      return;
    }
    setIsResetting(true);
    try {
      await resetDatabase();
      await loadInitialData();
      showToast('Databasen er genoprettet med standard PRD-data!');
    } catch (err: any) {
      alert(err.message || 'Kunne ikke nulstille database');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col selection:bg-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-lg border border-stone-800 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onResetDb={handleResetDb}
        isResetting={isResetting}
      />

      {/* Active User Context Banner */}
      <ActiveUserBar
        user={currentUser}
        onOpenSwitchModal={() => setIsUserModalOpen(true)}
        onViewRecommendations={() => setActiveTab('recommendations')}
        onNavigateToBackend={() => setActiveTab('php-api')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' && (
          <BookSearchSection
            onRateBook={(book) => setBookToRate(book)}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsSection
            currentUser={currentUser}
            onRateBook={(book) => setBookToRate(book)}
            onRefreshUsers={loadInitialData}
            onOpenSwitchUser={() => setIsUserModalOpen(true)}
          />
        )}

        {activeTab === 'users' && (
          <UserManagementSection
            users={users}
            currentUser={currentUser}
            onSelectUser={(u) => {
              setCurrentUser(u);
              showToast(`Aktiv bruger skiftet til Bruger #${u.id}`);
            }}
            onCreateUser={handleCreateUser}
            onRefreshUsers={loadInitialData}
          />
        )}

        {activeTab === 'php-api' && <PhpBackendSection />}
      </main>

      {/* Modals */}
      <RateBookModal
        book={bookToRate}
        onClose={() => setBookToRate(null)}
        onSubmitRate={handleRateBook}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
        users={users}
        onSelectUser={(u) => {
          setCurrentUser(u);
          showToast(`Aktiv bruger skiftet til Bruger #${u.id}`);
        }}
        onCreateUser={handleCreateUser}
      />

      {/* Real-time In-App Console & Network Log Drawer */}
      <LiveLogDrawer />

      {/* Footer with quantitative metrics and PRD reference */}
      <footer className="mt-auto border-t border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6 text-xs text-stone-500 font-mono-data">
              <span className="flex items-center gap-1.5 text-stone-700">
                <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                Bøger i SQLite: <strong>{stats?.totalBooks ?? 1000}</strong>
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="flex items-center gap-1.5 text-stone-700">
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                Forfattere: <strong>{stats?.totalAuthors ?? 100}</strong>
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="flex items-center gap-1.5 text-stone-700">
                <Users className="w-3.5 h-3.5 text-stone-500" />
                Registrerede brugere: <strong>{stats?.totalUsers ?? 70}</strong>
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="flex items-center gap-1.5 text-stone-700">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Gns. score: <strong>{stats?.averageScore ?? '4.50'} / 9.0</strong>
              </span>
            </div>

            <div className="text-xs text-stone-400">
              PRD-2 Boganbefalinger · Milestone 1, 2, 3 & 4
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
