import { Router } from 'express';
import multer from 'multer';
import { db } from '../services/db.js';
import { auth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const DOC_TYPES = ['DEMAND', 'RESPONSE', 'MOTION', 'EVIDENCE', 'ORDER', 'SENTENCE'];

async function canAccessCase(caseId, userId) {
  const { data: caseRow } = await db.from('cases').select('judge_id').eq('id', caseId).single();
  if (!caseRow) return false;
  if (caseRow.judge_id === userId) return true;
  const { data: parts } = await db.from('case_participants').select('user_id').eq('case_id', caseId);
  return (parts || []).some((r) => r.user_id === userId);
}

async function isAssignedLawyer(caseId, userId) {
  const { data } = await db.from('case_participants').select('user_id').eq('case_id', caseId);
  return (data || []).some((r) => r.user_id === userId);
}

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const caseId = req.params.id;
    const allowed = await canAccessCase(caseId, req.user.id);
    if (!allowed) return res.status(403).json({ error: 'Access denied to this case' });

    const { data, error } = await db
      .from('documents')
      .select('*, uploader:users!documents_uploaded_by_fkey(id, full_name, avatar_url, role)')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const caseId = req.params.id;
    const { title, type } = req.body || {};
    const file = req.file;

    if (!title?.trim() || !type || !DOC_TYPES.includes(type)) {
      return res.status(400).json({ error: 'title and type (DEMAND|RESPONSE|MOTION|EVIDENCE|ORDER|SENTENCE) required' });
    }
    if (!file) return res.status(400).json({ error: 'File is required' });

    const { data: caseRow } = await db.from('cases').select('status, judge_id').eq('id', caseId).single();
    if (!caseRow) return res.status(404).json({ error: 'Case not found' });
    if (caseRow.status === 'CLOSED') return res.status(403).json({ error: 'Cannot upload documents to a closed case' });

    const assigned = await isAssignedLawyer(caseId, req.user.id);
    if (!assigned) return res.status(403).json({ error: 'Only assigned lawyers can upload documents' });

    // Upload file to Supabase Storage
    const ext = (file.originalname && file.originalname.split('.').pop()) || 'bin';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `cases/${caseId}/${filename}`;

    const { error: storageError } = await db.storage
      .from('documents')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      });

    if (storageError) throw storageError;

    const { data: { publicUrl } } = db.storage.from('documents').getPublicUrl(storagePath);

    const docId = crypto.randomUUID();
    const { data: doc, error: docError } = await db
      .from('documents')
      .insert({
        id: docId,
        case_id: caseId,
        uploaded_by: req.user.id,
        title: title.trim(),
        type,
        file_url: publicUrl,
      })
      .select()
      .single();

    if (docError) throw docError;

    // Create event
    await db.from('case_events').insert({
      id: crypto.randomUUID(),
      case_id: caseId,
      event_type: 'DOCUMENT_UPLOADED',
      description: `${req.user.full_name} uploaded "${title.trim()}"`,
      created_by: req.user.id,
    });

    // Notify participants
    const { data: participants } = await db
      .from('case_participants')
      .select('user_id')
      .eq('case_id', caseId);

    const notifyUserIds = [
      ...new Set([caseRow.judge_id, ...(participants || []).map((p) => p.user_id)])
    ].filter((id) => id !== req.user.id);

    if (notifyUserIds.length > 0) {
      await db.from('notifications').insert(
        notifyUserIds.map((uid) => ({
          id: crypto.randomUUID(),
          user_id: uid,
          case_id: caseId,
          message: `New document "${title.trim()}" uploaded to case.`,
        }))
      );
    }

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
