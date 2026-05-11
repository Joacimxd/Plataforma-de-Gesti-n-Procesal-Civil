import { Router } from 'express';
import { db } from '../services/db.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import crypto from 'crypto';

const router = Router({ mergeParams: true });

router.use(auth);
router.use(requireRole('JUDGE'));

router.post('/', async (req, res) => {
  try {
    const caseId = req.params.id;
    const { user_id, side } = req.body;

    if (!user_id || !side || !['PLAINTIFF', 'DEFENSE'].includes(side)) {
      return res.status(400).json({ error: 'user_id and side (PLAINTIFF or DEFENSE) required' });
    }

    const { data: caseRow } = await db
      .from('cases')
      .select('judge_id')
      .eq('id', caseId)
      .single();

    if (!caseRow || caseRow.judge_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the case judge can assign participants' });
    }

    const { data: lawyer } = await db
      .from('users')
      .select('id, role')
      .eq('id', user_id)
      .single();

    if (!lawyer) return res.status(404).json({ error: 'Profile not found' });

    const allowedRoles = side === 'PLAINTIFF' ? ['PLAINTIFF_LAWYER'] : ['DEFENSE_LAWYER'];
    if (!allowedRoles.includes(lawyer.role)) {
      return res.status(400).json({ error: `User must have role ${allowedRoles[0]} for side ${side}` });
    }

    const { data, error } = await db
      .from('case_participants')
      .insert({ id: crypto.randomUUID(), case_id: caseId, user_id, side })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'A lawyer is already assigned to this side' });
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
