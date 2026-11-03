import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  getBooks,
  getAllUsers,
  getUserById,
  createUser,
  getRecommendationsForUser,
  rateBook,
  getStats,
} from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize SQLite Database with 100 authors, 1000 books, 70 users
initDatabase();

app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[Express Backend] Modtog kald: ${req.method} ${req.url}`);
  }
  next();
});

// --- REST API ENDPOINTS (Milestone 2 & 4) ---

// 1. GET /api/books?search=...&genre=...&author=...&minScore=...&sortBy=...&page=...&limit=...
app.get('/api/books', (req: Request, res: Response) => {
  try {
    const {
      search,
      author,
      title,
      genre,
      minScore,
      maxScore,
      sortBy,
      sortDir,
      page,
      limit,
    } = req.query;

    const result = getBooks({
      search: search as string | undefined,
      author: author as string | undefined,
      title: title as string | undefined,
      genre: genre as string | undefined,
      minScore: minScore ? parseFloat(minScore as string) : undefined,
      maxScore: maxScore ? parseFloat(maxScore as string) : undefined,
      sortBy: sortBy as 'score' | 'title' | 'author' | undefined,
      sortDir: sortDir as 'asc' | 'desc' | undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 24,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Fejl ved hentning af bøger' });
  }
});

// 2. POST /api/users
// Body: { alder: number, ynglingsforfatter: string, ynglingsgenre: string, recommendedBooks?: string[] }
app.post('/api/users', (req: Request, res: Response) => {
  try {
    const { alder, ynglingsforfatter, ynglingsgenre, recommendedBooks } = req.body;

    if (alder === undefined || alder === null || isNaN(Number(alder))) {
      return res.status(400).json({ error: 'Feltet "alder" skal angives som et tal' });
    }
    if (!ynglingsforfatter || typeof ynglingsforfatter !== 'string') {
      return res.status(400).json({ error: 'Feltet "ynglingsforfatter" skal angives (f.eks. ff-12)' });
    }
    if (!ynglingsgenre || typeof ynglingsgenre !== 'string') {
      return res.status(400).json({ error: 'Feltet "ynglingsgenre" skal angives (f.eks. genre-2)' });
    }

    const newUser = createUser({
      alder: Number(alder),
      ynglingsforfatter: ynglingsforfatter.trim(),
      ynglingsgenre: ynglingsgenre.trim(),
      recommendedBooks,
    });

    res.status(201).json({
      success: true,
      message: 'Bruger oprettet med succes',
      user: newUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Fejl ved oprettelse af bruger' });
  }
});

// 3. GET /api/recommendations?userId=...
// Implements Milestone 4 priority logic
app.get('/api/recommendations', (req: Request, res: Response) => {
  try {
    const userIdParam = req.query.userId;
    if (!userIdParam) {
      return res.status(400).json({ error: 'Query parameter "userId" mangler (f.eks. /api/recommendations?userId=1)' });
    }

    const userId = parseInt(userIdParam as string, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Ugyldigt userId' });
    }

    const recs = getRecommendationsForUser(userId);
    res.json(recs);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Fejl ved hentning af anbefalinger' });
  }
});

// 4. GET /api/users - List users (BrugerTabel) with optional author filter
app.get('/api/users', (req: Request, res: Response) => {
  try {
    const author = req.query.author as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const users = getAllUsers(limit, author);
    res.json({ users, total: users.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Fejl ved hentning af brugere' });
  }
});

// 5. GET /api/users/:id - Get specific user
app.get('/api/users/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = getUserById(id);
    if (!user) {
      return res.status(404).json({ error: `Bruger med ID ${id} findes ikke` });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/books/:id/rate - User rating 0 to 9
app.post('/api/books/:id/rate', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const score = parseFloat(req.body.score);

    if (isNaN(score) || score < 0 || score > 9) {
      return res.status(400).json({ error: 'Score skal være et tal mellem 0 og 9' });
    }

    const updatedBook = rateBook(id, score);
    res.json({
      success: true,
      book: updatedBook,
      message: `Score for ${updatedBook.titel} opdateret til ${updatedBook.score} (${updatedBook.rating_count} bedømmelser)`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Fejl ved bedømmelse af bog' });
  }
});

// 7. GET /api/stats
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/reset - Reset and reseed SQLite DB
app.post('/api/reset', (_req: Request, res: Response) => {
  try {
    initDatabase(true);
    res.json({ success: true, message: 'Databasen er genstartet med de oprindelige 100 forfattere, 1000 bøger og 70 brugere.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/ping - Diagnostics, server region and RTT endpoint
app.get('/api/ping', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    region: 'europe-west2',
    regionName: 'London, Storbritannien (Google Cloud Run)',
    platform: 'Node.js Express + SQLite (Port 3000)',
    message: 'Pong fra lokal applet backend',
  });
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BogAnbefaling app kører på http://localhost:${PORT}`);
  });
}

startServer();
