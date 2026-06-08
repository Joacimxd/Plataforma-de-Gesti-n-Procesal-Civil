import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../services/db.js';
import { auth } from '../middleware/auth.js';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');

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

    const { data: docs, error } = await db
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with uploader info
    const uploaderIds = [...new Set((docs || []).map((d) => d.uploaded_by))];
    let uploaderMap = {};
    if (uploaderIds.length > 0) {
      const { data: users } = await db
        .from('users')
        .select('id, full_name, avatar_url, role')
        .in('id', uploaderIds);
      (users || []).forEach((u) => { uploaderMap[u.id] = u; });
    }

    const enriched = (docs || []).map((d) => ({
      ...d,
      uploader: uploaderMap[d.uploaded_by] || null,
    }));

    res.json(enriched);
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

    const isJudge = caseRow.judge_id === req.user.id;
    const assigned = await isAssignedLawyer(caseId, req.user.id);
    if (!isJudge && !assigned) return res.status(403).json({ error: 'Only the judge or assigned lawyers can upload documents' });

    // Save file to local filesystem
    const ext = (file.originalname && file.originalname.split('.').pop()) || 'bin';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const caseDir = path.join(UPLOADS_DIR, 'cases', caseId);
    fs.mkdirSync(caseDir, { recursive: true });
    fs.writeFileSync(path.join(caseDir, filename), file.buffer);

    const fileUrl = `/uploads/cases/${caseId}/${filename}`;

    const docId = crypto.randomUUID();
    const { data: doc, error: docError } = await db
      .from('documents')
      .insert({
        id: docId,
        case_id: caseId,
        uploaded_by: req.user.id,
        title: title.trim(),
        type,
        file_url: fileUrl,
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
router.delete('/:docId', async (req, res) => {
  try {
    const { id: caseId, docId } = req.params;

    const { data: doc } = await db.from('documents').select('*').eq('id', docId).eq('case_id', caseId).single();
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const { data: caseRow } = await db.from('cases').select('judge_id, status').eq('id', caseId).single();
    if (caseRow?.status === 'CLOSED') return res.status(403).json({ error: 'Cannot delete documents from a closed case' });

    const isJudge = caseRow?.judge_id === req.user.id;
    const isUploader = doc.uploaded_by === req.user.id;

    if (!isJudge && !isUploader) {
      return res.status(403).json({ error: 'Only the judge or the uploader can delete this document' });
    }

    if (doc.file_url.startsWith('/uploads/cases/')) {
      const filePath = path.join(__dirname, '..', doc.file_url.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.from('documents').delete().eq('id', docId);

    // Event
    await db.from('case_events').insert({
      id: crypto.randomUUID(),
      case_id: caseId,
      event_type: 'DOCUMENT_UPLOADED',
      description: `${req.user.full_name} eliminó el documento "${doc.title}"`,
      created_by: req.user.id,
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
