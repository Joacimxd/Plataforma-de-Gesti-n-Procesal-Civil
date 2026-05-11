import { Router } from 'express';
import { db } from '../services/db.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import crypto from 'crypto';

const router = Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get cases where user is judge
    const { data: asJudge } = await db
      .from('cases')
      .select('id')
      .eq('judge_id', userId);

    // Get cases where user is participant
    const { data: asParticipant } = await db
      .from('case_participants')
      .select('case_id')
      .eq('user_id', userId);

    const judgeIds = (asJudge || []).map((r) => r.id);
    const participantIds = (asParticipant || []).map((r) => r.case_id);
    const uniqueIds = [...new Set([...judgeIds, ...participantIds])];

    if (uniqueIds.length === 0) {
      return res.json([]);
    }

    const { data: cases, error } = await db
      .from('cases')
      .select('*, judge:users!cases_judge_id_fkey(id, full_name)')
      .in('id', uniqueIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(cases || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: caseRow, error: caseErr } = await db
      .from('cases')
      .select('*, judge:users!cases_judge_id_fkey(id, full_name, avatar_url, role)')
      .eq('id', id)
      .single();

    if (caseErr || !caseRow) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const isJudge = caseRow.judge_id === userId;

    const { data: partRows } = await db
      .from('case_participants')
      .select('*, user:users(id, full_name, avatar_url, role)')
      .eq('case_id', id);

    const isParticipant = (partRows || []).some((p) => p.user_id === userId);

    if (!isJudge && !isParticipant) {
      return res.status(403).json({ error: 'Access denied to this case' });
    }

    res.json({ ...caseRow, participants: partRows || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireRole('JUDGE'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await db
      .from('cases')
      .insert({
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description?.trim() || null,
        judge_id: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', requireRole('JUDGE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['OPEN', 'IN_PROGRESS', 'CLOSED'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: caseRow } = await db
      .from('cases')
      .select('judge_id')
      .eq('id', id)
      .single();

    if (!caseRow || caseRow.judge_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the assigned judge can change status' });
    }

    const { data, error } = await db
      .from('cases')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
