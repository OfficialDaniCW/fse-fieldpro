import { getDb, setCors, handleOptions } from '../_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const sql = getDb();
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM conversations WHERE id = ${id}`;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      return res.json(rows[0]);
    }

    if (req.method === 'PUT') {
      const data = req.body;
      const rows = await sql`
        UPDATE conversations SET
          messages = COALESCE(${data.messages ? JSON.stringify(data.messages) : null}::jsonb, messages),
          metadata = COALESCE(${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb, metadata)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM conversations WHERE id = ${id}`;
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Conversation [id] API error:', err);
    res.status(500).json({ error: err.message });
  }
}
