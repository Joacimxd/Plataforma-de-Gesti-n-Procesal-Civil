/**
 * Supabase Seed Script
 * 
 * Run with: node server/scripts/seed.js
 * 
 * Prerequisites:
 *   1. Run supabase-schema.sql in Supabase SQL Editor
 *   2. Create a Storage bucket named "documents" (public)
 *   3. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// SEED DATA
// ============================================================

const USERS = [
  {
    id: 'a1b2c3d4-0001-0001-0001-a1b2c3d4e5f6',
    email: 'judge@example.com',
    password: 'admin123',
    full_name: 'Hon. Magistrada Elena Martínez',
    role: 'JUDGE',
    avatar_url: null,
  },
  {
    id: 'a1b2c3d4-0002-0002-0002-a1b2c3d4e5f6',
    email: 'plaintiff@example.com',
    password: 'admin123',
    full_name: 'Lic. Carlos Torres Vega',
    role: 'PLAINTIFF_LAWYER',
    avatar_url: null,
  },
  {
    id: 'a1b2c3d4-0003-0003-0003-a1b2c3d4e5f6',
    email: 'defense@example.com',
    password: 'admin123',
    full_name: 'Lic. Sofía García Ruiz',
    role: 'DEFENSE_LAWYER',
    avatar_url: null,
  },
  {
    id: 'a1b2c3d4-0004-0004-0004-a1b2c3d4e5f6',
    email: 'plaintiff2@example.com',
    password: 'admin123',
    full_name: 'Lic. Roberto Mendoza Flores',
    role: 'PLAINTIFF_LAWYER',
    avatar_url: null,
  },
  {
    id: 'a1b2c3d4-0005-0005-0005-a1b2c3d4e5f6',
    email: 'defense2@example.com',
    password: 'admin123',
    full_name: 'Lic. Ana Beatriz Herrera',
    role: 'DEFENSE_LAWYER',
    avatar_url: null,
  },
];

const JUDGE_ID = USERS[0].id;
const PLAINTIFF_1 = USERS[1].id;
const PLAINTIFF_2 = USERS[3].id;
const DEFENSE_1 = USERS[2].id;
const DEFENSE_2 = USERS[4].id;

const CASE_TEMPLATES = [
  { title: 'Disputa de Propiedad Inmobiliaria', status: 'OPEN', plaintiff: PLAINTIFF_1, defense: DEFENSE_1 },
  { title: 'Incumplimiento de Contrato Comercial', status: 'IN_PROGRESS', plaintiff: PLAINTIFF_2, defense: DEFENSE_2 },
  { title: 'Demanda por Daños y Perjuicios', status: 'OPEN', plaintiff: PLAINTIFF_1, defense: DEFENSE_2 },
  { title: 'Desalojo por Falta de Pago', status: 'CLOSED', plaintiff: PLAINTIFF_2, defense: DEFENSE_1 },
  { title: 'Divorcio y Custodia de Menores', status: 'IN_PROGRESS', plaintiff: PLAINTIFF_1, defense: DEFENSE_1 },
  { title: 'Ejecución Hipotecaria', status: 'OPEN', plaintiff: PLAINTIFF_2, defense: DEFENSE_2 },
  { title: 'Reclamo de Herencia', status: 'IN_PROGRESS', plaintiff: PLAINTIFF_1, defense: DEFENSE_2 },
  { title: 'Conflicto Vecinal por Linderos', status: 'CLOSED', plaintiff: PLAINTIFF_2, defense: DEFENSE_1 },
  { title: 'Indemnización por Accidente de Tránsito', status: 'OPEN', plaintiff: PLAINTIFF_1, defense: DEFENSE_1 },
  { title: 'Nulidad de Testamento', status: 'IN_PROGRESS', plaintiff: PLAINTIFF_2, defense: DEFENSE_2 },
  { title: 'Reclamación de Deuda Comercial', status: 'OPEN', plaintiff: PLAINTIFF_1, defense: DEFENSE_2 },
  { title: 'Custodia de Bienes en Quiebra', status: 'CLOSED', plaintiff: PLAINTIFF_2, defense: DEFENSE_1 },
  { title: 'Fraude Contractual Inmobiliario', status: 'IN_PROGRESS', plaintiff: PLAINTIFF_1, defense: DEFENSE_1 },
  { title: 'Adopción Internacional Impugnada', status: 'OPEN', plaintiff: PLAINTIFF_2, defense: DEFENSE_2 },
  { title: 'Accidente Laboral e Incapacidad', status: 'IN_PROGRESS', plaintiff: PLAINTIFF_1, defense: DEFENSE_2 },
];

const DESCRIPTIONS = [
  'Caso relacionado con la disputa de bienes raíces en la colonia Polanco. Las partes no han llegado a un acuerdo extrajudicial. Expediente civil número ',
  'Litigio derivado del incumplimiento de obligaciones contractuales en operación comercial firmada en ',
  'Demanda de resarcimiento económico por daños sufridos. Se solicita peritaje técnico para determinar montos. Ref. ',
  'Procedimiento de desalojo iniciado por falta de pago de rentas acumuladas. Notificación previa realizada. Exp. ',
  'Proceso de separación legal y determinación de custodia de hijos menores. Se requiere estudio socioeconómico. Ref. ',
];

const EVENT_TYPES = [
  { type: 'CASE_CREATED', desc: (title) => `El caso "${title}" ha sido abierto y asignado al juzgado.` },
  { type: 'DOCUMENT_UPLOADED', desc: () => 'La parte demandante presentó escrito inicial de demanda.' },
  { type: 'STATUS_CHANGED', desc: () => 'El estado del caso fue actualizado a En Progreso por instrucción del juzgado.' },
  { type: 'HEARING_SCHEDULED', desc: () => 'Se agendó audiencia preliminar para revisión de pruebas.' },
  { type: 'DOCUMENT_UPLOADED', desc: () => 'La defensa presentó escrito de contestación de demanda.' },
];

// ============================================================
// SEED FUNCTIONS
// ============================================================

async function seedUsers() {
  console.log('👤 Seeding users...');
  const { error } = await db.from('users').upsert(USERS, { onConflict: 'email' });
  if (error) throw new Error(`Failed to seed users: ${error.message}`);
  console.log(`   ✅ ${USERS.length} users seeded`);
}

async function seedCases() {
  console.log('📁 Seeding cases...');

  const { data: existing } = await db.from('cases').select('id').limit(1);
  if (existing && existing.length > 0) {
    console.log('   ⚠️  Cases already exist, skipping case seed');
    return;
  }

  const casesToInsert = CASE_TEMPLATES.map((t, i) => ({
    id: crypto.randomUUID(),
    title: `${t.title} - Exp. #${202600 + i}`,
    description: `${DESCRIPTIONS[i % DESCRIPTIONS.length]}${202600 + i}.`,
    status: t.status,
    judge_id: JUDGE_ID,
  }));

  const { data: insertedCases, error: casesError } = await db
    .from('cases')
    .insert(casesToInsert)
    .select('id, title, status');

  if (casesError) throw new Error(`Failed to seed cases: ${casesError.message}`);

  console.log(`   ✅ ${insertedCases.length} cases seeded`);

  // Seed participants and events
  console.log('👥 Seeding participants...');
  const participants = insertedCases.map((c, i) => [
    { id: crypto.randomUUID(), case_id: c.id, user_id: CASE_TEMPLATES[i].plaintiff, side: 'PLAINTIFF' },
    { id: crypto.randomUUID(), case_id: c.id, user_id: CASE_TEMPLATES[i].defense, side: 'DEFENSE' },
  ]).flat();

  const { error: partError } = await db.from('case_participants').insert(participants);
  if (partError) throw new Error(`Failed to seed participants: ${partError.message}`);
  console.log(`   ✅ ${participants.length} participants seeded`);

  console.log('📅 Seeding events...');
  const events = [];
  insertedCases.forEach((c, i) => {
    const eventsToAdd = i % 3 === 0 ? 1 : i % 3 === 1 ? 3 : 5;
    for (let e = 0; e < Math.min(eventsToAdd, EVENT_TYPES.length); e++) {
      const evDef = EVENT_TYPES[e];
      events.push({
        id: crypto.randomUUID(),
        case_id: c.id,
        event_type: evDef.type,
        description: evDef.desc(c.title),
        created_by: e === 0 ? JUDGE_ID : (e % 2 === 0 ? CASE_TEMPLATES[i].plaintiff : CASE_TEMPLATES[i].defense),
        created_at: new Date(Date.now() - (eventsToAdd - e) * 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  });

  const { error: eventsError } = await db.from('case_events').insert(events);
  if (eventsError) throw new Error(`Failed to seed events: ${eventsError.message}`);
  console.log(`   ✅ ${events.length} events seeded`);

  // Seed a few notifications
  console.log('🔔 Seeding notifications...');
  const notifications = [
    { id: crypto.randomUUID(), user_id: PLAINTIFF_1, case_id: insertedCases[0].id, message: `Nuevo documento subido al caso "${insertedCases[0].title}"`, is_read: false },
    { id: crypto.randomUUID(), user_id: PLAINTIFF_1, case_id: insertedCases[2].id, message: `El estado del caso "${insertedCases[2].title}" ha sido actualizado.`, is_read: true },
    { id: crypto.randomUUID(), user_id: DEFENSE_1, case_id: insertedCases[0].id, message: `Nueva audiencia programada en "${insertedCases[0].title}"`, is_read: false },
    { id: crypto.randomUUID(), user_id: JUDGE_ID, case_id: insertedCases[1].id, message: `La defensa presentó contestación en "${insertedCases[1].title}"`, is_read: false },
  ];

  const { error: notifError } = await db.from('notifications').insert(notifications);
  if (notifError) throw new Error(`Failed to seed notifications: ${notifError.message}`);
  console.log(`   ✅ ${notifications.length} notifications seeded`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('\n🚀 Seeding Supabase database...\n');
  console.log(`   URL: ${supabaseUrl}\n`);

  try {
    await seedUsers();
    await seedCases();

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📋 Demo credentials:');
    console.log('   judge@example.com        / admin123  (Juez)');
    console.log('   plaintiff@example.com    / admin123  (Abogado Demandante)');
    console.log('   plaintiff2@example.com   / admin123  (Abogado Demandante)');
    console.log('   defense@example.com      / admin123  (Abogado Defensa)');
    console.log('   defense2@example.com     / admin123  (Abogado Defensa)\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
}

main();
