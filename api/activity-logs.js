import { getDb, setCors, handleOptions } from './_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const { limit = 200 } = req.query;
      const logs = await sql`
        SELECT * FROM activity_logs
        ORDER BY created_date DESC
        LIMIT ${parseInt(limit)}
      `;
      return res.json(logs);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const log = await sql`
        INSERT INTO activity_logs (entity_type, entity_id, action, details, user_id)
        VALUES (
          ${data.entity_type || null}, ${data.entity_id || null},
          ${data.action || null}, ${JSON.stringify(data.details || null)}, ${data.user_id || null}
        )
        RETURNING *
      `;
      return res.status(201).json(log[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Activity logs API error:', err);
    res.status(500).json({ error: err.message });
  }
}
