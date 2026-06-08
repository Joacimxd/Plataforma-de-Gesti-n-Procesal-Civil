import 'dotenv/config';
import { db } from '../services/db.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads', 'cases');

async function syncDocuments() {
  console.log('🔄 Sincronizando documentos desde el sistema de archivos a la base de datos...');

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('El directorio de uploads no existe.');
    return;
  }

  const casesDirs = fs.readdirSync(UPLOADS_DIR);
  let addedCount = 0;

  for (const caseId of casesDirs) {
    const casePath = path.join(UPLOADS_DIR, caseId);
    if (!fs.statSync(casePath).isDirectory()) continue;

    // Check if the case exists in DB
    const { data: caseRow } = await db.from('cases').select('id, judge_id').eq('id', caseId).single();
    if (!caseRow) {
      console.log(`⚠️ Caso ${caseId} no existe en la BD, saltando...`);
      continue;
    }

    const files = fs.readdirSync(casePath);
    if (files.length === 0) continue;

    // Get existing documents for this case
    const { data: existingDocs } = await db.from('documents').select('file_url').eq('case_id', caseId);
    const existingUrls = new Set((existingDocs || []).map(d => d.file_url));

    for (const file of files) {
      const fileUrl = `/uploads/cases/${caseId}/${file}`;
      if (!existingUrls.has(fileUrl)) {
        // This is a new file that needs to be added to the database
        const docId = crypto.randomUUID();
        
        // Try to create a nice title from filename
        let title = file.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        if (title.length < 3 || title.match(/^[0-9a-f-]+$/i)) {
          title = "Documento Agregado Manualmente";
        }

        await db.from('documents').insert({
          id: docId,
          case_id: caseId,
          uploaded_by: caseRow.judge_id, // Default to judge
          title: title,
          type: 'EVIDENCE', // Default type
          file_url: fileUrl,
        });

        // Add event
        await db.from('case_events').insert({
          id: crypto.randomUUID(),
          case_id: caseId,
          event_type: 'DOCUMENT_UPLOADED',
          description: `Documento sincronizado: "${title}"`,
          created_by: caseRow.judge_id,
        });

        console.log(`✅ Agregado: ${fileUrl}`);
        addedCount++;
      }
    }
  }

  console.log(`\\n🎉 Sincronización completada. Se agregaron ${addedCount} documentos a la base de datos.`);
}

syncDocuments().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
