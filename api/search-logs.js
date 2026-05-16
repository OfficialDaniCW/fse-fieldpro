import { getDb, setCors, handleOptions } from './_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const { limit = 500 } = req.query;
      const logs = await sql`
        SELECT * FROM search_logs
        ORDER BY created_date DESC
        LIMIT ${parseInt(limit)}
      `;
      return res.json(logs);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const log = await sql`
        INSERT INTO search_logs (query, result_type, result_count, user_id)
        VALUES (${data.query || ''}, ${data.result_type || null}, ${data.result_count ?? null}, ${data.user_id || null})
        RETURNING *
      `;
      return res.status(201).json(log[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Search logs API error:', err);
    res.status(500).json({ error: err.message });
  }
}
