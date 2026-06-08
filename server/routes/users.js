import { Router } from 'express';
import { db } from '../services/db.js';
import { auth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const router = Router();

// ── Rate limiting for auth endpoints ──────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

// ── Validation helpers ────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim()) && email.trim().length <= 255;
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
}

function validateFullName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 200;
}

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const { data: user, error } = await db
      .from('users')
      .select('id, email, full_name, role, avatar_url, password')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token: user.id, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener entre 6 y 128 caracteres' });
    }
    if (!validateFullName(full_name)) {
      return res.status(400).json({ error: 'El nombre debe tener entre 2 y 200 caracteres' });
    }

    const validRoles = ['JUDGE', 'PLAINTIFF_LAWYER', 'DEFENSE_LAWYER'];
    const finalRole = validRoles.includes(role) ? role : 'PLAINTIFF_LAWYER';

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();

    const { error } = await db
      .from('users')
      .insert({
        id,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        full_name: full_name.trim(),
        role: finalRole,
      });

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Este email ya está registrado' });
      throw error;
    }
    res.json({ message: 'Registro exitoso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Search ────────────────────────────────────────────────────────────────────
router.get('/search', auth, async (req, res) => {
  try {
    const { q, role } = req.query;
    let query = db
      .from('users')
      .select('id, email, full_name, role, avatar_url')
      .in('role', ['PLAINTIFF_LAWYER', 'DEFENSE_LAWYER'])
      .limit(20);

    if (role) {
      query = query.eq('role', role);
    }
    if (q && String(q).trim()) {
      query = query.ilike('full_name', `%${String(q).trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
