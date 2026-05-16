import { getDb, setCors, handleOptions } from './_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const parts = await sql`SELECT * FROM parts ORDER BY created_date DESC`;
      return res.json(parts);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const part = await sql`
        INSERT INTO parts (
          part_number, description, manufacturer_part_ref, brand, pump_model,
          system_area, component_type, image_url, manual_ids, notes, is_verified
        ) VALUES (
          ${data.part_number || ''}, ${data.description || null}, ${data.manufacturer_part_ref || null},
          ${data.brand || null}, ${data.pump_model || null}, ${data.system_area || null},
          ${data.component_type || null}, ${data.image_url || null},
          ${data.manual_ids || []}, ${data.notes || null}, ${data.is_verified || false}
        )
        RETURNING *
      `;
      return res.status(201).json(part[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Parts API error:', err);
    res.status(500).json({ error: err.message });
  }
}
