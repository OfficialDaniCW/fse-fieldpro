import { getDb, setCors, handleOptions } from './_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const { part_id } = req.query;
      const rows = part_id
        ? await sql`SELECT * FROM part_verifications WHERE part_id = ${part_id} ORDER BY created_date DESC`
        : await sql`SELECT * FROM part_verifications ORDER BY created_date DESC`;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const row = await sql`
        INSERT INTO part_verifications (part_id, status, notes, verified_by)
        VALUES (${data.part_id || null}, ${data.status || null}, ${data.notes || null}, ${data.verified_by || null})
        RETURNING *
      `;
      return res.status(201).json(row[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Part verifications API error:', err);
    res.status(500).json({ error: err.message });
  }
}
