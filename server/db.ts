import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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

export interface Recommendation {
  id: number;
  bruger_id: number;
  bog_titel: string;
  bog_id: number;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'books.db');
export const db = new Database(DB_PATH);

// Pragmas for performance
db.pragma('journal_mode = WAL');

export function initDatabase(forceReset = false) {
  if (forceReset) {
    db.exec(`
      DROP TABLE IF EXISTS AnbefalingTabel;
      DROP TABLE IF EXISTS BrugerTabel;
      DROP TABLE IF EXISTS BogTabel;
    `);
  }

  // Milestone 1 & 2 Table: BogTabel
  // 100 authors: ff-i (i=0..99)
  // 10 books per author: tit-ff-i-j (j=0..9)
  // 5 genres: genre-(j%5)
  // score: float(j)
  db.exec(`
    CREATE TABLE IF NOT EXISTS BogTabel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titel TEXT NOT NULL UNIQUE,
      forfatter TEXT NOT NULL,
      genre TEXT NOT NULL,
      score REAL NOT NULL,
      rating_count INTEGER NOT NULL DEFAULT 1,
      total_score REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bog_forfatter ON BogTabel(forfatter);
    CREATE INDEX IF NOT EXISTS idx_bog_genre ON BogTabel(genre);
    CREATE INDEX IF NOT EXISTS idx_bog_titel ON BogTabel(titel);
    CREATE INDEX IF NOT EXISTS idx_bog_score ON BogTabel(score);
  `);

  // Milestone 3 Table: BrugerTabel
  // 70 users with x1=alder, x2=ynglingsforfatter, x3=ynglingsgenre
  db.exec(`
    CREATE TABLE IF NOT EXISTS BrugerTabel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alder INTEGER NOT NULL,
      ynglingsforfatter TEXT NOT NULL,
      ynglingsgenre TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_bruger_alder ON BrugerTabel(alder);
    CREATE INDEX IF NOT EXISTS idx_bruger_forfatter ON BrugerTabel(ynglingsforfatter);
    CREATE INDEX IF NOT EXISTS idx_bruger_genre ON BrugerTabel(ynglingsgenre);
  `);

  // Recommendations: User i has recommended 2 book titles with author ff-i, both with genre x3
  db.exec(`
    CREATE TABLE IF NOT EXISTS AnbefalingTabel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bruger_id INTEGER NOT NULL,
      bog_titel TEXT NOT NULL,
      bog_id INTEGER NOT NULL,
      FOREIGN KEY (bruger_id) REFERENCES BrugerTabel(id) ON DELETE CASCADE,
      FOREIGN KEY (bog_id) REFERENCES BogTabel(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_anbefaling_bruger ON AnbefalingTabel(bruger_id);
    CREATE INDEX IF NOT EXISTS idx_anbefaling_bog ON AnbefalingTabel(bog_id);
  `);

  // Check if books already seeded
  const bookCount = db.prepare('SELECT COUNT(*) as count FROM BogTabel').get() as { count: number };
  if (bookCount.count === 0) {
    seedBooks();
  }

  // Check if users already seeded (70 users)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM BrugerTabel').get() as { count: number };
  if (userCount.count === 0) {
    seedUsers();
  }
}

function seedBooks() {
  const insert = db.prepare(`
    INSERT INTO BogTabel (titel, forfatter, genre, score, rating_count, total_score)
    VALUES (?, ?, ?, ?, 1, ?)
  `);

  const insertMany = db.transaction(() => {
    // 100 authors: ff-0 .. ff-99
    for (let i = 0; i < 100; i++) {
      const author = `ff-${i}`;
      // 10 book titles per author: tit-ff-i-j (j=0..9)
      for (let j = 0; j < 10; j++) {
        const title = `tit-ff-${i}-${j}`;
        const genre = `genre-${j % 5}`;
        const score = Number(j.toFixed(1)); // float(j)
        insert.run(title, author, genre, score, score);
      }
    }
  });

  insertMany();
}

function seedUsers() {
  const insertUser = db.prepare(`
    INSERT INTO BrugerTabel (id, alder, ynglingsforfatter, ynglingsgenre, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  const insertRecommendation = db.prepare(`
    INSERT INTO AnbefalingTabel (bruger_id, bog_titel, bog_id)
    VALUES (?, ?, ?)
  `);

  const findBook = db.prepare('SELECT id, titel FROM BogTabel WHERE titel = ?');

  const insertAllUsers = db.transaction(() => {
    // 70 users: i = 0..69
    for (let i = 0; i < 70; i++) {
      const alder = i; // x1 = i
      const ynglingsforfatter = `ff-${i}`; // x2 = ff-i
      const genreIndex = i % 5;
      const ynglingsgenre = `genre-${genreIndex}`; // x3

      // Bruger i har anbefalet 2 bogtitler, alle udvalgt blandt bøgerne med forfatter ff-i,
      // begge med samme genre (hans ynglingsgenre: genre-(i%5))
      // Since books for author ff-i are tit-ff-i-0 .. tit-ff-i-9,
      // and book j has genre-(j%5), the two books with genre-(i%5) are:
      // j1 = genreIndex (e.g. 0) and j2 = genreIndex + 5 (e.g. 5)
      const book1Title = `tit-ff-${i}-${genreIndex}`;
      const book2Title = `tit-ff-${i}-${genreIndex + 5}`;

      const res = insertUser.run(i + 1, alder, ynglingsforfatter, ynglingsgenre);
      const userId = Number(res.lastInsertRowid);

      const b1 = findBook.get(book1Title) as { id: number; titel: string } | undefined;
      const b2 = findBook.get(book2Title) as { id: number; titel: string } | undefined;

      if (b1) {
        insertRecommendation.run(userId, b1.titel, b1.id);
      }
      if (b2) {
        insertRecommendation.run(userId, b2.titel, b2.id);
      }
    }
  });

  insertAllUsers();
}

// Queries
export function getBooks(params: {
  search?: string;
  author?: string;
  title?: string;
  genre?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: 'score' | 'title' | 'author';
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}) {
  const {
    search,
    author,
    title,
    genre,
    minScore,
    maxScore,
    sortBy = 'score',
    sortDir = 'desc',
    page = 1,
    limit = 24,
  } = params;

  const conditions: string[] = [];
  const args: any[] = [];

  if (search && search.trim() !== '') {
    const s = `%${search.trim()}%`;
    conditions.push('(titel LIKE ? OR forfatter LIKE ? OR genre LIKE ?)');
    args.push(s, s, s);
  }

  if (author && author.trim() !== '') {
    conditions.push('forfatter = ?');
    args.push(author.trim());
  }

  if (title && title.trim() !== '') {
    conditions.push('titel LIKE ?');
    args.push(`%${title.trim()}%`);
  }

  if (genre && genre.trim() !== '' && genre !== 'all') {
    conditions.push('genre = ?');
    args.push(genre.trim());
  }

  if (minScore !== undefined && !isNaN(minScore)) {
    conditions.push('score >= ?');
    args.push(minScore);
  }

  if (maxScore !== undefined && !isNaN(maxScore)) {
    conditions.push('score <= ?');
    args.push(maxScore);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderColumn = 'score';
  if (sortBy === 'title') orderColumn = 'titel';
  if (sortBy === 'author') orderColumn = 'forfatter';

  const orderDirection = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const countQuery = `SELECT COUNT(*) as count FROM BogTabel ${whereClause}`;
  const totalCount = (db.prepare(countQuery).get(...args) as { count: number }).count;

  const offset = (Math.max(1, page) - 1) * limit;
  const selectQuery = `
    SELECT * FROM BogTabel
    ${whereClause}
    ORDER BY ${orderColumn} ${orderDirection}, id ASC
    LIMIT ? OFFSET ?
  `;

  const books = db.prepare(selectQuery).all(...args, limit, offset) as Book[];

  return {
    books,
    total: totalCount,
    page: Math.max(1, page),
    limit,
    totalPages: Math.ceil(totalCount / limit) || 1,
  };
}

export function getUserById(id: number): User | null {
  const user = db.prepare('SELECT * FROM BrugerTabel WHERE id = ?').get(id) as User | undefined;
  if (!user) return null;

  const recs = db.prepare('SELECT bog_titel FROM AnbefalingTabel WHERE bruger_id = ?').all(id) as { bog_titel: string }[];
  user.recommendations = recs.map(r => r.bog_titel);
  return user;
}

export function getAllUsers(limit = 100, author?: string): User[] {
  let query = 'SELECT * FROM BrugerTabel';
  const args: any[] = [];
  if (author && author.trim() !== '') {
    query += ' WHERE ynglingsforfatter = ?';
    args.push(author.trim());
  }
  query += ' ORDER BY id ASC LIMIT ?';
  args.push(limit);

  const users = db.prepare(query).all(...args) as User[];
  const getRecs = db.prepare('SELECT bog_titel FROM AnbefalingTabel WHERE bruger_id = ?');

  return users.map(u => {
    const recs = getRecs.all(u.id) as { bog_titel: string }[];
    return {
      ...u,
      recommendations: recs.map(r => r.bog_titel),
    };
  });
}

export function createUser(data: {
  alder: number;
  ynglingsforfatter: string;
  ynglingsgenre: string;
  recommendedBooks?: string[];
}): User {
  const insertUser = db.prepare(`
    INSERT INTO BrugerTabel (alder, ynglingsforfatter, ynglingsgenre, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);

  const result = insertUser.run(data.alder, data.ynglingsforfatter, data.ynglingsgenre);
  const userId = Number(result.lastInsertRowid);

  // If recommendations not explicitly provided, pick the 2 books by this author matching the genre,
  // or top 2 books by this author
  let booksToRecommend = data.recommendedBooks || [];
  if (booksToRecommend.length === 0) {
    const matching = db.prepare(`
      SELECT titel FROM BogTabel
      WHERE forfatter = ? AND genre = ?
      LIMIT 2
    `).all(data.ynglingsforfatter, data.ynglingsgenre) as { titel: string }[];

    if (matching.length > 0) {
      booksToRecommend = matching.map(m => m.titel);
    } else {
      const fallback = db.prepare(`
        SELECT titel FROM BogTabel
        WHERE forfatter = ?
        LIMIT 2
      `).all(data.ynglingsforfatter) as { titel: string }[];
      booksToRecommend = fallback.map(m => m.titel);
    }
  }

  const insertRec = db.prepare(`
    INSERT INTO AnbefalingTabel (bruger_id, bog_titel, bog_id)
    VALUES (?, ?, ?)
  `);
  const findBook = db.prepare('SELECT id FROM BogTabel WHERE titel = ?');

  for (const title of booksToRecommend) {
    const book = findBook.get(title) as { id: number } | undefined;
    if (book) {
      insertRec.run(userId, title, book.id);
    }
  }

  return getUserById(userId)!;
}

// Milestone 4 Recommendation Algorithm:
// "når bruger søger skal der forslås boganbefalinger fra andre brugere med samme forfatter og alder.
//  Første prioritet: Match på alder + ynglingsforfatter.
//  Anden prioritet (hvis ingen match): Match på ynglingsgenre eller højeste score."
export function getRecommendationsForUser(userId: number) {
  const user = getUserById(userId);
  if (!user) {
    throw new Error(`Bruger med ID ${userId} blev ikke fundet.`);
  }

  // 1. First priority: Other users with same alder AND same ynglingsforfatter
  const priority1Users = db.prepare(`
    SELECT * FROM BrugerTabel
    WHERE id != ? AND alder = ? AND ynglingsforfatter = ?
  `).all(userId, user.alder, user.ynglingsforfatter) as User[];

  let priority1Books: (Book & { recommendedByUserId: number; matchReason: string })[] = [];

  if (priority1Users.length > 0) {
    const userIds = priority1Users.map(u => u.id);
    const placeholders = userIds.map(() => '?').join(',');
    const recRows = db.prepare(`
      SELECT b.*, a.bruger_id as recommendedByUserId
      FROM AnbefalingTabel a
      JOIN BogTabel b ON a.bog_id = b.id
      WHERE a.bruger_id IN (${placeholders})
    `).all(...userIds) as any[];

    // deduplicate books
    const seen = new Set<number>();
    for (const row of recRows) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        priority1Books.push({
          ...row,
          matchReason: `1. Prioritet: Matchet fra Bruger #${row.recommendedByUserId} (Samme alder: ${user.alder} år, samme forfatter: ${user.ynglingsforfatter})`,
        });
      }
    }
  }

  // 2. Second priority (if no match or to complement):
  // Match on favorite genre (ynglingsgenre) or highest score
  const priority2Books: (Book & { matchReason: string })[] = [];

  // Books from user's favorite genre with highest score (excluding already matched books)
  const excludeIds = priority1Books.map(b => b.id);
  const excludeClause = excludeIds.length > 0 ? `AND id NOT IN (${excludeIds.join(',')})` : '';

  const genreBooks = db.prepare(`
    SELECT * FROM BogTabel
    WHERE genre = ? ${excludeClause}
    ORDER BY score DESC, id ASC
    LIMIT 6
  `).all(user.ynglingsgenre) as Book[];

  for (const b of genreBooks) {
    priority2Books.push({
      ...b,
      matchReason: `2. Prioritet: Match på din yndlingsgenre '${user.ynglingsgenre}' (Højeste score: ${b.score.toFixed(1)})`,
    });
  }

  // Also overall highest score books as fallback/top discovery
  const topScoredBooks = db.prepare(`
    SELECT * FROM BogTabel
    WHERE id NOT IN (${[...excludeIds, ...genreBooks.map(b => b.id), 0].join(',')})
    ORDER BY score DESC, id ASC
    LIMIT 4
  `).all() as Book[];

  for (const b of topScoredBooks) {
    priority2Books.push({
      ...b,
      matchReason: `2. Prioritet: Generel topscorer i databasen (Score: ${b.score.toFixed(1)})`,
    });
  }

  return {
    user,
    priority1Count: priority1Books.length,
    priority1UsersCount: priority1Users.length,
    priority1Books,
    priority2Books,
    hasPriority1Match: priority1Books.length > 0,
  };
}

export function rateBook(bookId: number, newScore: number) {
  const book = db.prepare('SELECT * FROM BogTabel WHERE id = ?').get(bookId) as Book | undefined;
  if (!book) {
    throw new Error('Bogen findes ikke.');
  }

  const validScore = Math.max(0, Math.min(9, newScore));
  const newRatingCount = book.rating_count + 1;
  const newTotalScore = book.total_score + validScore;
  const calculatedAverage = Number((newTotalScore / newRatingCount).toFixed(2));

  db.prepare(`
    UPDATE BogTabel
    SET score = ?, rating_count = ?, total_score = ?
    WHERE id = ?
  `).run(calculatedAverage, newRatingCount, newTotalScore, bookId);

  return db.prepare('SELECT * FROM BogTabel WHERE id = ?').get(bookId) as Book;
}

export function getStats() {
  const books = db.prepare('SELECT COUNT(*) as count FROM BogTabel').get() as { count: number };
  const users = db.prepare('SELECT COUNT(*) as count FROM BrugerTabel').get() as { count: number };
  const authors = db.prepare('SELECT COUNT(DISTINCT forfatter) as count FROM BogTabel').get() as { count: number };
  const genres = db.prepare('SELECT COUNT(DISTINCT genre) as count FROM BogTabel').get() as { count: number };
  const avgScore = db.prepare('SELECT AVG(score) as avg FROM BogTabel').get() as { avg: number };

  return {
    totalBooks: books.count,
    totalUsers: users.count,
    totalAuthors: authors.count,
    totalGenres: genres.count,
    averageScore: Number((avgScore.avg || 0).toFixed(2)),
  };
}
