import { getDb, setCors, handleOptions } from '../../_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sql = getDb();
  const { id } = req.query;
  const message = req.body;

  try {
    const rows = await sql`SELECT messages FROM conversations WHERE id = ${id}`;
    if (!rows[0]) return res.status(404).json({ error: 'Conversation not found' });

    const messages = rows[0].messages || [];
    const newMessage = {
      ...message,
      id: crypto.randomUUID(),
      created_date: new Date().toISOString(),
    };
    messages.push(newMessage);

    const updated = await sql`
      UPDATE conversations SET messages = ${JSON.stringify(messages)}::jsonb
      WHERE id = ${id}
      RETURNING *
    `;
    return res.status(201).json(updated[0]);
  } catch (err) {
    console.error('Conversation messages API error:', err);
    res.status(500).json({ error: err.message });
  }
}
