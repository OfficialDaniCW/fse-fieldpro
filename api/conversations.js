import { getDb, setCors, handleOptions } from './_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const convs = await sql`SELECT * FROM conversations ORDER BY updated_date DESC LIMIT 50`;
      return res.json(convs);
    }

    if (req.method === 'POST') {
      const { agent_name, metadata, user_id } = req.body || {};
      const conv = await sql`
        INSERT INTO conversations (agent_name, metadata, messages, user_id)
        VALUES (${agent_name || null}, ${JSON.stringify(metadata || null)}, '[]'::jsonb, ${user_id || null})
        RETURNING *
      `;
      return res.status(201).json(conv[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Conversations API error:', err);
    res.status(500).json({ error: err.message });
  }
}
