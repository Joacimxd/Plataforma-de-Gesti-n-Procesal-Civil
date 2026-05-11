import { Router } from 'express';
import { db } from '../services/db.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: notif } = await db.from('notifications').select('user_id').eq('id', id).single();
    if (!notif || notif.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your notification' });
    }

    const { data, error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    const { error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
