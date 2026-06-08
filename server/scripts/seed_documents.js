import 'dotenv/config';
import { db } from '../services/db.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');

async function seedDocuments() {
  console.log('Seeding documents for Judge Elena Martinez...');
  const { data: judge } = await db.from('users').select('id').eq('email', 'judge@example.com').single();
  if (!judge) {
    console.error('Judge not found!');
    return;
  }
  
  const { data: cases } = await db.from('cases').select('id, title').eq('judge_id', judge.id);
  if (!cases || cases.length === 0) {
    console.error('No cases found for the judge.');
    return;
  }

  // Create a minimal dummy PDF
  const dummyPdf = Buffer.from(
    '%PDF-1.0\\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\\nxref\\n0 4\\n0000000000 65535 f\\n0000000010 00000 n\\n0000000053 00000 n\\n0000000102 00000 n\\ntrailer<</Size 4/Root 1 0 R>>\\nstartxref\\n149\\n%EOF\\n'
  );

  let docCount = 0;

  for (const c of cases) {
    const numDocs = 2;
    for (let i = 0; i < numDocs; i++) {
      const docId = crypto.randomUUID();
      const filename = `${crypto.randomUUID()}.pdf`;
      const caseDir = path.join(UPLOADS_DIR, 'cases', c.id);
      fs.mkdirSync(caseDir, { recursive: true });
      fs.writeFileSync(path.join(caseDir, filename), dummyPdf);

      const fileUrl = `/uploads/cases/${c.id}/${filename}`;
      const types = ['DEMAND', 'EVIDENCE', 'MOTION', 'RESPONSE'];
      const docType = types[Math.floor(Math.random() * types.length)];

      await db.from('documents').insert({
        id: docId,
        case_id: c.id,
        uploaded_by: judge.id,
        title: i === 0 ? 'Demanda Inicial' : 'Acuerdo Radicación',
        type: i === 0 ? 'DEMAND' : 'ORDER',
        file_url: fileUrl,
      });

      // Add event
      await db.from('case_events').insert({
        id: crypto.randomUUID(),
        case_id: c.id,
        event_type: 'DOCUMENT_UPLOADED',
        description: `Se subió el documento "${i === 0 ? 'Demanda Inicial' : 'Acuerdo Radicación'}"`,
        created_by: judge.id,
      });
      
      docCount++;
    }
  }

  console.log(`✅ ${docCount} documents seeded for ${cases.length} cases.`);
}

seedDocuments().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
