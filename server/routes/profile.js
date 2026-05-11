import { Router } from 'express';
import { db } from '../services/db.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await db
      .from('users')
      .select('id, full_name, role, avatar_url, created_at, email')
      .eq('id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Profile not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/', async (req, res) => {
  try {
    const { avatar_url, full_name } = req.body;
    const updates = {};
    if (typeof avatar_url === 'string') updates.avatar_url = avatar_url.trim() || null;
    if (typeof full_name === 'string') updates.full_name = full_name.trim() || null;

    if (Object.keys(updates).length === 0) return res.json({ message: 'Nothing to update' });

    const { data, error } = await db
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, full_name, role, avatar_url, created_at, email')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
