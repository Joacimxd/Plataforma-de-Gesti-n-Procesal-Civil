import { db } from '../services/db.js';

export async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7); // Token is literally just the user_id now
  try {
    const { data: user, error } = await db
      .from('users')
      .select('id, email, full_name, role, avatar_url')
      .eq('id', token)
      .single();

    if (error || !user) {
      return res.status(403).json({ error: 'Profile not found; complete registration or sign in again' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
