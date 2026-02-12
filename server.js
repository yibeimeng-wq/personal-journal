require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/journal.db';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

let db;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS journals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT NOT NULL,
      language TEXT DEFAULT 'mixed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS journal_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT DEFAULT CURRENT_DATE,
      created_count INTEGER DEFAULT 0,
      updated_count INTEGER DEFAULT 0,
      deleted_count INTEGER DEFAULT 0,
      read_count INTEGER DEFAULT 0
    )
  `);
  
  saveDatabase();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper functions for sql.js
function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] };
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    if (req.method === 'GET') {
      return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Public read-only access
const allowPublicRead = (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  authenticateToken(req, res, next);
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = getOne('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const existingUser = getOne('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.lastInsertRowid, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, username });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Journal routes (public read, private write)
app.get('/api/journals', limiter, allowPublicRead, (req, res) => {
  try {
    const journals = getAll(`
      SELECT id, title, language, created_at, updated_at, length(content) as content_length 
      FROM journals 
      ORDER BY created_at DESC
    `);

    // Update read stats
    const today = new Date().toISOString().split('T')[0];
    const existingStat = getOne('SELECT * FROM journal_stats WHERE date = ?', [today]);
    if (existingStat) {
      run('UPDATE journal_stats SET read_count = read_count + 1 WHERE date = ?', [today]);
    } else {
      run('INSERT INTO journal_stats (date, read_count) VALUES (?, 1)', [today]);
    }

    res.json(journals);
  } catch (error) {
    console.error('Fetch journals error:', error);
    res.status(500).json({ error: 'Failed to fetch journals' });
  }
});

app.get('/api/journals/:id', limiter, allowPublicRead, (req, res) => {
  try {
    const journal = getOne('SELECT * FROM journals WHERE id = ?', [req.params.id]);

    if (!journal) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    res.json(journal);
  } catch (error) {
    console.error('Fetch journal error:', error);
    res.status(500).json({ error: 'Failed to fetch journal' });
  }
});

app.post('/api/journals', limiter, authenticateToken, (req, res) => {
  const { title, content, language } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    run(
      'INSERT INTO journals (title, content, language) VALUES (?, ?, ?)',
      [title || '', content, language || 'mixed']
    );

    // Get the actual last inserted ID
    const newJournal = getOne('SELECT id FROM journals ORDER BY id DESC LIMIT 1');

    // Update stats
    const today = new Date().toISOString().split('T')[0];
    const existingStat = getOne('SELECT * FROM journal_stats WHERE date = ?', [today]);
    if (existingStat) {
      run('UPDATE journal_stats SET created_count = created_count + 1 WHERE date = ?', [today]);
    } else {
      run('INSERT INTO journal_stats (date, created_count) VALUES (?, 1)', [today]);
    }

    res.json({ id: newJournal?.id, message: 'Journal created' });
  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({ error: 'Failed to create journal' });
  }
});

app.put('/api/journals/:id', limiter, authenticateToken, (req, res) => {
  const { title, content, language } = req.body;

  try {
    const journal = getOne('SELECT * FROM journals WHERE id = ?', [req.params.id]);

    if (!journal) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    run(
      'UPDATE journals SET title = ?, content = ?, language = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title || '', content, language || 'mixed', req.params.id]
    );

    // Update stats
    const today = new Date().toISOString().split('T')[0];
    const existingStat = getOne('SELECT * FROM journal_stats WHERE date = ?', [today]);
    if (existingStat) {
      run('UPDATE journal_stats SET updated_count = updated_count + 1 WHERE date = ?', [today]);
    } else {
      run('INSERT INTO journal_stats (date, updated_count) VALUES (?, 1)', [today]);
    }

    res.json({ message: 'Journal updated' });
  } catch (error) {
    console.error('Update journal error:', error);
    res.status(500).json({ error: 'Failed to update journal' });
  }
});

app.delete('/api/journals/:id', limiter, authenticateToken, (req, res) => {
  try {
    const journal = getOne('SELECT * FROM journals WHERE id = ?', [req.params.id]);

    if (!journal) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    run('DELETE FROM journals WHERE id = ?', [req.params.id]);

    // Update stats
    const today = new Date().toISOString().split('T')[0];
    const existingStat = getOne('SELECT * FROM journal_stats WHERE date = ?', [today]);
    if (existingStat) {
      run('UPDATE journal_stats SET deleted_count = deleted_count + 1 WHERE date = ?', [today]);
    } else {
      run('INSERT INTO journal_stats (date, deleted_count) VALUES (?, 1)', [today]);
    }

    res.json({ message: 'Journal deleted' });
  } catch (error) {
    console.error('Delete journal error:', error);
    res.status(500).json({ error: 'Failed to delete journal' });
  }
});

// Stats endpoint (owner only)
app.get('/api/stats', limiter, authenticateToken, (req, res) => {
  try {
    const totalResult = getOne('SELECT COUNT(*) as count FROM journals');
    const totalJournals = totalResult?.count || 0;
    
    const weeklyResult = getOne(`
      SELECT 
        COALESCE(SUM(created_count), 0) as weekly_created,
        COALESCE(SUM(updated_count), 0) as weekly_updated,
        COALESCE(SUM(deleted_count), 0) as weekly_deleted,
        COALESCE(SUM(read_count), 0) as weekly_reads
      FROM journal_stats
      WHERE date >= date('now', '-7 days')
    `);

    const recentJournals = getAll(`
      SELECT created_at as date, COUNT(*) as count
      FROM journals
      WHERE created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
    `);

    res.json({
      totalJournals,
      weekly: weeklyResult || { weekly_created: 0, weekly_updated: 0, weekly_deleted: 0, weekly_reads: 0 },
      recentByDay: recentJournals
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Serve the main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📓 Personal Journal running!`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Mobile:  http://YOUR_IP:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
