import { Router } from 'express';
import { db } from '../services/db.js';
import { auth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user, error } = await db
      .from('users')
      .select('id, email, full_name, role, avatar_url, password')
      .eq('email', email)
      .single();

    if (error || !user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token: user.id, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'email, password, and full_name are required' });
    }
    const id = crypto.randomUUID();
    const { error } = await db
      .from('users')
      .insert({ id, email, password, full_name, role: role || 'PLAINTIFF_LAWYER' });

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email already registered' });
      throw error;
    }
    res.json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
