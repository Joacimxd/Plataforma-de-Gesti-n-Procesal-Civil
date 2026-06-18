import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
}

// Inicializamos el cliente oficial de Supabase.
// Lo exportamos como 'db' para que todos tus otros archivos que 
// usan db.from('tabla').select() sigan funcionando sin cambios.
export const db = createClient(supabaseUrl, supabaseKey);