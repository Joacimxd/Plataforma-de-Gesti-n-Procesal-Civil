import { Router } from 'express';
import { db } from '../services/db.js';
import { auth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;

    const { data: caseRow } = await db.from('cases').select('judge_id').eq('id', caseId).single();
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });

    const isJudge = caseRow.judge_id === userId;
    const { data: parts } = await db.from('case_participants').select('user_id').eq('case_id', caseId);
    const isParticipant = (parts || []).some((p) => p.user_id === userId);

    if (!isJudge && !isParticipant) {
      return res.status(403).json({ error: 'Access denied to this case' });
    }

    const { data: events, error } = await db
      .from('case_events')
      .select('*, created_by_user:users!case_events_created_by_fkey(id, full_name, avatar_url, role)')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(events || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
