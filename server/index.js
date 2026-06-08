import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import casesRouter from './routes/cases.js';
import participantsRouter from './routes/participants.js';
import documentsRouter from './routes/documents.js';
import eventsRouter from './routes/events.js';
import notificationsRouter from './routes/notifications.js';
import usersRouter from './routes/users.js';
import profileRouter from './routes/profile.js';
import { auth } from './middleware/auth.js';
import { db } from './services/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Serve uploaded documents as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/users', usersRouter);
app.use('/api/profile', profileRouter);
app.use('/api/cases', casesRouter);
app.use('/api/cases/:id/participants', participantsRouter);
app.use('/api/cases/:id/documents', documentsRouter);
app.use('/api/cases/:id/events', eventsRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/api/documents/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: doc } = await db.from('documents').select('*').eq('id', id).single();
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const { data: caseRow } = await db.from('cases').select('judge_id').eq('id', doc.case_id).single();
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });

    const userId = req.user.id;
    if (caseRow.judge_id !== userId) {
      const { data: parts } = await db.from('case_participants').select('user_id').eq('case_id', doc.case_id);
      if (!(parts || []).some((p) => p.user_id === userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('💥 Unhandled error:', err.stack || err.message);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
