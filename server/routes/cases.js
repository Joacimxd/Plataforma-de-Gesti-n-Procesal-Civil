import { Router } from 'express';
import { db } from '../services/db.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import crypto from 'crypto';

const router = Router();

router.use(auth);

// ── Validation ────────────────────────────────────────────────────────────────
const MAX_TITLE_LEN = 300;
const MAX_DESC_LEN = 2000;

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
      .select('*')
      .in('id', uniqueIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Manually join judge info
    const judgeIds2 = [...new Set((cases || []).map((c) => c.judge_id))];
    const { data: judges } = await db
      .from('users')
      .select('id, full_name')
      .in('id', judgeIds2);

    const judgeMap = {};
    (judges || []).forEach((j) => { judgeMap[j.id] = j; });

    const enriched = (cases || []).map((c) => ({
      ...c,
      judge: judgeMap[c.judge_id] || null,
    }));

    res.json(enriched);
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
      .select('*')
      .eq('id', id)
      .single();

    if (caseErr || !caseRow) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Get judge info
    const { data: judge } = await db
      .from('users')
      .select('id, full_name, avatar_url, role')
      .eq('id', caseRow.judge_id)
      .single();

    caseRow.judge = judge || null;

    const isJudge = caseRow.judge_id === userId;

    const { data: partRows } = await db
      .from('case_participants')
      .select('*')
      .eq('case_id', id);

    // Enrich participants with user info
    const userIds = (partRows || []).map((p) => p.user_id);
    let userMap = {};
    if (userIds.length > 0) {
      const { data: users } = await db
        .from('users')
        .select('id, full_name, avatar_url, role')
        .in('id', userIds);
      (users || []).forEach((u) => { userMap[u.id] = u; });
    }

    const enrichedParts = (partRows || []).map((p) => ({
      ...p,
      user: userMap[p.user_id] || null,
    }));

    const isParticipant = (partRows || []).some((p) => p.user_id === userId);

    if (!isJudge && !isParticipant) {
      return res.status(403).json({ error: 'Access denied to this case' });
    }

    res.json({ ...caseRow, participants: enrichedParts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireRole('JUDGE'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }
    if (title.trim().length > MAX_TITLE_LEN) {
      return res.status(400).json({ error: `El título no puede exceder ${MAX_TITLE_LEN} caracteres` });
    }
    if (description && description.trim().length > MAX_DESC_LEN) {
      return res.status(400).json({ error: `La descripción no puede exceder ${MAX_DESC_LEN} caracteres` });
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

// ── Delete Case ───────────────────────────────────────────────────────────────
router.delete('/:id', requireRole('JUDGE'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: caseRow } = await db
      .from('cases')
      .select('judge_id')
      .eq('id', id)
      .single();

    if (!caseRow) {
      return res.status(404).json({ error: 'Case not found' });
    }
    if (caseRow.judge_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the assigned judge can delete this case' });
    }

    // Delete related records (cascades handle participants, documents, events)
    // but notifications reference case_id with ON DELETE SET NULL so they stay
    await db.from('cases').delete().eq('id', id);

    res.json({ message: 'Caso eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
